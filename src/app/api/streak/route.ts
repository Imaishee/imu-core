import { NextResponse } from 'next/server';
import { query, OWNER_USER_ID } from '@/lib/db';

export async function GET() {
  try {
    const profile = await query(
      'SELECT streak_days, longest_streak, last_active_date FROM user_game_profile WHERE user_id = $1',
      [OWNER_USER_ID]
    );

    const today = new Date().toISOString().split('T')[0];
    const p = profile.rows[0];
    const isActiveToday = p?.last_active_date === today;

    return NextResponse.json({
      data: {
        streak_days: p?.streak_days || 0,
        longest_streak: p?.longest_streak || 0,
        last_active_date: p?.last_active_date || null,
        is_active_today: isActiveToday,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const profile = await query(
      'SELECT streak_days, longest_streak, last_active_date FROM user_game_profile WHERE user_id = $1',
      [OWNER_USER_ID]
    );
    const p = profile.rows[0];

    if (p?.last_active_date === today) {
      return NextResponse.json({ data: { streak_days: p.streak_days, message: 'Already active today' } });
    }

    let newStreak = 1;
    if (p?.last_active_date === yesterday) {
      newStreak = (p.streak_days || 0) + 1;
    }

    const newLongest = Math.max(newStreak, p?.longest_streak || 0);

    const result = await query(
      `UPDATE user_game_profile SET streak_days = $1, longest_streak = $2, last_active_date = $3 WHERE user_id = $4 RETURNING streak_days, longest_streak`,
      [newStreak, newLongest, today, OWNER_USER_ID]
    );

    return NextResponse.json({ data: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
