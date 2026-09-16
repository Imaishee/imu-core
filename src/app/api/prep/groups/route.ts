import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const examKey = searchParams.get('exam');

    if (!examKey) {
      return NextResponse.json({ error: 'exam param required' }, { status: 400 });
    }

    const result = await query(`
      SELECT pg.*, 
        (SELECT json_agg(json_build_object(
          'id', pt.id, 'name', pt.name, 'importance', pt.importance
        ) ORDER BY pt.importance DESC, pt.name)
        FROM prep_topics pt WHERE pt.group_id = pg.id) as topics,
        (SELECT COUNT(*) FROM prep_topics pt WHERE pt.group_id = pg.id) as topic_count
      FROM prep_groups pg
      JOIN prep_exams pe ON pe.id = pg.exam_id
      WHERE pe.exam_key = $1
      ORDER BY pg.group_number
    `, [examKey]);

    return NextResponse.json({ data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
