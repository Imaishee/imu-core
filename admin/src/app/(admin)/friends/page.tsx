'use client';

import { useEffect, useState } from 'react';

export default function FriendsPage() {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, []);

  async function fetchFriends() {
    setLoading(true);
    const res = await fetch('/api/friends');
    const data = await res.json();
    setFriends(data.friends || []);
    setLoading(false);
  }

  const stats = {
    total: friends.length,
    accepted: friends.filter(f => f.status === 'accepted').length,
    pending: friends.filter(f => f.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Friends</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Friend connections between users</p>
        </div>
        <button
          onClick={fetchFriends}
          className="px-3 py-1.5 bg-[#141416] hover:bg-[#1a1a1e] border border-[#1a1a1e] rounded-lg text-xs text-zinc-400 hover:text-white transition-all"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Accepted', value: stats.accepted, color: 'text-green-400' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-16 bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : friends.length === 0 ? (
        <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-12 text-center">
          <span className="text-4xl">🫂</span>
          <p className="text-sm text-zinc-500 mt-3">No friend connections yet</p>
          <p className="text-xs text-zinc-600 mt-1">Friends will appear as users connect with each other</p>
        </div>
      ) : (
        <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1e]">
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">User 1</th>
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">User 2</th>
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Connected</th>
              </tr>
            </thead>
            <tbody>
              {friends.map((f: any) => {
                const userName = f.user_profile?.name || f.user_id?.slice(0, 8) || '?';
                const friendName = f.friend_profile?.name || f.friend_id?.slice(0, 8) || '?';
                return (
                  <tr key={f.id} className="border-b border-[#1a1a1e] hover:bg-[#141416] transition-colors">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        f.status === 'accepted' ? 'bg-green-500/10 text-green-400' :
                        f.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-zinc-500/10 text-zinc-400'
                      }`}>
                        {f.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400">
                          {userName[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs text-white font-medium">{userName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                          {friendName[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs text-white font-medium">{friendName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{new Date(f.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
