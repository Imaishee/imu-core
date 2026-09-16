import { NextResponse } from 'next/server';
import { query, OWNER_USER_ID } from '@/lib/db';

export async function GET() {
  try {
    const types = await query('SELECT * FROM game_types ORDER BY min_level ASC');
    const stats = await query(
      `SELECT game_type, COUNT(*) as played, COUNT(*) FILTER (WHERE completed AND perfect) as won,
       AVG(score) as avg_score, MAX(score) as best_score, SUM(time_spent_sec) as total_time
       FROM game_sessions WHERE user_id = $1 GROUP BY game_type`,
      [OWNER_USER_ID]
    );

    const statsMap = new Map(stats.rows.map((r: any) => [r.game_type, {
      played: parseInt(r.played), won: parseInt(r.won || '0'),
      bestScore: parseInt(r.best_score || '0'), avgScore: Math.round(parseFloat(r.avg_score || '0')),
      totalTime: parseInt(r.total_time || '0'),
    }]));

    const data = types.rows.map((t: any) => ({
      ...t,
      stats: statsMap.get(t.slug) || { played: 0, won: 0, bestScore: 0, avgScore: 0, totalTime: 0 },
    }));

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameType, subjectId, topicIds, score, maxScore, timeSpentSec, completed, perfect } = body;

    const typeResult = await query('SELECT * FROM game_types WHERE slug = $1', [gameType]);
    if (typeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Unknown game type' }, { status: 400 });
    }
    const gameTypeData = typeResult.rows[0];
    let xpEarned = gameTypeData.xp_per_play;
    if (perfect) xpEarned += gameTypeData.xp_bonus_perfect;

    const session = await query(
      `INSERT INTO game_sessions (user_id, game_type, subject_id, topic_ids, score, max_score, xp_earned, time_spent_sec, completed, perfect)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [OWNER_USER_ID, gameType, subjectId || null, topicIds || [], score || 0, maxScore || 100, xpEarned, timeSpentSec || 0, completed || false, perfect || false]
    );

    await query(
      'INSERT INTO xp_transactions (user_id, amount, source, description) VALUES ($1, $2, $3, $4)',
      [OWNER_USER_ID, xpEarned, 'game', `${gameType} game`]
    );

    await query(
      'UPDATE user_game_profile SET xp_total = xp_total + $1, xp_weekly = xp_weekly + $1, games_played = games_played + 1, games_won = games_won + $2 WHERE user_id = $3',
      [xpEarned, perfect ? 1 : 0, OWNER_USER_ID]
    );

    const profile = await query('SELECT xp_total FROM user_game_profile WHERE user_id = $1', [OWNER_USER_ID]);

    return NextResponse.json({ data: { session: session.rows[0], xpEarned, totalXp: profile.rows[0]?.xp_total || 0 } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
