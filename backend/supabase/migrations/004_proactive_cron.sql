-- Migration: Enable pg_cron for proactive messaging
-- Run this in Supabase SQL Editor AFTER enabling the pg_cron extension
--
-- IMPORTANT: pg_cron must be enabled in your Supabase project:
--   Dashboard → Settings → Database → Extensions → enable "pg_cron"
--
-- This sets up 4 daily triggers:
--   Morning:   08:00 IST (02:30 UTC)
--   Afternoon: 13:00 IST (07:30 UTC)
--   Evening:   18:00 IST (12:30 UTC)
--   Night:     22:00 IST (16:30 UTC)

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ─── Helper function to call the proactive-message edge function ──────────
CREATE OR REPLACE FUNCTION trigger_proactive_message()
RETURNS void AS $$
DECLARE
  service_role_key TEXT;
  response record;
BEGIN
  -- Get the service role key from vault (Supabase stores secrets here)
  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  -- If not in vault, try a hardcoded fallback (less secure, use vault if possible)
  IF service_role_key IS NULL THEN
    RAISE NOTICE 'service_role_key not found in vault. Set it via: INSERT INTO vault.secrets (name, secret) VALUES (''service_role_key'', ''your-key-here'')';
    RETURN;
  END IF;

  -- Call the edge function via HTTP
  SELECT INTO response *
  FROM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/proactive-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key,
      'apikey', service_role_key
    ),
    body := '{}'::jsonb
  );

  RAISE NOTICE 'Proactive message triggered: status=%', response.status;
END;
$$ LANGUAGE plpgsql;

-- ─── Schedule cron jobs (IST times converted to UTC) ──────────────────────
-- Morning 08:00 IST = 02:30 UTC
SELECT cron.schedule(
  'proactive-morning',
  '30 2 * * *',
  $$SELECT trigger_proactive_message()$$
);

-- Afternoon 13:00 IST = 07:30 UTC
SELECT cron.schedule(
  'proactive-afternoon',
  '30 7 * * *',
  $$SELECT trigger_proactive_message()$$
);

-- Evening 18:00 IST = 12:30 UTC
SELECT cron.schedule(
  'proactive-evening',
  '30 12 * * *',
  $$SELECT trigger_proactive_message()$$
);

-- Night 22:00 IST = 16:30 UTC
SELECT cron.schedule(
  'proactive-night',
  '30 16 * * *',
  $$SELECT trigger_proactive_message()$$
);

-- ─── Verify scheduled jobs ────────────────────────────────────────────────
-- Run this to check: SELECT * FROM cron.job;
