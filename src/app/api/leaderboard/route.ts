import { NextResponse } from 'next/server';
import { query, OWNER_USER_ID } from '@/lib/db';

export async function GET() {
  try {
    const profile = await query(
      'SELECT xp_total, level, level_title, streak_days, games_played, games_won FROM user_game_profile WHERE user_id = $1',
      [OWNER_USER_ID]
    );

    const p = profile.rows[0] || { xp_total: 0, level: 1, level_title: 'Novice', streak_days: 0, games_played: 0, games_won: 0 };

    const weeklyXP = await query(
      `SELECT EXTRACT(DOW FROM created_at) as day_num, SUM(amount) as xp
       FROM xp_transactions WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY day_num ORDER BY day_num`,
      [OWNER_USER_ID]
    );

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyHistory = Array.from({ length: 7 }, (_, i) => {
      const row = weeklyXP.rows.find((r: any) => parseInt(r.day_num) === i);
      return { day: dayNames[i], xp: parseInt(row?.xp || '0') };
    });

    const xpBySource = await query(
      `SELECT source, SUM(amount) as xp FROM xp_transactions WHERE user_id = $1 GROUP BY source`,
      [OWNER_USER_ID]
    );
    const sourceMap = new Map(xpBySource.rows.map((r: any) => [r.source, parseInt(r.xp)]));

    return NextResponse.json({
      data: {
        rank: 1,
        totalXP: p.xp_total,
        weeklyXP: weeklyHistory.reduce((sum: number, d: any) => sum + d.xp, 0),
        level: p.level,
        levelTitle: p.level_title,
        streak: p.streak_days,
        gamesWon: p.games_won,
        weeklyHistory,
        xpComparison: [
          { label: 'Study', value: sourceMap.get('study') || 0, color: 'bg-blue-500' },
          { label: 'Games', value: sourceMap.get('game') || 0, color: 'bg-purple-500' },
          { label: 'Tasks', value: sourceMap.get('task') || 0, color: 'bg-green-500' },
          { label: 'Streaks', value: sourceMap.get('streak') || 0, color: 'bg-orange-500' },
        ],
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
