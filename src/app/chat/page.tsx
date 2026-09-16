'use client';

import { useState, useRef, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';

type Message = { role: 'user' | 'assistant'; content: string };
type Mode = 'ask' | 'explain-topic' | 'what-to-study' | 'quiz';
type Chat = { id: string; title: string; messages: Message[]; createdAt: number };

const MODES: { key: Mode; label: string; icon: string }[] = [
  { key: 'ask', label: 'Ask', icon: '💬' },
  { key: 'explain-topic', label: 'Explain', icon: '📖' },
  { key: 'what-to-study', label: 'Study Plan', icon: '📋' },
  { key: 'quiz', label: 'Quiz', icon: '❓' },
];

const QUICK_PROMPTS: Record<Mode, string[]> = {
  ask: ['What is geomorphology?', 'Explain plate tectonics', 'Difference between erosion and weathering'],
  'explain-topic': ['Explain the concept of isostasy', 'What is the hydrological cycle?', 'Tell me about climatology'],
  'what-to-study': ['What should I study today?', 'How to prepare for semester exams?', 'Plan my week'],
  quiz: ['Quiz me on physical geography', 'Test me on map projections', 'Ask me 5 questions on ocean currents'],
};

function renderMarkdown(text: string) {
  let html = text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-100 rounded-xl p-3 my-2 text-sm overflow-x-auto"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-violet-primary">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br/>');
  return '<p class="mb-2">' + html + '</p>';
}

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('ask');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('imu_chats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setChats(parsed);
        if (parsed.length > 0) setActiveChatId(parsed[0].id);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('imu_chats', JSON.stringify(chats));
    }
  }, [chats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId]);

  const activeChat = chats.find(c => c.id === activeChatId);
  const messages = activeChat?.messages || [];

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setShowSidebar(false);
  };

  const deleteChat = (id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(chats.length > 1 ? chats.find(c => c.id !== id)!.id : null);
    }
  };

  const updateChatMessages = (chatId: string, msgs: Message[]) => {
    setChats(prev => prev.map(c => {
      if (c.id !== chatId) return c;
      const firstUserMsg = msgs.find(m => m.role === 'user');
      const title = firstUserMsg ? firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '') : 'New Chat';
      return { ...c, messages: msgs, title };
    }));
  };

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isStreaming) return;

    let chatId = activeChatId;
    if (!chatId) {
      const newChat: Chat = { id: Date.now().toString(), title: msg.slice(0, 40), messages: [], createdAt: Date.now() };
      setChats(prev => [newChat, ...prev]);
      chatId = newChat.id;
      setActiveChatId(chatId);
    }

    const userMsg: Message = { role: 'user', content: msg };
    const currentMessages = chats.find(c => c.id === chatId)?.messages || [];
    const newMessages = [...currentMessages, userMsg];
    updateChatMessages(chatId, newMessages);
    setInput('');
    setIsStreaming(true);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    const withAssistant = [...newMessages, assistantMsg];
    updateChatMessages(chatId, withAssistant);

    try {
      const profile = JSON.parse(localStorage.getItem('imu_profile') || '{}');

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          mode,
          history: currentMessages.slice(-6),
          profile,
        }),
      });

      if (!res.ok) throw new Error('Chat request failed');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulated += parsed.content;
                const finalMessages = [...newMessages, { role: 'assistant' as const, content: accumulated }];
                updateChatMessages(chatId!, finalMessages);
              }
            } catch {}
          }
        }
      }
    } catch {
      const errorMsg = [...newMessages, { role: 'assistant' as const, content: 'Sorry, something went wrong. Please try again.' }];
      updateChatMessages(chatId!, errorMsg);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100dvh-80px)]">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-cream-100/80 backdrop-blur-xl border-b border-gray-200/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">IM&apos;U AI</h1>
                <p className="text-xs text-gray-500">{activeChat?.title || 'Your study assistant'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={createNewChat} className="p-2 rounded-xl bg-violet-primary text-white hover:bg-violet-dark transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  mode === m.key
                    ? 'bg-violet-primary text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowSidebar(false)} />
            <div className="relative w-72 bg-white h-full shadow-xl flex flex-col">
              <div className="p-4 border-b border-gray-100">
                <button onClick={createNewChat} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-primary text-white rounded-xl font-medium text-sm hover:bg-violet-dark transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  New Chat
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => { setActiveChatId(chat.id); setShowSidebar(false); }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all group ${
                      activeChatId === chat.id ? 'bg-violet-glow text-violet-primary' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                    <span className="text-sm truncate flex-1">{chat.title}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-all"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {chats.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-8">No chats yet. Start a new one!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-2xl gradient-violet flex items-center justify-center mb-4">
                <span className="text-3xl">🤖</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Hi, I&apos;m IM&apos;U AI</h2>
              <p className="text-sm text-gray-500 mb-6">Ask me anything about your studies</p>

              <div className="w-full max-w-sm space-y-2">
                {QUICK_PROMPTS[mode].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 hover:border-violet-primary/50 hover:bg-violet-primary/5 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-violet-primary text-white rounded-br-md'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                }`}
              >
                {msg.role === 'assistant' && !msg.content && isStreaming && i === messages.length - 1 ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-violet-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-violet-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-violet-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-16 z-40 px-4 pb-2 bg-cream-100">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-2 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              rows={1}
              className="flex-1 resize-none px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent max-h-24"
              style={{ minHeight: '36px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              className="p-2 rounded-xl bg-violet-primary text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-violet-dark transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
