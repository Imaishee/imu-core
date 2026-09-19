import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

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

// POST: Create new version (with APK upload)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const version = formData.get('version') as string;
    const releaseNotes = formData.get('release_notes') as string || '';
    const forceUpdate = formData.get('force_update') === 'true';
    const apkFile = formData.get('apk') as File | null;

    if (!version) {
      return NextResponse.json({ error: 'Version is required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Upload APK to Supabase Storage if provided
    let downloadUrl = formData.get('download_url') as string || '';

    if (apkFile && apkFile.size > 0) {
      const fileName = `imu_v${version}.apk`;
      const filePath = `apks/${fileName}`;

      // Convert File to Buffer
      const arrayBuffer = await apkFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('app-uploads')
        .upload(filePath, buffer, {
          contentType: 'application/vnd.android.package-archive',
          upsert: true,
        });

      if (uploadError) {
        console.error('[AppVersions] Upload error:', uploadError);
        return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('app-uploads')
        .getPublicUrl(filePath);

      downloadUrl = urlData.publicUrl;
    }

    if (!downloadUrl) {
      return NextResponse.json({ error: 'Either an APK file or download URL is required' }, { status: 400 });
    }

    // Insert version record
    const { data, error: insertError } = await supabase
      .from('app_versions')
      .insert({
        version,
        download_url: downloadUrl,
        release_notes: releaseNotes,
        force_update: forceUpdate,
        file_size: apkFile?.size || 0,
      })
      .select()
      .single();

    if (insertError) {
      // If unique constraint violation, the version already exists
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
    if (version.download_url.includes('app-uploads')) {
      const fileName = `apks/imu_v${version.version}.apk`;
      await supabase.storage.from('app-uploads').remove([fileName]);
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
