import { NextResponse } from 'next/server';
import { getNotifications, getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await getNotifications();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notifications: data });
}

export async function POST(request: Request) {
  const { title, body: msgBody, target, targetUserId } = await request.json();

  const supabase = getSupabase();

  // Insert notification
  const { data: notification, error: insertError } = await supabase
    .from('notifications')
    .insert({
      type: 'admin',
      title,
      message: msgBody,
      target: target || 'all',
      target_user_id: targetUserId || null,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error('Notification insert error:', insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Trigger FCM push via Edge Function (non-blocking)
  try {
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notify`;
    await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({ title, body: msgBody, target, target_user_id: targetUserId }),
    });
  } catch (e) {
    console.log('Edge Function notify skipped:', e);
  }

  return NextResponse.json({ notification });
}
