'use client';

import { useEffect, useState, useCallback } from 'react';

interface DashboardStats {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  totalNotifications: number;
  totalFriends: number;
}

interface HealthStatus {
  engine: { status: string; url: string; engine?: any; note?: string };
  database: { status: string; error?: string };
  hfSpace: { status: string; url: string; error?: string };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, healthRes] = await Promise.all([
        fetch('/api/stats').then(r => r.json()).catch(() => null),
        fetch('/api/health').then(r => r.json()).catch(() => null),
      ]);
      if (statsRes) setStats(statsRes);
      if (healthRes) setHealth(healthRes);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [fetchAll]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">I&apos;MU system overview</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[11px] text-zinc-600">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchAll}
            className="px-3 py-1.5 bg-[#141416] hover:bg-[#1a1a1e] border border-[#1a1a1e] rounded-lg text-xs text-zinc-400 hover:text-white transition-all"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* System Health Bar */}
      <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-4">
        <div className="flex items-center gap-6">
          <HealthIndicator
            label="Database"
            status={health?.database?.status || (loading ? 'loading' : 'unknown')}
          />
          <HealthIndicator
            label="IMU Engine"
            status={health?.engine?.status || (loading ? 'loading' : 'unknown')}
          />
          <HealthIndicator
            label="HF Space"
            status={health?.hfSpace?.status || (loading ? 'loading' : 'unknown')}
          />
          <HealthIndicator
            label="Groq API"
            status="online"
          />
          <div className="flex-1" />
          <div className="text-right">
            <p className="text-[11px] text-zinc-600">Engine</p>
            <p className="text-xs text-zinc-400 font-mono truncate max-w-[200px]">
              {health?.engine?.note || health?.engine?.url || 'Checking...'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          label="Users"
          value={stats?.totalUsers ?? 0}
          icon="👥"
          color="violet"
          loading={loading}
        />
        <StatCard
          label="Conversations"
          value={stats?.totalConversations ?? 0}
          icon="💬"
          color="blue"
          loading={loading}
        />
        <StatCard
          label="Messages"
          value={stats?.totalMessages ?? 0}
          icon="📨"
          color="green"
          loading={loading}
        />
        <StatCard
          label="Notifications"
          value={stats?.totalNotifications ?? 0}
          icon="🔔"
          color="amber"
          loading={loading}
        />
        <StatCard
          label="Friend Links"
          value={stats?.totalFriends ?? 0}
          icon="🫂"
          color="pink"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <QuickAction href="/notifications" icon="🔔" label="Send Notification" desc="Push to all users" />
        <QuickAction href="/users" icon="👥" label="Manage Users" desc="View & analyze users" />
        <QuickAction href="/conversations" icon="💬" label="Conversations" desc="Browse chat history" />
        <QuickAction href="/updates" icon="📦" label="App Updates" desc="Upload APK & push updates" />
        <QuickAction href="/health" icon="💓" label="System Health" desc="Engine & DB status" />
      </div>
    </div>
  );
}

function HealthIndicator({ label, status }: { label: string; status: string }) {
  const colors: Record<string, string> = {
    online: 'bg-green-500',
    ok: 'bg-green-500',
    offline: 'bg-red-500',
    error: 'bg-red-500',
    sleeping: 'bg-yellow-500 animate-pulse',
    loading: 'bg-yellow-500 animate-pulse',
    unknown: 'bg-zinc-600',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors[status] || colors.unknown}`} />
      <span className="text-xs text-zinc-400">{label}</span>
      <span className="text-[10px] text-zinc-600 capitalize">{status}</span>
    </div>
  );
}

function StatCard({ label, value, icon, color, loading }: {
  label: string;
  value: number;
  icon: string;
  color: string;
  loading: boolean;
}) {
  const borderColors: Record<string, string> = {
    violet: 'border-violet-500/20',
    blue: 'border-blue-500/20',
    green: 'border-green-500/20',
    amber: 'border-amber-500/20',
    pink: 'border-pink-500/20',
  };

  return (
    <div className={`bg-[#0a0a0b] border ${borderColors[color] || 'border-[#1a1a1e]'} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg">{icon}</span>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-[#141416] rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      )}
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  );
}

function QuickAction({ href, icon, label, desc }: {
  href: string;
  icon: string;
  label: string;
  desc: string;
}) {
  return (
    <a
      href={href}
      className="bg-[#0a0a0b] border border-[#1a1a1e] hover:border-violet-500/30 rounded-xl p-4 transition-all group"
    >
      <div className="text-xl mb-2">{icon}</div>
      <p className="text-sm font-medium text-white group-hover:text-violet-400 transition-colors">{label}</p>
      <p className="text-xs text-zinc-600 mt-0.5">{desc}</p>
    </a>
  );
}
