import { NextResponse } from 'next/server';
import { query, OWNER_USER_ID } from '@/lib/db';

export async function GET() {
  try {
    const defs = await query('SELECT * FROM achievement_definitions ORDER BY xp_reward ASC');
    const earned = await query(
      'SELECT achievement_id, earned_at FROM user_achievements WHERE user_id = $1',
      [OWNER_USER_ID]
    );
    const earnedSet = new Map(earned.rows.map((r: any) => [r.achievement_id, r.earned_at]));

    const data = defs.rows.map((d: any) => ({
      ...d,
      earned: earnedSet.has(d.id),
      earned_at: earnedSet.get(d.id) || null,
    }));

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const profile = await query(
      'SELECT * FROM user_game_profile WHERE user_id = $1',
      [OWNER_USER_ID]
    );
    if (profile.rows.length === 0) return NextResponse.json({ data: [] });

    const p = profile.rows[0];
    const achievements = await query('SELECT * FROM achievement_definitions');
    const earned = await query(
      'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
      [OWNER_USER_ID]
    );
    const earnedIds = new Set(earned.rows.map((r: any) => r.achievement_id));

    const newAchievements: any[] = [];

    for (const a of achievements.rows) {
      if (earnedIds.has(a.id)) continue;
      const req = a.requirement;
      let qualifies = false;

      if (req.study_sessions && p.total_study_minutes >= (req.study_sessions * 30)) qualifies = true;
      if (req.streak_days && p.streak_days >= req.streak_days) qualifies = true;
      if (req.xp_total && p.xp_total >= req.xp_total) qualifies = true;
      if (req.games_played && p.games_played >= req.games_played) qualifies = true;

      if (qualifies) {
        await query(
          'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)',
          [OWNER_USER_ID, a.id]
        );
        await query(
          'INSERT INTO xp_transactions (user_id, amount, source, description) VALUES ($1, $2, $3, $4)',
          [OWNER_USER_ID, a.xp_reward, 'achievement', `Achievement: ${a.title}`]
        );
        await query(
          'UPDATE user_game_profile SET xp_total = xp_total + $1 WHERE user_id = $2',
          [a.xp_reward, OWNER_USER_ID]
        );
        newAchievements.push(a);
      }
    }

    return NextResponse.json({ data: newAchievements });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
