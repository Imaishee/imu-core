import { NextResponse } from 'next/server';
import { query, OWNER_USER_ID } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      `SELECT t.*, s.name as subject_name FROM tasks t
       LEFT JOIN subjects s ON s.id = t.subject_id
       WHERE t.user_id = $1 ORDER BY t.created_at DESC`,
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
    const { title, description, subjectId, dueDate, priority } = body;

    const result = await query(
      `INSERT INTO tasks (user_id, title, description, subject_id, due_date, priority)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [OWNER_USER_ID, title, description || '', subjectId || null, dueDate || null, priority || 'medium']
    );
    return NextResponse.json({ data: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const result = await query(
      'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, id, OWNER_USER_ID]
    );

    if (status === 'completed') {
      const xpAmount = 15;
      await query(
        'INSERT INTO xp_transactions (user_id, amount, source, description) VALUES ($1, $2, $3, $4)',
        [OWNER_USER_ID, xpAmount, 'task', 'Task completed']
      );
      await query(
        'UPDATE user_game_profile SET xp_total = xp_total + $1, xp_weekly = xp_weekly + $1 WHERE user_id = $2',
        [xpAmount, OWNER_USER_ID]
      );
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
