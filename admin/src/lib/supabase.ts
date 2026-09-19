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

  const [profilesResult, convResult, msgResult, notifResult, friendResult, friendMsgResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('conversations').select('id', { count: 'exact', head: true }),
    supabase.from('messages').select('id', { count: 'exact', head: true }),
    supabase.from('notifications').select('id', { count: 'exact', head: true }),
    supabase.from('friends').select('id', { count: 'exact', head: true }),
    supabase.from('friend_messages').select('id', { count: 'exact', head: true }),
  ]);

  // Users = profiles count (most reliable source)
  let totalUsers = profilesResult.count || 0;

  // Fallback: if profiles count is 0, try auth users
  if (totalUsers === 0) {
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      totalUsers = authUsers?.users?.length || 0;
    } catch {
      // Auth admin might not be available with anon key — that's ok
    }
  }

  // Fallback: count unique user_ids from conversations
  if (totalUsers === 0) {
    try {
      const { data: convData } = await supabase
        .from('conversations')
        .select('user_id')
        .limit(10000);
      totalUsers = new Set((convData || []).map(c => c.user_id).filter(Boolean)).size;
    } catch {}
  }

  return {
    totalUsers,
    totalConversations: convResult.count || 0,
    totalMessages: (msgResult.count || 0) + (friendMsgResult.count || 0),
    totalNotifications: notifResult.count || 0,
    totalFriends: friendResult.count || 0,
  };
}

// ─── Users (Auth + Profiles with location & privacy) ──────────────────────────

export async function getUsers() {
  const supabase = getClient();

  // 1. Get ALL registered users from Supabase Auth
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });

  // 2. Get ALL profiles (has location, companion, privacy, etc.)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .limit(1000);

  // 3. Get conversation stats per user
  const { data: convs } = await supabase
    .from('conversations')
    .select('user_id, id, title, model, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(10000);

  // Build profiles map
  const profileMap = new Map<string, any>();
  for (const p of profiles || []) {
    profileMap.set(p.user_id, p);
  }

  // Build conversation stats map
  const convStats = new Map<string, {
    conversationCount: number;
    lastActive: string;
    models: Set<string>;
  }>();

  for (const conv of convs || []) {
    const uid = conv.user_id;
    if (!uid) continue;
    if (!convStats.has(uid)) {
      convStats.set(uid, {
        conversationCount: 0,
        lastActive: conv.updated_at || conv.created_at,
        models: new Set(),
      });
    }
    const s = convStats.get(uid)!;
    s.conversationCount++;
    if (conv.model) s.models.add(conv.model);
    if (conv.updated_at > s.lastActive) s.lastActive = conv.updated_at;
  }

  if (authError) {
    // Fallback: build users from profiles + conversations only
    const users = (profiles || []).map(p => {
      const stats = convStats.get(p.user_id);
      return {
        id: p.user_id,
        email: 'Unknown',
        name: p.name || 'Unknown',
        avatar_url: null,
        phone: null,
        email_confirmed: true,
        last_sign_in: null,
        created_at: p.created_at,
        conversationCount: stats?.conversationCount || 0,
        lastActive: stats?.lastActive || p.last_active_at || p.created_at,
        models: stats ? Array.from(stats.models) : [],
        // Profile fields
        university: p.university || null,
        programme: p.programme || null,
        year: p.year || null,
        semester: p.semester || null,
        major: p.major || null,
        latitude: p.latitude || null,
        longitude: p.longitude || null,
        location_updated_at: p.location_updated_at || null,
        companion_gender: p.companion_gender || null,
        is_visible: p.is_visible ?? true,
        allow_friend_requests: p.allow_friend_requests ?? true,
        is_active: p.is_active ?? false,
        is_banned: p.is_banned ?? false,
      };
    }).sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());

    return { users, error: null };
  }

  // 4. Merge auth users with profiles + conversation stats
  const users = (authUsers?.users || []).map(u => {
    const profile = profileMap.get(u.id);
    const stats = convStats.get(u.id);
    return {
      id: u.id,
      email: u.email || 'No email',
      name: profile?.name || u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Unknown',
      avatar_url: u.user_metadata?.avatar_url || null,
      phone: u.phone || null,
      email_confirmed: u.email_confirmed_at ? true : false,
      last_sign_in: u.last_sign_in_at,
      created_at: u.created_at,
      conversationCount: stats?.conversationCount || 0,
      lastActive: stats?.lastActive || u.last_sign_in_at || u.created_at,
      models: stats ? Array.from(stats.models) : [],
      // Profile fields
      university: profile?.university || null,
      programme: profile?.programme || null,
      year: profile?.year || null,
      semester: profile?.semester || null,
      major: profile?.major || null,
      latitude: profile?.latitude || null,
      longitude: profile?.longitude || null,
      location_updated_at: profile?.location_updated_at || null,
      companion_gender: profile?.companion_gender || null,
      is_visible: profile?.is_visible ?? true,
      allow_friend_requests: profile?.allow_friend_requests ?? true,
      is_active: profile?.is_active ?? false,
      is_banned: profile?.is_banned ?? false,
    };
  }).sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());

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
  let query = supabase.from('conversations').select(`
    *,
    profile:profiles!conversations_user_id_fkey(name)
  `);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query.order('updated_at', { ascending: false }).limit(200);

  // Flatten profile name for easier access
  const conversations = (data || []).map((c: any) => ({
    ...c,
    user_name: c.profile?.name || c.user_id?.slice(0, 8) || '?',
    profile: undefined,
  }));

  return { data: conversations, error };
}

