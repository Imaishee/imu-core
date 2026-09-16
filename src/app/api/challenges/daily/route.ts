import { NextResponse } from 'next/server';
import { query, OWNER_USER_ID } from '@/lib/db';

function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const CHALLENGE_TEMPLATES = [
  { type: 'study_minutes', title: 'Study Session', description: (n: number) => `Study for ${n} minutes`, target: () => [15, 30, 45, 60][Math.floor(Math.random() * 4)], xp: 30 },
  { type: 'complete_tasks', title: 'Task Master', description: (n: number) => `Complete ${n} tasks`, target: () => [1, 2, 3][Math.floor(Math.random() * 3)], xp: 25 },
  { type: 'play_games', title: 'Game Time', description: (n: number) => `Play ${n} games`, target: () => [1, 2, 3][Math.floor(Math.random() * 3)], xp: 35 },
  { type: 'review_topics', title: 'Topic Review', description: (n: number) => `Review ${n} topics`, target: () => [3, 5, 7][Math.floor(Math.random() * 3)], xp: 40 },
  { type: 'earn_xp', title: 'XP Hunter', description: (n: number) => `Earn ${n} XP`, target: () => [50, 100, 150][Math.floor(Math.random() * 3)], xp: 20 },
];

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existing = await query(
      'SELECT * FROM daily_challenges WHERE user_id = $1 AND challenge_date = $2',
      [OWNER_USER_ID, today]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ data: existing.rows });
    }

    const seed = new Date(today).getDate();
    const selected: any[] = [];
    const indices = new Set<number>();
    while (indices.size < 3) {
      indices.add(Math.floor(seededRandom(seed + indices.size) * CHALLENGE_TEMPLATES.length));
    }

    for (const idx of indices) {
      const tmpl = CHALLENGE_TEMPLATES[idx];
      const target = tmpl.target();
      const result = await query(
        `INSERT INTO daily_challenges (user_id, challenge_date, challenge_type, title, description, xp_reward, target_value)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [OWNER_USER_ID, today, tmpl.type, tmpl.title, tmpl.description(target), tmpl.xp, target]
      );
      selected.push(result.rows[0]);
    }

    return NextResponse.json({ data: selected });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { challengeId, increment = 1 } = body;

    const result = await query(
      `UPDATE daily_challenges SET current_value = current_value + $1,
       completed = (current_value + $1 >= target_value)
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [increment, challengeId, OWNER_USER_ID]
    );

    return NextResponse.json({ data: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
