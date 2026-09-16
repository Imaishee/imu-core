'use client';

import { useEffect, useState } from 'react';

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    const res = await fetch('/api/activity');
    const data = await res.json();
    setLogs(data.logs || []);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Activity Log</h1>

      {loading ? (
        <div className="text-zinc-400">Loading...</div>
      ) : (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="divide-y divide-[#27272a]">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3 hover:bg-[#27272a] transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">
                      <span className="font-medium">{log.profiles?.full_name || log.profiles?.email || 'System'}</span>
                      {' '}
                      <span className="text-zinc-400">{log.action}</span>
                    </p>
                    {log.metadata && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {JSON.stringify(log.metadata)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="px-4 py-8 text-center text-zinc-500 text-sm">No activity yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
