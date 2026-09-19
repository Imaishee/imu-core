-- Migration: Add privacy/visibility controls to profiles
-- Run this in Supabase SQL Editor

-- 1. Add visibility fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allow_friend_requests BOOLEAN DEFAULT TRUE;

-- 2. Index for search filtering
CREATE INDEX IF NOT EXISTS idx_profiles_is_visible ON profiles(is_visible);
