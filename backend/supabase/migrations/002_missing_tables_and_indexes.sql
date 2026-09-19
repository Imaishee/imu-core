-- Migration: Add missing tables, fix notifications schema, add activity_log
-- Run this in Supabase SQL Editor

-- 1. conversations table (used by admin dashboard + chat system)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  model TEXT DEFAULT 'openai/gpt-oss-20b',
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. messages table (used by admin dashboard + chat system)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model TEXT,
  tokens_used INTEGER DEFAULT 0,
  file_url TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Extend notifications table with admin fields
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target TEXT DEFAULT 'all';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES auth.users(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- 4. activity_log table (for admin audit logging)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own messages" ON messages
  FOR ALL USING (auth.uid() = user_id);

-- activity_log: admin-only (service role bypasses RLS)
CREATE POLICY "Authenticated users can insert activity_log" ON activity_log
  FOR INSERT WITH CHECK (true);

-- 7. Enable Realtime for friend_messages (already done) and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friend_messages_created ON friend_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- 9. Triggers
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
