import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('app_versions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ versions: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('app_versions')
    .insert({
      version: body.version,
      download_url: body.download_url,
      release_notes: body.release_notes || '',
      force_update: body.force_update || false,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('activity_log').insert({
    action: 'version_published',
    target_type: 'app_version',
    target_id: data?.id,
    metadata: { version: body.version },
  });

  return NextResponse.json({ version: data });
}
