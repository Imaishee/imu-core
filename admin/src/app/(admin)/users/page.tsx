'use client';

import { useEffect, useState } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  async function toggleBan(userId: string, currentBanned: boolean) {
    await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, banned: !currentBanned }),
    });
    fetchUsers();
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
                <th className="text-left px-4 py-3 text-sm text-zinc-400 font-medium">User ID</th>
                <th className="text-left px-4 py-3 text-sm text-zinc-400 font-medium">Joined</th>
                <th className="text-left px-4 py-3 text-sm text-zinc-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-sm text-zinc-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[#27272a] hover:bg-[#27272a] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#a78bfa] flex items-center justify-center text-sm font-bold text-white">
                        {(user.name || 'U')[0].toUpperCase()}
                      </div>
                      <span className="text-sm text-white">{user.name || 'Anonymous'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{user.id?.slice(0,8)}...</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_banned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {user.is_banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleBan(user.id, user.is_banned)}
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
