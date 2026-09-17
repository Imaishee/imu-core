'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [targetUserId, setTargetUserId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [sending, setSending] = useState(false);

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
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.users || []);
  }

  async function handleSend() {
    if (!title || !body) return;
    if (target === 'specific' && !targetUserId) return;
    setSending(true);
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
    fetchNotifications();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Notifications</h1>

      {/* Send Form */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Send Notification</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#a78bfa]"
          />
          <textarea
            placeholder="Message body..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#a78bfa] resize-none"
          />
          <div className="flex items-center gap-4">
            <select
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                if (e.target.value === 'all') setTargetUserId('');
              }}
              className="bg-[#27272a] border border-[#3f3f46] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
            >
              <option value="all">All Users</option>
              <option value="specific">Specific User</option>
            </select>
            {target === 'specific' && (
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
              >
                <option value="">Select a user...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={handleSend}
              disabled={sending || !title || !body || (target === 'specific' && !targetUserId)}
              className="bg-[#a78bfa] hover:bg-[#8b5cf6] text-black font-medium px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#27272a]">
          <h3 className="text-sm font-medium text-zinc-400">History</h3>
        </div>
        <div className="divide-y divide-[#27272a]">
          {notifications.map((n) => (
            <div key={n.id} className="px-4 py-3 hover:bg-[#27272a] transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{n.message}</p>
                  {n.target_user_id && (
                    <p className="text-xs text-zinc-600 mt-0.5">To: {n.target_user_id.slice(0, 8)}...</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    n.status === 'sent' ? 'bg-green-500/20 text-green-400' :
                    n.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {n.status}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="px-4 py-8 text-center text-zinc-500 text-sm">No notifications yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
