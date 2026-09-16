import { NextResponse } from 'next/server';
import { query, OWNER_USER_ID } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      `SELECT s.*, COUNT(t.id) as topic_count,
       COUNT(pr.id) FILTER (WHERE pr.status = 'completed') as done_count
       FROM subjects s
       LEFT JOIN units u ON u.subject_id = s.id
       LEFT JOIN topics t ON t.unit_id = u.id
       LEFT JOIN progress_records pr ON pr.topic_id = t.id AND pr.user_id = $1
       GROUP BY s.id ORDER BY s.code`,
      [OWNER_USER_ID]
    );
    return NextResponse.json({ data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
