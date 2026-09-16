import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const xp = searchParams.get('xp');

    if (xp) {
      const xpNum = parseInt(xp, 10);
      const result = await query(
        `SELECT * FROM level_definitions WHERE xp_required <= $1 ORDER BY level_number DESC LIMIT 1`,
        [xpNum]
      );
      const nextLevel = await query(
        `SELECT * FROM level_definitions WHERE xp_required > $1 ORDER BY level_number ASC LIMIT 1`,
        [xpNum]
      );
      return NextResponse.json({
        data: {
          current: result.rows[0] || null,
          next: nextLevel.rows[0] || null,
          xpInLevel: xpNum - (result.rows[0]?.xp_required || 0),
          xpForNext: (nextLevel.rows[0]?.xp_required || 0) - (result.rows[0]?.xp_required || 0),
        }
      });
    }

    const result = await query('SELECT * FROM level_definitions ORDER BY level_number ASC');
    return NextResponse.json({ data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
