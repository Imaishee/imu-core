import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cxiicvirllfdvcjwwcbj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function getUserStats() {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*, profiles!inner(full_name, email)');
  return { data: data || [], error };
}

export async function getConversations(userId?: string) {
  let query = supabase.from('conversations').select('*, profiles!inner(full_name, email)');
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query.order('updated_at', { ascending: false }).limit(100);
  return { data: data || [], error };
}

export async function getNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  return { data: data || [], error };
}

export async function sendNotification(title: string, body: string, target: string, targetUserId?: string) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ title, body, target, target_user_id: targetUserId, status: 'pending' })
    .select()
    .single();
  return { data, error };
}

export async function banUser(userId: string, banned: boolean) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: banned })
    .eq('id', userId);
  return { error };
}

export async function getActivityLog() {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*, profiles!inner(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100);
  return { data: data || [], error };
}

export async function getSystemPrompts() {
  const { data, error } = await supabase
    .from('system_prompts')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function updateSystemPrompt(id: string, prompt: string) {
  const { error } = await supabase
    .from('system_prompts')
    .update({ prompt, updated_at: new Date().toISOString() })
    .eq('id', id);
  return { error };
}

export async function getDashboardStats() {
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
