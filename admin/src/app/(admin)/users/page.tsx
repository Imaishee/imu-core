'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  phone: string | null;
  email_confirmed: boolean;
  last_sign_in: string | null;
  created_at: string;
  conversationCount: number;
  lastActive: string;
  models: string[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<User | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  async function openUser(user: User) {
    setSelected(user);
    setLoadingConvos(true);
    const res = await fetch(`/api/conversations?userId=${user.id}`);
    const data = await res.json();
    setConversations(data.conversations || []);
    setLoadingConvos(false);
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.id.toLowerCase().includes(search.toLowerCase())
  );

  // ─── User Detail View ──────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelected(null); setConversations([]); }}
            className="text-zinc-500 hover:text-white transition-colors text-sm"
          >
            ← Back
          </button>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white overflow-hidden">
            {selected.avatar_url ? (
              <img src={selected.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              selected.name[0]?.toUpperCase() || '?'
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{selected.name}</h1>
            <p className="text-xs text-zinc-500">{selected.email}</p>
          </div>
          <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${
            selected.email_confirmed ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
          }`}>
            {selected.email_confirmed ? 'Verified' : 'Unverified'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat label="Conversations" value={selected.conversationCount} />
          <MiniStat label="Last Active" value={selected.lastActive ? new Date(selected.lastActive).toLocaleDateString() : 'Never'} />
          <MiniStat label="Joined" value={new Date(selected.created_at).toLocaleDateString()} />
          <MiniStat label="Last Sign In" value={selected.last_sign_in ? new Date(selected.last_sign_in).toLocaleDateString() : 'Never'} />
        </div>

        <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">User Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">User ID</span>
              <p className="text-white font-mono text-xs mt-0.5 break-all">{selected.id}</p>
            </div>
            <div>
              <span className="text-zinc-500">Phone</span>
              <p className="text-white mt-0.5">{selected.phone || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-zinc-500">Models Used</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {selected.models.length > 0 ? selected.models.map(m => (
                  <span key={m} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/10 text-violet-400">{m}</span>
                )) : <span className="text-zinc-600">None</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Conversations ({conversations.length})
          </h2>
          {loadingConvos ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-[#141416] rounded-lg animate-pulse" />)}
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-zinc-600 italic">No conversations yet</p>
          ) : (
            <div className="space-y-1.5">
              {conversations.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2.5 bg-[#141416] rounded-lg hover:bg-[#1a1a1e] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-600">💬</span>
                    <div>
                      <p className="text-sm text-white">{c.title || 'Untitled'}</p>
                      <p className="text-[11px] text-zinc-600">{c.model || 'No model'}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-zinc-600">{new Date(c.updated_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── User List View ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Users</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{users.length} registered users</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search name, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#141416] border border-[#1a1a1e] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 w-56"
          />
          <button
            onClick={fetchUsers}
            className="px-3 py-1.5 bg-[#141416] hover:bg-[#1a1a1e] border border-[#1a1a1e] rounded-lg text-xs text-zinc-400 hover:text-white transition-all"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1e]">
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Conversations</th>
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => openUser(user)}
                  className="border-b border-[#1a1a1e] hover:bg-[#141416] transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user.name[0]?.toUpperCase() || '?'
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-[11px] text-zinc-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                      {user.conversationCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                      user.email_confirmed ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {user.email_confirmed ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-zinc-600 text-sm">
                    {search ? 'No matching users' : 'No users registered yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-4">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  );
}
