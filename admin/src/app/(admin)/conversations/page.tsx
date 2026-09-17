'use client';

import { useEffect, useState } from 'react';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    const res = await fetch('/api/conversations');
    const data = await res.json();
    setConversations(data.conversations || []);
    setLoading(false);
  }

  async function openConversation(convo: any) {
    setSelected(convo);
    setLoadingMessages(true);
    const res = await fetch(`/api/conversations/${convo.id}/messages`);
    const data = await res.json();
    setMessages(data.messages || []);
    setLoadingMessages(false);
  }

  if (selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelected(null); setMessages([]); }}
            className="text-zinc-400 hover:text-white transition-colors text-sm"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">{selected.title}</h1>
          <span className="text-xs text-zinc-500">
            {selected.profiles?.name || 'Unknown'} · {selected.model}
          </span>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-4">
          {loadingMessages ? (
            <div className="text-zinc-400 text-sm">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-zinc-500 text-sm text-center py-8">No messages yet</div>
          ) : (
            messages.map((msg: any) => (
              <div
                key={msg.id}
                className={`rounded-lg px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-[#a78bfa]/10 border border-[#a78bfa]/20 ml-8'
                    : 'bg-[#27272a] mr-8'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${
                    msg.role === 'user' ? 'text-[#a78bfa]' : 'text-green-400'
                  }`}>
                    {msg.role === 'user' ? 'User' : 'Assistant'}
                  </span>
                  <span className="text-xs text-zinc-600">
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-zinc-300 whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    );
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
                <tr
                  key={convo.id}
                  onClick={() => openConversation(convo)}
                  className="border-b border-[#27272a] hover:bg-[#27272a] transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm text-zinc-400">{convo.profiles?.name || 'Unknown'}</td>
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
