import { NextResponse } from 'next/server';
import { query, OWNER_USER_ID } from '@/lib/db';

export async function GET() {
  try {
    const profile = await query(
      'SELECT * FROM user_game_profile WHERE user_id = $1',
      [OWNER_USER_ID]
    );
    const p = profile.rows[0] || { xp_total: 0, level: 1, level_title: 'Novice', streak_days: 0, longest_streak: 0, games_played: 0, games_won: 0, total_study_minutes: 0 };

    const levelDef = await query(
      'SELECT * FROM level_definitions WHERE level_number = $1',
      [p.level]
    );
    const nextLevelDef = await query(
      'SELECT * FROM level_definitions WHERE level_number = $1',
      [p.level + 1]
    );

    const currentLvl = levelDef.rows[0];
    const nextLvl = nextLevelDef.rows[0];
    const xpInLevel = p.xp_total - (currentLvl?.xp_required || 0);
    const xpForNext = (nextLvl?.xp_required || currentLvl?.xp_required || 100) - (currentLvl?.xp_required || 0);
    const levelProgress = xpForNext > 0 ? Math.min((xpInLevel / xpForNext) * 100, 100) : 0;

    const achievementsEarned = await query(
      'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = $1',
      [OWNER_USER_ID]
    );
    const achievementsTotal = await query('SELECT COUNT(*) as count FROM achievement_definitions');

    const weeklyXP = await query(
      `SELECT SUM(amount) as xp FROM xp_transactions WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'`,
      [OWNER_USER_ID]
    );

    const weeklyHistory = await query(
      `SELECT TO_CHAR(created_at, 'Dy') as day, SUM(amount) as xp
       FROM xp_transactions WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY TO_CHAR(created_at, 'Dy'), EXTRACT(DOW FROM created_at)
       ORDER BY EXTRACT(DOW FROM created_at)`,
      [OWNER_USER_ID]
    );

    const xpBySource = await query(
      `SELECT source, SUM(amount) as xp FROM xp_transactions WHERE user_id = $1 GROUP BY source`,
      [OWNER_USER_ID]
    );
    const sourceMap = new Map(xpBySource.rows.map((r: any) => [r.source, parseInt(r.xp)]));

    return NextResponse.json({
      data: {
        totalXP: p.xp_total,
        level: p.level,
        levelTitle: p.level_title,
        levelProgress,
        xpInLevel,
        xpForNext,
        currentStreak: p.streak_days,
        longestStreak: p.longest_streak,
        totalStudyMinutes: p.total_study_minutes,
        gamesPlayed: p.games_played,
        gamesWon: p.games_won,
        achievementsEarned: parseInt(achievementsEarned.rows[0]?.count || '0'),
        achievementsTotal: parseInt(achievementsTotal.rows[0]?.count || '0'),
        weeklyXP: parseInt(weeklyXP.rows[0]?.xp || '0'),
        weeklyHistory: weeklyHistory.rows.map((r: any) => ({ day: r.day, xp: parseInt(r.xp) })),
        studyXP: sourceMap.get('study') || 0,
        gamesXP: sourceMap.get('game') || 0,
        tasksXP: sourceMap.get('task') || 0,
        streaksXP: sourceMap.get('streak') || 0,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
