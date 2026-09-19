-- ============================================
-- MIGRATION 006: APP VERSIONS TABLE
-- Creates the app_versions table for the
-- auto-update system. Stores APK metadata.
-- ============================================

CREATE TABLE IF NOT EXISTS public.app_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT NOT NULL UNIQUE,
  download_url TEXT NOT NULL,
  release_notes TEXT DEFAULT '',
  force_update BOOLEAN DEFAULT false,
  file_size INTEGER DEFAULT 0,
  checksum TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- Anyone can read versions (app needs to check for updates)
DO $$ BEGIN
  CREATE POLICY "Anyone can read versions" ON public.app_versions
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only admins can insert/update/delete versions
DO $$ BEGIN
  CREATE POLICY "Admins can manage versions" ON public.app_versions
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND preferences->>'role' = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Index for fast latest-version lookup
CREATE INDEX IF NOT EXISTS idx_app_versions_created_at ON public.app_versions (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_versions_version ON public.app_versions (version);
