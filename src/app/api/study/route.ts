import { NextResponse } from 'next/server';
import { query, OWNER_USER_ID } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      `SELECT ss.*, s.name as subject_name FROM study_sessions ss
       LEFT JOIN subjects s ON s.id = ss.subject_id
       WHERE ss.user_id = $1 ORDER BY ss.started_at DESC LIMIT 20`,
      [OWNER_USER_ID]
    );
    return NextResponse.json({ data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subjectId, topicId, durationMinutes, sessionType, notes } = body;

    const result = await query(
      `INSERT INTO study_sessions (user_id, subject_id, topic_id, duration_minutes, session_type, notes, ended_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [OWNER_USER_ID, subjectId || null, topicId || null, durationMinutes || 30, sessionType || 'reading', notes || '']
    );

    await query(
      'UPDATE user_game_profile SET total_study_minutes = total_study_minutes + $1 WHERE user_id = $2',
      [durationMinutes || 30, OWNER_USER_ID]
    );

    const xpAmount = Math.min((durationMinutes || 30) * 0.5, 25);
    await query(
      'INSERT INTO xp_transactions (user_id, amount, source, description) VALUES ($1, $2, $3, $4)',
      [OWNER_USER_ID, Math.round(xpAmount), 'study', `Study: ${durationMinutes || 30} min`]
    );
    await query(
      'UPDATE user_game_profile SET xp_total = xp_total + $1, xp_weekly = xp_weekly + $1 WHERE user_id = $2',
      [Math.round(xpAmount), OWNER_USER_ID]
    );

    return NextResponse.json({ data: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
