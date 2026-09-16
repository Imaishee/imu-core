import { NextResponse } from 'next/server';
import { getActivityLog } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await getActivityLog();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data });
}
