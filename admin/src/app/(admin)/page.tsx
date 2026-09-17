'use client';

import { useEffect, useState, useCallback } from 'react';
import { getDashboardStats } from '@/lib/supabase';

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalUsers: 0, totalConversations: 0, totalMessages: 0 });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Failed to fetch dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-zinc-500">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchStats}
            className="px-3 py-1.5 bg-[#27272a] hover:bg-[#3f3f46] rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers} icon="👥" loading={loading} />
        <StatCard label="Conversations" value={stats.totalConversations} icon="💬" loading={loading} />
        <StatCard label="Messages" value={stats.totalMessages} icon="📨" loading={loading} />
      </div>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/notifications" className="bg-[#27272a] hover:bg-[#3f3f46] rounded-lg p-4 text-sm text-white transition-colors">
            🔔 Send Notification
          </a>
          <a href="/prompts" className="bg-[#27272a] hover:bg-[#3f3f46] rounded-lg p-4 text-sm text-white transition-colors">
            🧠 Edit System Prompt
          </a>
          <a href="/users" className="bg-[#27272a] hover:bg-[#3f3f46] rounded-lg p-4 text-sm text-white transition-colors">
            👥 Manage Users
          </a>
          <a href="/activity" className="bg-[#27272a] hover:bg-[#3f3f46] rounded-lg p-4 text-sm text-white transition-colors">
            📋 View Activity
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, loading }: { label: string; value: number; icon: string; loading: boolean }) {
  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          {loading ? (
            <div className="h-9 w-20 bg-[#27272a] rounded animate-pulse mt-1" />
          ) : (
            <p className="text-3xl font-bold text-white mt-1">{value.toLocaleString()}</p>
          )}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
