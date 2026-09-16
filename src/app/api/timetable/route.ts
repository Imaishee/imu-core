import { NextResponse } from 'next/server';
import { query, OWNER_USER_ID } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dayOfWeek = searchParams.get('day');
    const baseQuery = `
      SELECT tt.*, s.code as subject_code, s.name as subject_name
      FROM timetable_entries tt
      LEFT JOIN subjects s ON s.id = tt.subject_id
      WHERE tt.user_id = $1
    `;
    const params: any[] = [OWNER_USER_ID];

    if (dayOfWeek) {
      params.push(parseInt(dayOfWeek));
      const result = await query(`${baseQuery} AND tt.day_of_week = $2 ORDER BY tt.start_time`, params);
      return NextResponse.json({ data: result.rows });
    }

    const result = await query(`${baseQuery} ORDER BY tt.day_of_week, tt.start_time`, params);
    return NextResponse.json({ data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
