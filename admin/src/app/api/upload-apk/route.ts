import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for large APK uploads

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const version = formData.get('version') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!version) {
      return NextResponse.json({ error: 'Version is required' }, { status: 400 });
    }

    const fileName = `IMU-v${version.trim()}-arm64.apk`;
    const supabase = getSupabase();

    // Convert File to ArrayBuffer then to Buffer for Supabase upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage using service_role key (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('apk-downloads')
      .upload(fileName, buffer, {
        contentType: 'application/vnd.android.package-archive',
        upsert: true,
      });

    if (uploadError) {
      console.error('[UploadAPK] Storage error:', uploadError);
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('apk-downloads')
      .getPublicUrl(fileName);

    return NextResponse.json({
      ok: true,
      downloadUrl: urlData.publicUrl,
      path: uploadData?.path || fileName,
    });
  } catch (e: any) {
    console.error('[UploadAPK] Error:', e);
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 });
  }
}
