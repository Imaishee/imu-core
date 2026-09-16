import { NextResponse } from 'next/server';
import { getUsers, banUser, getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await getUsers();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data });
}

export async function PATCH(request: Request) {
  const { userId, banned } = await request.json();
  const { error } = await banUser(userId, banned);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const supabase = getSupabase();
  await supabase.from('activity_log').insert({
    action: banned ? 'user_banned' : 'user_unbanned',
    target_type: 'user',
    target_id: userId,
    metadata: { banned },
  });

  return NextResponse.json({ success: true });
}
