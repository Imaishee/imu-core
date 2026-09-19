'use client';

import { useEffect, useState } from 'react';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState('');

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

  const filtered = conversations.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.user_id?.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelected(null); setMessages([]); }}
            className="text-zinc-500 hover:text-white transition-colors text-sm"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">{selected.title || 'Untitled'}</h1>
            <p className="text-xs text-zinc-500 font-mono">
              {selected.user_name || selected.user_id?.slice(0, 12)} · {selected.model} · {new Date(selected.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-6 space-y-3">
          {loadingMessages ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 bg-[#141416] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-3xl">💬</span>
              <p className="text-sm text-zinc-600 mt-3">No messages in this conversation</p>
              <p className="text-[11px] text-zinc-700 mt-1">Messages may be stored in conversation payload</p>
            </div>
          ) : (
            messages.map((msg: any, idx: number) => (
              <div
                key={msg.id || idx}
                className={`rounded-lg px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-violet-500/5 border border-violet-500/10 ml-12'
                    : 'bg-[#141416] border border-[#1a1a1e] mr-12'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[11px] font-medium ${
                    msg.role === 'user' ? 'text-violet-400' : 'text-green-400'
                  }`}>
                    {msg.role === 'user' ? 'User' : 'AI'}
                  </span>
                  {msg.model && (
                    <span className="text-[10px] text-zinc-600 px-1.5 py-0.5 bg-[#1a1a1e] rounded">
                      {msg.model}
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-700">
                    {new Date(msg.created_at || msg.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-zinc-300 whitespace-pre-wrap">{msg.content || msg.text || JSON.stringify(msg)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Conversations</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{conversations.length} total conversations</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search title or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#141416] border border-[#1a1a1e] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 w-48"
          />
          <button
            onClick={fetchConversations}
            className="px-3 py-1.5 bg-[#141416] hover:bg-[#1a1a1e] border border-[#1a1a1e] rounded-lg text-xs text-zinc-400 hover:text-white transition-all"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-14 bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1e]">
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Model</th>
                <th className="text-left px-4 py-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((convo) => (
                <tr
                  key={convo.id}
                  onClick={() => openConversation(convo)}
                  className="border-b border-[#1a1a1e] hover:bg-[#141416] transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400">
                        {(convo.user_name || '?')[0]?.toUpperCase()}
                      </div>
                      <span className="text-xs text-zinc-400">{convo.user_name || convo.user_id?.slice(0, 12)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{convo.title || 'Untitled'}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a1e] text-zinc-500">
                      {convo.model}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {new Date(convo.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-zinc-600 text-sm">
                    {search ? 'No matching conversations' : 'No conversations yet'}
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
