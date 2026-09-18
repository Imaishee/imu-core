import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { users, error } = await getUsers();
  if (error) return NextResponse.json({ error: error.message || error }, { status: 500 });
  return NextResponse.json({ users, total: users.length });
}
