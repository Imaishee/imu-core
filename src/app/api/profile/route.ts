import { NextResponse } from 'next/server';
import { query, OWNER_USER_ID } from '@/lib/db';

export async function GET() {
  try {
    const existing = await query(
      'SELECT * FROM user_game_profile WHERE user_id = $1',
      [OWNER_USER_ID]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ data: existing.rows[0] });
    }

    const levelDef = await query(
      'SELECT * FROM level_definitions WHERE level_number = 1'
    );

    const levelTitle = levelDef.rows[0]?.title || 'Novice';

    const result = await query(
      `INSERT INTO user_game_profile (user_id, display_name, xp_total, xp_weekly, level, level_title, streak_days, longest_streak, total_study_minutes, games_played, games_won)
       VALUES ($1, 'Player', 0, 0, 1, $2, 0, 0, 0, 0, 0)
       RETURNING *`,
      [OWNER_USER_ID, levelTitle]
    );

    return NextResponse.json({ data: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { display_name, avatar_url } = body;

    const sets: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let idx = 1;

    if (display_name !== undefined) { sets.push(`display_name = $${idx++}`); values.push(display_name); }
    if (avatar_url !== undefined) { sets.push(`avatar_url = $${idx++}`); values.push(avatar_url); }

    values.push(OWNER_USER_ID);
    const result = await query(
      `UPDATE user_game_profile SET ${sets.join(', ')} WHERE user_id = $${idx} RETURNING *`,
      values
    );

    return NextResponse.json({ data: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
