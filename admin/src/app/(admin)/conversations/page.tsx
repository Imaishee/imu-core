'use client';

import { useEffect, useState } from 'react';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    const res = await fetch('/api/conversations');
    const data = await res.json();
    setConversations(data.conversations || []);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Conversations</h1>

      {loading ? (
        <div className="text-zinc-400">Loading...</div>
      ) : (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#27272a]">
                <th className="text-left px-4 py-3 text-sm text-zinc-400 font-medium">User</th>
                <th className="text-left px-4 py-3 text-sm text-zinc-400 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-sm text-zinc-400 font-medium">Model</th>
                <th className="text-left px-4 py-3 text-sm text-zinc-400 font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((convo) => (
                <tr key={convo.id} className="border-b border-[#27272a] hover:bg-[#27272a] transition-colors">
                  <td className="px-4 py-3 text-sm text-zinc-400">{convo.profiles?.email || 'Unknown'}</td>
                  <td className="px-4 py-3 text-sm text-white">{convo.title}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{convo.model}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {new Date(convo.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {conversations.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 text-sm">No conversations found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
