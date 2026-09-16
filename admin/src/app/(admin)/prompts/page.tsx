'use client';

import { useEffect, useState } from 'react';

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    fetchPrompts();
  }, []);

  async function fetchPrompts() {
    const res = await fetch('/api/prompts');
    const data = await res.json();
    setPrompts(data.prompts || []);
  }

  async function savePrompt(id: string) {
    await fetch('/api/prompts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, prompt: editText }),
    });
    setEditing(null);
    fetchPrompts();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Prompt Engine</h1>
      <p className="text-sm text-zinc-400">Modify system prompts that control the AI behavior. Changes take effect immediately.</p>

      <div className="space-y-4">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">{prompt.name}</h3>
                <p className="text-xs text-zinc-500">Version {prompt.version} · {prompt.is_active ? 'Active' : 'Inactive'}</p>
              </div>
              {editing === prompt.id ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => savePrompt(prompt.id)}
                    className="bg-[#a78bfa] hover:bg-[#8b5cf6] text-black text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="bg-[#27272a] hover:bg-[#3f3f46] text-zinc-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditing(prompt.id); setEditText(prompt.prompt); }}
                  className="bg-[#27272a] hover:bg-[#3f3f46] text-zinc-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
            {editing === prompt.id ? (
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={6}
                className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#a78bfa] resize-none"
              />
            ) : (
              <pre className="bg-[#27272a] rounded-lg px-4 py-3 text-sm text-zinc-300 font-mono whitespace-pre-wrap overflow-x-auto">
                {prompt.prompt}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
