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
  university: string | null;
  programme: string | null;
  year: number | null;
  semester: number | null;
  major: string | null;
  latitude: number | null;
  longitude: number | null;
  location_updated_at: string | null;
  companion_gender: string | null;
  is_visible: boolean;
  allow_friend_requests: boolean;
  is_active: boolean;
  is_banned: boolean;
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
              // eslint-disable-next-line @next/next/no-img-element
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
          {selected.is_banned && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400">
              BANNED
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MiniStat label="Conversations" value={selected.conversationCount} />
          <MiniStat label="Last Active" value={selected.lastActive ? new Date(selected.lastActive).toLocaleDateString() : 'Never'} />
          <MiniStat label="Joined" value={new Date(selected.created_at).toLocaleDateString()} />
          <MiniStat label="Last Sign In" value={selected.last_sign_in ? new Date(selected.last_sign_in).toLocaleDateString() : 'Never'} />
          <MiniStat label="AI Models" value={selected.models.length > 0 ? selected.models.join(', ') : 'None'} />
        </div>

        {/* Location Section */}
        <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Location</h2>
          {selected.latitude && selected.longitude ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-zinc-500">Latitude</span>
                <p className="text-white font-mono text-xs mt-0.5">{selected.latitude.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-zinc-500">Longitude</span>
                <p className="text-white font-mono text-xs mt-0.5">{selected.longitude.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-zinc-500">Last Updated</span>
                <p className="text-white text-xs mt-0.5">
                  {selected.location_updated_at ? new Date(selected.location_updated_at).toLocaleString() : 'Never'}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Google Maps</span>
                <a
                  href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 text-xs mt-0.5 hover:underline block"
                >
                  Open in Maps →
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-600 italic">No location data available</p>
          )}
        </div>

        {/* Profile Details */}
        <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Profile Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">User ID</span>
              <p className="text-white font-mono text-xs mt-0.5 break-all">{selected.id}</p>
            </div>
            <div>
              <span className="text-zinc-500">Phone</span>
              <p className="text-white mt-0.5">{selected.phone || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-zinc-500">University</span>
              <p className="text-white mt-0.5">{selected.university || 'Not set'}</p>
            </div>
            <div>
              <span className="text-zinc-500">Programme</span>
              <p className="text-white mt-0.5">{selected.programme || 'Not set'}</p>
            </div>
            <div>
              <span className="text-zinc-500">Year / Semester</span>
              <p className="text-white mt-0.5">
                {selected.year ? `Year ${selected.year}` : '—'}
                {selected.semester ? ` / Sem ${selected.semester}` : ''}
                {!selected.year && !selected.semester && 'Not set'}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Major</span>
              <p className="text-white mt-0.5">{selected.major || 'Not set'}</p>
            </div>
          </div>
        </div>

        {/* Companion & Privacy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Companion */}
          <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Companion</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Gender</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  selected.companion_gender === 'female' ? 'bg-pink-500/10 text-pink-400' :
                  selected.companion_gender === 'male' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-zinc-500/10 text-zinc-400'
                }`}>
                  {selected.companion_gender || 'Not set'}
                </span>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Privacy</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Profile Visible</span>
                <StatusDot active={selected.is_visible} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Friend Requests</span>
                <StatusDot active={selected.allow_friend_requests} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Active</span>
                <StatusDot active={selected.is_active} />
              </div>
            </div>
          </div>
        </div>

        {/* Conversations */}
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
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Convos</th>
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Location</th>
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Companion</th>
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
                          // eslint-disable-next-line @next/next/no-img-element
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
                    {user.latitude && user.longitude ? (
                      <span className="text-[10px] text-green-400 font-mono">
                        {user.latitude.toFixed(2)}, {user.longitude.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      user.companion_gender === 'female' ? 'bg-pink-500/10 text-pink-400' :
                      user.companion_gender === 'male' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-zinc-500/10 text-zinc-500'
                    }`}>
                      {user.companion_gender || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                        user.email_confirmed ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {user.email_confirmed ? 'Verified' : 'Unverified'}
                      </span>
                      {user.is_banned && (
                        <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400">
                          Banned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-600 text-sm">
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
      <p className="text-xl font-bold text-white truncate" title={String(value)}>{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-zinc-600'}`} />
      <span className={`text-xs ${active ? 'text-green-400' : 'text-zinc-500'}`}>
        {active ? 'On' : 'Off'}
      </span>
    </div>
  );
}
