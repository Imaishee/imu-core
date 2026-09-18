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

// ─── Dashboard Stats ───────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const supabase = getClient();

  const [convResult, msgResult, aiMsgResult, notifResult, friendResult] = await Promise.all([
    supabase.from('conversations').select('id', { count: 'exact', head: true }),
    supabase.from('messages').select('id', { count: 'exact', head: true }),
    supabase.from('ai_messages').select('id', { count: 'exact', head: true }),
    supabase.from('notifications').select('id', { count: 'exact', head: true }),
    supabase.from('friends').select('id', { count: 'exact', head: true }),
  ]);

  // Unique users from conversations
  const { data: convData } = await supabase
    .from('conversations')
    .select('user_id')
    .limit(10000);

  const uniqueUsers = new Set((convData || []).map(c => c.user_id).filter(Boolean));

  return {
    totalUsers: uniqueUsers.size,
    totalConversations: convResult.count || 0,
    totalMessages: (msgResult.count || 0) + (aiMsgResult.count || 0),
    totalNotifications: notifResult.count || 0,
    totalFriends: friendResult.count || 0,
  };
}

// ─── Users (derived from conversations) ────────────────────────────────────────

export async function getUsers() {
  const supabase = getClient();

  // Get all conversations with user_id
  const { data: convs, error: convError } = await supabase
    .from('conversations')
    .select('user_id, id, title, model, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(10000);

  if (convError) return { users: [], error: convError };

  // Group by user_id to build user profiles
  const userMap = new Map<string, {
    id: string;
    conversationCount: number;
    lastActive: string;
    firstSeen: string;
    models: Set<string>;
    conversationIds: string[];
  }>();

  for (const conv of convs || []) {
    const uid = conv.user_id;
    if (!uid) continue;

    if (!userMap.has(uid)) {
      userMap.set(uid, {
        id: uid,
        conversationCount: 0,
        lastActive: conv.updated_at || conv.created_at,
        firstSeen: conv.created_at,
        models: new Set(),
        conversationIds: [],
      });
    }

    const user = userMap.get(uid)!;
    user.conversationCount++;
    user.conversationIds.push(conv.id);
    if (conv.model) user.models.add(conv.model);
    if (conv.updated_at > user.lastActive) user.lastActive = conv.updated_at;
    if (conv.created_at < user.firstSeen) user.firstSeen = conv.created_at;
  }

  const users = Array.from(userMap.values())
    .map(u => ({
      ...u,
      models: Array.from(u.models),
    }))
    .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());

  return { users, error: null };
}

export async function getUserConversations(userId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  return { conversations: data || [], error };
}

// ─── Conversations ─────────────────────────────────────────────────────────────

export async function getConversations(userId?: string) {
  const supabase = getClient();
  let query = supabase.from('conversations').select('*');
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query.order('updated_at', { ascending: false }).limit(200);
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

// ─── Notifications ─────────────────────────────────────────────────────────────

export async function getNotifications() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  return { data: data || [], error };
}

// ─── AI Messages ───────────────────────────────────────────────────────────────

export async function getAIMessages(limit = 100) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: data || [], error };
}

// ─── Friends ───────────────────────────────────────────────────────────────────

export async function getFriends() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('friends')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function getFriendMessages(friendId?: string) {
  const supabase = getClient();
  let query = supabase.from('friend_messages').select('*');
  if (friendId) query = query.eq('friend_id', friendId);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(200);
  return { data: data || [], error };
}

// ─── Engine Health ─────────────────────────────────────────────────────────────

export async function getEngineHealth() {
  const engineUrl = process.env.ENGINE_URL || 'https://imu-heart.onrender.com';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(`${engineUrl}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      return { status: 'online', engine: data, url: engineUrl };
    }
    return { status: 'error', error: `HTTP ${resp.status}`, url: engineUrl };
  } catch (e: any) {
    return { status: 'offline', error: e.message || 'Connection failed', url: engineUrl };
  }
}
