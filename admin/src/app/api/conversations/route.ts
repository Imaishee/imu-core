import { NextResponse } from 'next/server';
import { getConversations, getUserConversations } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || undefined;

  if (userId) {
    const { conversations, error } = await getUserConversations(userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ conversations });
  }

  const { data, error } = await getConversations();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversations: data });
}
