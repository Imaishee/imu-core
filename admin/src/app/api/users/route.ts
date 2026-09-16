import { NextResponse } from 'next/server';
import { getUsers, banUser } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await getUsers();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data });
}

export async function PATCH(request: Request) {
  const { userId, banned } = await request.json();
  const { error } = await banUser(userId, banned);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
