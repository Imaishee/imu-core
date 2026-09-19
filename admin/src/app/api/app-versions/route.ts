import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: List all versions
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('app_versions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ versions: data });
}

// POST: Create new version (metadata only — APK uploaded directly to storage from client)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { version, release_notes, force_update, download_url, file_size } = body;

    if (!version) {
      return NextResponse.json({ error: 'Version is required' }, { status: 400 });
    }
    if (!download_url) {
      return NextResponse.json({ error: 'Download URL is required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Insert version record
    const { data, error: insertError } = await supabase
      .from('app_versions')
      .insert({
        version,
        download_url,
        release_notes: release_notes || '',
        force_update: force_update || false,
        file_size: file_size || 0,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: `Version ${version} already exists` }, { status: 409 });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ version: data });
  } catch (e: any) {
    console.error('[AppVersions] POST error:', e);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}

// DELETE: Remove a version
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Get the version to find the storage path
    const { data: version, error: fetchError } = await supabase
      .from('app_versions')
      .select('version, download_url')
      .eq('id', id)
      .single();

    if (fetchError || !version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Delete from storage if it's a Supabase-hosted file
    if (version.download_url.includes('apk-downloads')) {
      // Try both naming patterns
      const patterns = [
        `apks/imu_v${version.version}.apk`,
        `IMU-v${version.version}-arm64.apk`,
      ];
      for (const pattern of patterns) {
        await supabase.storage.from('apk-downloads').remove([pattern]).catch(() => {});
      }
    }

    // Delete the record
    const { error: deleteError } = await supabase
      .from('app_versions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