export async function getConversationMessages(conversationId: string) {
  const supabase = getClient();

  // Try messages table first
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (messages && messages.length > 0) {
    return { data: messages, error };
  }

  // Fallback: check if messages are stored in conversation payload
  const { data: conv } = await supabase
    .from('conversations')
    .select('payload, metadata')
    .eq('id', conversationId)
    .single();

  if (conv?.payload && Array.isArray(conv.payload)) {
    return { data: conv.payload, error: null };
  }

  return { data: [], error };
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
  // ai_messages columns: id, user_id, role, content, created_at (no model/intent/mood columns)
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*, profiles!ai_messages_user_id_fkey(name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: data || [], error };
}

// ─── Friends ───────────────────────────────────────────────────────────────────

export async function getFriends() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('friends')
    .select(`
      *,
      user_profile:profiles!friends_user_id_fkey(name),
      friend_profile:profiles!friends_friend_id_fkey(name)
    `)
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function getFriendMessages(friendId?: string) {
  const supabase = getClient();
  let query = supabase.from('friend_messages').select(`
    *,
    sender:profiles!friend_messages_sender_id_fkey(name),
    receiver:profiles!friend_messages_receiver_id_fkey(name)
  `);
  if (friendId) query = query.eq('id', friendId);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(200);
  return { data: data || [], error };
}

// ─── Engine Health ─────────────────────────────────────────────────────────────

export async function getEngineHealth() {
  const engineUrl = process.env.ENGINE_URL || 'https://imu-heart.onrender.com';
  const hfSpaceUrl = 'https://shubham1440-imu-heart.hf.space/gradio_api/call/chat_fn';

  // Try Render engine with longer timeout (it sleeps after inactivity)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

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
    // Render may be sleeping — try HF Space as fallback
    try {
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 8000);
      const resp2 = await fetch(hfSpaceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: ['health', null] }),
        signal: controller2.signal,
      });
      clearTimeout(timeout2);
      if (resp2.ok || resp2.status === 200) {
        return { status: 'online', engine: { source: 'hf_space_fallback' }, url: engineUrl, note: 'Render sleeping, HF Space online' };
      }
    } catch {}

    return {
      status: 'sleeping',
      error: e.message || 'Connection failed (Render may be spinning up)',
      url: engineUrl,
    };
  }
}

// ─── FCM Tokens ────────────────────────────────────────────────────────────────

export async function getFCMTokens() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('fcm_tokens')
    .select('*, profiles!fcm_tokens_user_id_fkey(name)')
    .order('created_at', { ascending: false })
    .limit(500);
  return { data: data || [], error };
}
