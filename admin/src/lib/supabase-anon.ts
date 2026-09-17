'use client';
import { createClient } from '@supabase/supabase-js';

// Browser client for the PUBLIC password-reset page. Uses ONLY the anon key.
// The service-role key is never exposed to the browser.
export function getAnonClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cxiicvirllfdvcjwwcbj.supabase.co';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, anonKey);
}