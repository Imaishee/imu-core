import { NextResponse } from 'next/server';
import { getFriends } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await getFriends();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ friends: data });
}
