import { NextResponse } from 'next/server';
import { getNotifications, sendNotification } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await getNotifications();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notifications: data });
}

export async function POST(request: Request) {
  const { title, body, target, targetUserId } = await request.json();
  const { data, error } = await sendNotification(title, body, target, targetUserId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notification: data });
}
