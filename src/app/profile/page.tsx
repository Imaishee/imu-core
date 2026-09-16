'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';

type Profile = {
  display_name: string; xp_total: number; level: number; level_title: string;
  streak_days: number; longest_streak: number; total_study_minutes: number;
  games_played: number; games_won: number; created_at: string;
};
type Achievement = { title: string; description: string; icon: string; tier: string; earned_at: string; };

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-amber-100 text-amber-700', silver: 'bg-gray-100 text-gray-600',
  gold: 'bg-yellow-100 text-yellow-700', platinum: 'bg-violet-100 text-violet-700',
  diamond: 'bg-blue-100 text-blue-700',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then(r => r.json()),
      fetch('/api/achievements').then(r => r.json()),
    ]).then(([prof, ach]) => {
      setProfile(prof.data);
      setAchievements(ach.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const stats = profile ? [
    { label: 'Total XP', value: profile.xp_total, icon: '⭐', color: 'bg-amber-50 text-amber-primary' },
    { label: 'Level', value: `${profile.level}`, icon: '📊', color: 'bg-violet-glow text-violet-primary' },
    { label: 'Study Hours', value: Math.round(profile.total_study_minutes / 60), icon: '⏱️', color: 'bg-mint-50 text-mint-primary' },
    { label: 'Games Won', value: profile.games_won, icon: '🏆', color: 'bg-coral-50 text-coral-primary' },
    { label: 'Best Streak', value: `${profile.longest_streak}d`, icon: '🔥', color: 'bg-rose-50 text-rose-primary' },
    { label: 'Games Played', value: profile.games_played, icon: '🎮', color: 'bg-sky-50 text-sky-primary' },
  ] : [];

  return (
    <AppShell>
      <div className="px-4 pb-24 pt-2 space-y-5">
        {/* Profile Header */}
        <section className="card-interactive p-6 text-center">
          <div className="w-20 h-20 rounded-full gradient-violet flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3 shadow-lg">
            {profile?.display_name?.charAt(0) || 'S'}
          </div>
          <h2 className="text-xl font-bold text-gray-900 font-display">{profile?.display_name || 'Scholar'}</h2>
          <p className="text-sm text-gray-500 mt-1">Level {profile?.level || 1} · {profile?.level_title || 'Novice'}</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <span className="streak-fire">🔥</span>
            <span className="text-sm font-bold text-coral-primary">{profile?.streak_days || 0} day streak</span>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="card-interactive p-3 text-center">
              <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center text-sm mx-auto mb-1`}>
                {stat.icon}
              </div>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              <p className="text-[10px] text-gray-500">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Achievements */}
        <section>
          <h3 className="font-bold text-gray-900 mb-3">Achievements ({achievements.length})</h3>
          {achievements.length > 0 ? (
            <div className="space-y-2">
              {achievements.map((ach, i) => (
                <div key={i} className="card-interactive p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-glow flex items-center justify-center text-lg flex-shrink-0">
                    {ach.icon || '🏅'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{ach.title}</p>
                      <span className={`tag text-[10px] ${TIER_COLORS[ach.tier] || ''}`}>{ach.tier}</span>
                    </div>
                    <p className="text-xs text-gray-500">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-interactive p-6 text-center">
              <p className="text-3xl mb-2">🏅</p>
              <p className="text-sm font-bold text-gray-900">No achievements yet</p>
              <p className="text-xs text-gray-500">Study and play games to earn badges</p>
            </div>
          )}
        </section>

        {loading && (
          <div className="space-y-3">
            <div className="skeleton h-40 w-full" />
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-20" />)}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
