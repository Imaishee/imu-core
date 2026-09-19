import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Generate a signed upload URL so the client can upload directly to Supabase Storage
// This avoids Vercel's 4.5MB body limit — the file never touches our serverless function
export async function POST(req: NextRequest) {
  try {
    const { version } = await req.json();

    if (!version) {
      return NextResponse.json({ error: 'Version is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const fileName = `IMU-v${version.trim()}-arm64.apk`;

    // Create signed upload URL using service_role (bypasses RLS)
    const { data, error } = await supabase.storage
      .from('apk-downloads')
      .createSignedUploadUrl(fileName);

    if (error) {
      console.error('[SignedURL] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also get the public URL for later use
    const { data: urlData } = supabase.storage
      .from('apk-downloads')
      .getPublicUrl(fileName);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path: data.path,
      downloadUrl: urlData.publicUrl,
      fileName,
    });
  } catch (e: any) {
    console.error('[SignedURL] Error:', e);
    return NextResponse.json({ error: e.message || 'Failed to create signed URL' }, { status: 500 });
  }
}
