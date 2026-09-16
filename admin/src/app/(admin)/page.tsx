import { getDashboardStats } from '@/lib/supabase';

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers} icon="👥" />
        <StatCard label="Conversations" value={stats.totalConversations} icon="💬" />
        <StatCard label="Messages" value={stats.totalMessages} icon="📨" />
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

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value.toLocaleString()}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
