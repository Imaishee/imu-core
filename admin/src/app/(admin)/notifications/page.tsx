'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [targetUserId, setTargetUserId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  async function fetchNotifications() {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    setNotifications(data.notifications || []);
  }

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch {}
  }

  async function handleSend() {
    if (!title || !body) return;
    setSending(true);
    setSendSuccess(false);
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        body,
        target,
        targetUserId: target === 'specific' ? targetUserId : undefined,
      }),
    });
    setTitle('');
    setBody('');
    setTargetUserId('');
    setSending(false);
    setSendSuccess(true);
    setTimeout(() => setSendSuccess(false), 3000);
    fetchNotifications();
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Notifications</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Send push notifications to users</p>
      </div>

      {/* Send Form */}
      <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Send Notification</h2>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#141416] border border-[#1a1a1e] rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
          />
          <textarea
            placeholder="Message body..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="w-full bg-[#141416] border border-[#1a1a1e] rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 resize-none"
          />
          <div className="flex items-center gap-3">
            <select
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                setTargetUserId('');
              }}
              className="bg-[#141416] border border-[#1a1a1e] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
            >
              <option value="all">All Users</option>
              <option value="specific">Specific User</option>
            </select>

            {target === 'specific' && (
              <div className="relative flex-1 max-w-xs">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-[#141416] border border-[#1a1a1e] rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
                />
                {userSearch && filteredUsers.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-[#141416] border border-[#1a1a1e] rounded-lg max-h-48 overflow-y-auto shadow-xl">
                    {filteredUsers.slice(0, 10).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setTargetUserId(u.id);
                          setUserSearch(u.name || u.email);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#1a1a1e] transition-colors"
                      >
                        <span className="font-medium">{u.name || 'Unknown'}</span>
                        <span className="text-zinc-500 ml-2 text-xs">{u.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                {targetUserId && (
                  <span className="text-xs text-green-400 mt-1 block">Selected ✓</span>
                )}
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={sending || !title || !body || (target === 'specific' && !targetUserId)}
              className="bg-violet-500 hover:bg-violet-600 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
            {sendSuccess && (
              <span className="text-xs text-green-400">✓ Sent successfully</span>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1a1a1e]">
          <h3 className="text-sm font-semibold text-zinc-400">History</h3>
        </div>
        <div className="divide-y divide-[#1a1a1e]">
          {notifications.map((n) => (
            <div key={n.id} className="px-4 py-3 hover:bg-[#141416] transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{n.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    n.status === 'sent' ? 'bg-green-500/10 text-green-400' :
                    n.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                    'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {n.status || 'pending'}
                  </span>
                  {n.target === 'specific' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-violet-500/10 text-violet-400">
                      targeted
                    </span>
                  )}
                  <span className="text-[11px] text-zinc-600">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="px-4 py-12 text-center text-zinc-600 text-sm">No notifications yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
