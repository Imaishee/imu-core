import { NextResponse } from 'next/server';
import { query, OWNER_USER_ID } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { prepTopicId, status, confidence } = await request.json();

    const validStatuses = ['not_started', 'in_progress', 'done', 'revision'];
    const safeStatus = validStatuses.includes(status) ? status : 'in_progress';
    const safeConfidence = Math.min(Math.max(Math.round(confidence || 3), 0), 5);

    const result = await query(`
      INSERT INTO prep_progress (user_id, prep_topic_id, status, confidence, last_studied_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, prep_topic_id) 
      DO UPDATE SET status = $3, confidence = $4, last_studied_at = NOW(), updated_at = NOW()
      RETURNING *
    `, [OWNER_USER_ID, prepTopicId, safeStatus, safeConfidence]);

    return NextResponse.json({ data: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
