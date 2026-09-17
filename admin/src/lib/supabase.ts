import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cxiicvirllfdvcjwwcbj.supabase.co';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    _client = createClient(url, key);
  }
  return _client;
}

export function getSupabase() {
  return getClient();
}

export async function getUsers() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function getUserStats() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('user_stats')
    .select('*, profiles!inner(name)');
  return { data: data || [], error };
}

export async function getConversations(userId?: string) {
  const supabase = getClient();
  let query = supabase.from('conversations').select('*, profiles!inner(name)');
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query.order('updated_at', { ascending: false }).limit(100);
  return { data: data || [], error };
}

export async function getNotifications() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  return { data: data || [], error };
}

export async function banUser(userId: string, banned: boolean) {
  const supabase = getClient();
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: banned })
    .eq('id', userId);
  return { error };
}

export async function getActivityLog() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('activity_log')
    .select('*, profiles!inner(name)')
    .order('created_at', { ascending: false })
    .limit(100);
  return { data: data || [], error };
}

export async function getConversationMessages(conversationId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  return { data: data || [], error };
}

export async function getSystemPrompts() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('system_prompts')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function updateSystemPrompt(id: string, prompt: string) {
  const supabase = getClient();
  const { error } = await supabase
    .from('system_prompts')
    .update({ prompt, updated_at: new Date().toISOString() })
    .eq('id', id);
  return { error };
}

export async function getDashboardStats() {
  const supabase = getClient();
  const [users, conversations, messages] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('conversations').select('id', { count: 'exact', head: true }),
    supabase.from('messages').select('id', { count: 'exact', head: true }),
  ]);
  return {
    totalUsers: users.count || 0,
    totalConversations: conversations.count || 0,
    totalMessages: messages.count || 0,
  };
}
