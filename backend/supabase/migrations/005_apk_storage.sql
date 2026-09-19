-- ============================================
-- MIGRATION 005: APK STORAGE BUCKET
-- Creates the 'apk-downloads' storage bucket for
-- hosting APK files for the auto-update system.
-- ============================================

-- Create the storage bucket for APK uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'apk-downloads',
  'apk-downloads',
  true,  -- public so devices can download without auth
  209715200,  -- 200MB limit (APKs can be large)
  ARRAY['application/vnd.android.package-archive', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 209715200,
  allowed_mime_types = ARRAY['application/vnd.android.package-archive', 'application/octet-stream'];

-- Storage policies
-- Anyone can read (public bucket)
CREATE POLICY "Public read for app uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'apk-downloads');

-- Only authenticated admins can upload
CREATE POLICY "Admins can upload APKs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'apk-downloads'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND preferences->>'role' = 'admin'
    )
  );

-- Only authenticated admins can delete
CREATE POLICY "Admins can delete APKs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'apk-downloads'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND preferences->>'role' = 'admin'
    )
  );
