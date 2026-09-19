'use client';

import { useEffect, useState } from 'react';

interface HealthData {
  engine: { status: string; url: string; engine?: any; error?: string };
  database: { status: string; error?: string };
  hfSpace: { status: string; url: string; error?: string; latency?: string };
  timestamp: string;
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchHealth() {
    const res = await fetch('/api/health');
    const data = await res.json();
    setHealth(data);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Health</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Real-time system status monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          {health && (
            <span className="text-[11px] text-zinc-600">
              Last check: {new Date(health.timestamp).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchHealth}
            className="px-3 py-1.5 bg-[#141416] hover:bg-[#1a1a1e] border border-[#1a1a1e] rounded-lg text-xs text-zinc-400 hover:text-white transition-all"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <ServiceCard
              name="Supabase Database"
              status={health?.database?.status || 'unknown'}
              error={health?.database?.error}
              details="PostgreSQL + Auth + Realtime"
            />
            <ServiceCard
              name="IMU Heart Engine"
              status={health?.engine?.status || 'unknown'}
              error={health?.engine?.error}
              details={health?.engine?.url || ''}
            />
            <ServiceCard
              name="HF Space (IMU Heart)"
              status={health?.hfSpace?.status || 'unknown'}
              error={health?.hfSpace?.error}
              details="shubham1440-imu-heart.hf.space"
            />
            <ServiceCard
              name="Groq API"
              status="online"
              details="api.groq.com"
            />
          </div>

          {health?.engine?.engine && (
            <div className="bg-[#0a0a0b] border border-[#1a1a1e] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Engine Details</h2>
              <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap bg-[#141416] rounded-lg p-4">
                {JSON.stringify(health.engine.engine, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ServiceCard({ name, status, error, details }: {
  name: string;
  status: string;
  error?: string;
  details: string;
}) {
  const isOk = status === 'online' || status === 'ok';
  const isOff = status === 'offline' || status === 'error';

  return (
    <div className={`bg-[#0a0a0b] border rounded-xl p-5 ${
      isOk ? 'border-green-500/20' : isOff ? 'border-red-500/20' : 'border-[#1a1a1e]'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-3 h-3 rounded-full ${
          isOk ? 'bg-green-500 shadow-lg shadow-green-500/50' :
          isOff ? 'bg-red-500 shadow-lg shadow-red-500/50' :
          'bg-yellow-500 animate-pulse'
        }`} />
        <h3 className="text-sm font-semibold text-white">{name}</h3>
      </div>
      <div className="space-y-1">
        <p className={`text-xs font-medium capitalize ${
          isOk ? 'text-green-400' : isOff ? 'text-red-400' : 'text-yellow-400'
        }`}>
          {status}
        </p>
        {error && (
          <p className="text-xs text-red-400/80">{error}</p>
        )}
        <p className="text-[11px] text-zinc-600 font-mono truncate">{details}</p>
      </div>
    </div>
  );
}
