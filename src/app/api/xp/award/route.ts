import { NextResponse } from 'next/server';
import { query, OWNER_USER_ID } from '@/lib/db';

const XP_RATES: Record<string, number> = {
  study: 10,
  task: 15,
  game: 20,
  streak: 30,
  achievement: 50,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { activity, multiplier = 1 } = body;

    const baseXP = XP_RATES[activity] || 10;
    const amount = Math.round(baseXP * multiplier);

    await query(
      'INSERT INTO xp_transactions (user_id, amount, source, description) VALUES ($1, $2, $3, $4)',
      [OWNER_USER_ID, amount, activity, `${activity} completion`]
    );

    const profile = await query(
      'UPDATE user_game_profile SET xp_total = xp_total + $1, xp_weekly = xp_weekly + $1 WHERE user_id = $2 RETURNING xp_total, level, level_title',
      [amount, OWNER_USER_ID]
    );

    const newXp = profile.rows[0]?.xp_total || 0;
    const levelDef = await query(
      'SELECT * FROM level_definitions WHERE xp_required <= $1 ORDER BY level_number DESC LIMIT 1',
      [newXp]
    );
    const newLevel = levelDef.rows[0]?.level_number || 1;
    const oldLevel = profile.rows[0]?.level || 1;
    const levelUp = newLevel > oldLevel;

    if (levelUp) {
      const newTitle = levelDef.rows[0]?.title || 'Novice';
      await query(
        'UPDATE user_game_profile SET level = $1, level_title = $2 WHERE user_id = $3',
        [newLevel, newTitle, OWNER_USER_ID]
      );
    }

    return NextResponse.json({
      data: { xpEarned: amount, totalXp: newXp, newLevel, levelUp, oldLevel }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
