'use client';

import { useEffect, useState } from 'react';

export default function AIMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    const res = await fetch('/api/ai-messages');
    const data = await res.json();
    setMessages(data.messages || []);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Messages</h1>
          <p className="text-sm text-zinc-500 mt-0.5">IMU Heart generated responses</p>
        </div>
        <button
          onClick={fetchMessages}
          className="px-3 py-1.5 bg-[#141416] hover:bg-[#1a1a1e] border border-[#1a1a1e] rounded-lg text-xs text-zinc-400 hover:text-white transition-all"
        >
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-20 bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-12 text-center">
          <span className="text-4xl">🤖</span>
          <p className="text-sm text-zinc-500 mt-3">No AI messages yet</p>
          <p className="text-xs text-zinc-600 mt-1">Messages will appear as users chat with the AI companion</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg: any) => (
            <div key={msg.id} className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-4 hover:border-[#2a2a2e] transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-medium text-green-400">AI</span>
                {msg.model && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1e] text-zinc-600">{msg.model}</span>
                )}
                {msg.intent && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{msg.intent}</span>
                )}
                {msg.mood && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">{msg.mood}</span>
                )}
                <span className="text-[10px] text-zinc-700 ml-auto">
                  {new Date(msg.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{msg.content || msg.response}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
