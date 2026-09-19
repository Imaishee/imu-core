import { NextResponse } from 'next/server';
import { getEngineHealth, getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function getHFSpaceHealth() {
  const url = 'https://shubham1440-imu-heart.hf.space/gradio_api/call/chat_fn';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: ['test', null] }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (resp.ok || resp.status === 200) {
      return { status: 'online', url, latency: 'OK' };
    }
    return { status: 'error', url, error: `HTTP ${resp.status}` };
  } catch (e: any) {
    return { status: 'offline', url, error: e.message || 'Connection failed' };
  }
}

export async function GET() {
  const supabase = getSupabase();

  const [engine, dbCheck, hfSpace] = await Promise.all([
    getEngineHealth(),
    supabase.from('conversations').select('id', { count: 'exact', head: true }).then(
      r => ({ status: r.error ? 'error' : 'ok', error: r.error?.message }),
      e => ({ status: 'error', error: e.message })
    ),
    getHFSpaceHealth(),
  ]);

  return NextResponse.json({
    engine,
    database: dbCheck,
    hfSpace,
    timestamp: new Date().toISOString(),
  });
}
