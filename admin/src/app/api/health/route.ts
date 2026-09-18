import { NextResponse } from 'next/server';
import { getEngineHealth, getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getSupabase();

  const [engine, dbCheck] = await Promise.all([
    getEngineHealth(),
    supabase.from('conversations').select('id', { count: 'exact', head: true }).then(
      r => ({ status: r.error ? 'error' : 'ok', error: r.error?.message }),
      e => ({ status: 'error', error: e.message })
    ),
  ]);

  return NextResponse.json({
    engine,
    database: dbCheck,
    timestamp: new Date().toISOString(),
  });
}
