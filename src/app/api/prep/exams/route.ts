import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const exams = await query('SELECT * FROM prep_exams ORDER BY sort_order');
    return NextResponse.json({ data: exams.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
