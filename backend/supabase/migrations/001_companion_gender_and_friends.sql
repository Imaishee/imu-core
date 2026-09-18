-- Migration: Add companion gender and friend system
-- Run this in Supabase SQL Editor

-- 1. Add companion_gender to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS companion_gender TEXT DEFAULT 'female';

-- 2. Create friends table for user-to-user connections
CREATE TABLE IF NOT EXISTS friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- 3. Create friend_messages table for real-time chat between users
CREATE TABLE IF NOT EXISTS friend_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- 4. Create ai_messages table for AI companion messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add last_active_at to profiles for proactive messaging
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- 6. Enable Row Level Security
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for friends
CREATE POLICY "Users can view their own friends" ON friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests" ON friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friend status" ON friends
  FOR UPDATE USING (auth.uid() = friend_id OR auth.uid() = user_id);

-- 8. RLS Policies for friend_messages
CREATE POLICY "Users can view their own messages" ON friend_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON friend_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark messages as read" ON friend_messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- 9. RLS Policies for ai_messages
CREATE POLICY "Users can view their own AI messages" ON ai_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI messages" ON ai_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. Enable Realtime for friend_messages
ALTER PUBLICATION supabase_realtime ADD TABLE friend_messages;

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_messages_sender ON friend_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_messages_receiver ON friend_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user ON ai_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at);
