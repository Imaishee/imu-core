import { NextResponse } from 'next/server';
import { query, OWNER_USER_ID } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      `SELECT gs.*, gt.title as game_type_title, gt.icon as game_type_icon
       FROM game_sessions gs
       LEFT JOIN game_types gt ON gt.slug = gs.game_type
       WHERE gs.user_id = $1
       ORDER BY gs.created_at DESC LIMIT 20`,
      [OWNER_USER_ID]
    );
    return NextResponse.json({ data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
