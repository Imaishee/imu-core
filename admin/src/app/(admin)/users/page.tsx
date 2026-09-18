'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  conversationCount: number;
  lastActive: string;
  firstSeen: string;
  models: string[];
  conversationIds: string[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<User | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
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
    u.id.toLowerCase().includes(search.toLowerCase())
  );

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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
            {selected.id[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-mono">{selected.id.slice(0, 12)}...</h1>
            <p className="text-xs text-zinc-500">First seen {new Date(selected.firstSeen).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat label="Conversations" value={selected.conversationCount} />
          <MiniStat label="Models Used" value={selected.models.length} />
          <MiniStat label="Last Active" value={new Date(selected.lastActive).toLocaleDateString()} />
          <MiniStat label="Member Since" value={new Date(selected.firstSeen).toLocaleDateString()} />
        </div>

        <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Models Used
          </h2>
          <div className="flex flex-wrap gap-2">
            {selected.models.map(m => (
              <span key={m} className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Conversations ({conversations.length})
          </h2>
          {loadingConvos ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-12 bg-[#141416] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-zinc-600 italic">No conversations</p>
          ) : (
            <div className="space-y-1.5">
              {conversations.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2.5 bg-[#141416] rounded-lg hover:bg-[#1a1a1e] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-600">💬</span>
                    <div>
                      <p className="text-sm text-white">{c.title || 'Untitled'}</p>
                      <p className="text-[11px] text-zinc-600">{c.model}</p>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Users</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{users.length} unique users from conversations</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#141416] border border-[#1a1a1e] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 w-48"
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
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1e]">
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Conversations</th>
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Models</th>
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Last Active</th>
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
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                        {user.id[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm text-white font-mono">{user.id.slice(0, 12)}...</span>
                        <p className="text-[11px] text-zinc-600">Since {new Date(user.firstSeen).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                      {user.conversationCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.models.slice(0, 2).map(m => (
                        <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1e] text-zinc-500">
                          {m}
                        </span>
                      ))}
                      {user.models.length > 2 && (
                        <span className="text-[10px] text-zinc-600">+{user.models.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {new Date(user.lastActive).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-zinc-600 text-sm">
                    {search ? 'No matching users' : 'No users yet'}
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
