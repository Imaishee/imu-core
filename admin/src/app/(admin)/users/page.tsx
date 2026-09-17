'use client';

import { useEffect, useState } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  async function openUser(user: any) {
    setSelected(user);
    setLoadingConvos(true);
    const res = await fetch(`/api/conversations?userId=${user.id}`);
    const data = await res.json();
    setConversations(data.conversations || []);
    setLoadingConvos(false);
  }

  async function toggleBan(userId: string, currentBanned: boolean) {
    await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, banned: !currentBanned }),
    });
    fetchUsers();
  }

  if (selected) {
    const locAvailable = selected.latitude != null && selected.longitude != null;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelected(null); setConversations([]); }} className="text-zinc-400 hover:text-white transition-colors text-sm">← Back</button>
          <div className="w-10 h-10 rounded-full bg-[#a78bfa] flex items-center justify-center text-sm font-bold text-white">
            {(selected.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{selected.name || 'Anonymous'}</h1>
            <p className="text-sm text-zinc-400">{selected.email || ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Profile Info */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Profile</h2>
            <InfoRow label="University" value={selected.university} />
            <InfoRow label="Programme" value={selected.programme} />
            <InfoRow label="Year" value={selected.year ? `Year ${selected.year}` : null} />
            <InfoRow label="Semester" value={selected.semester ? `Sem ${selected.semester}` : null} />
            <InfoRow label="Major" value={selected.major} />
            <InfoRow label="Minor" value={selected.minor} />
            <InfoRow label="Joined" value={selected.created_at ? new Date(selected.created_at).toLocaleDateString() : null} />
            <InfoRow label="Status" value={selected.is_banned ? 'Banned' : 'Active'} />
          </div>

          {/* Location */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Location</h2>
            {locAvailable ? (
              <>
                <InfoRow label="Latitude" value={selected.latitude?.toFixed(4)} />
                <InfoRow label="Longitude" value={selected.longitude?.toFixed(4)} />
                <InfoRow label="Last Updated" value={selected.location_updated_at ? new Date(selected.location_updated_at).toLocaleString() : null} />
                <a
                  href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-3 py-1.5 bg-[#a78bfa]/20 text-[#a78bfa] rounded-lg text-xs font-medium hover:bg-[#a78bfa]/30 transition-colors"
                >
                  Open in Google Maps
                </a>
              </>
            ) : (
              <p className="text-sm text-zinc-500 italic">No location data available</p>
            )}
          </div>
        </div>

        {/* Conversations */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Conversations ({conversations.length})</h2>
          {loadingConvos ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">No conversations yet</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-[#27272a] rounded-lg">
                  <div>
                    <p className="text-sm text-white">{c.title}</p>
                    <p className="text-xs text-zinc-500">{c.model} · {new Date(c.updated_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs text-zinc-600">{c.id?.slice(0,8)}</span>
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
      <h1 className="text-2xl font-bold text-white">Users</h1>
      {loading ? (
        <div className="text-zinc-400">Loading...</div>
      ) : (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#27272a]">
                <th className="text-left px-4 py-3 text-sm text-zinc-400 font-medium">User</th>
                <th className="text-left px-4 py-3 text-sm text-zinc-400 font-medium">University</th>
                <th className="text-left px-4 py-3 text-sm text-zinc-400 font-medium">Location</th>
                <th className="text-left px-4 py-3 text-sm text-zinc-400 font-medium">Joined</th>
                <th className="text-left px-4 py-3 text-sm text-zinc-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} onClick={() => openUser(user)} className="border-b border-[#27272a] hover:bg-[#27272a] transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#a78bfa] flex items-center justify-center text-sm font-bold text-white">
                        {(user.name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm text-white">{user.name || 'Anonymous'}</span>
                        <p className="text-xs text-zinc-500">{user.email || user.id?.slice(0,8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{user.university || '—'}</td>
                  <td className="px-4 py-3">
                    {user.latitude != null ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        {user.latitude.toFixed(2)}, {user.longitude.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600">No data</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBan(user.id, user.is_banned); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        user.is_banned
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}
                    >
                      {user.is_banned ? 'Unban' : 'Ban'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 text-sm">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return (
    <div className="flex justify-between py-1.5 border-b border-[#27272a] last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm text-zinc-600 italic">—</span>
    </div>
  );
  return (
    <div className="flex justify-between py-1.5 border-b border-[#27272a] last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}
