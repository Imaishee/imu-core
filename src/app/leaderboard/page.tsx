'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { TouchFeedback } from '@/components/layout/TouchFeedback';

type LeaderboardEntry = {
  rank: number;
  display_name: string;
  xp_total: number;
  level: number;
  level_title: string;
  streak_days: number;
};

const PODIUM_COLORS = ['gradient-amber', 'gradient-gray-300', 'gradient-coral'];
const PODIUM_HEIGHTS = ['h-28', 'h-20', 'h-16'];
const MEDAL_EMOJIS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard').then(r => r.json()).then(d => {
      setEntries(d.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <AppShell>
      <div className="px-4 pb-24 pt-2 space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 font-display">Leaderboard</h1>
          <p className="text-sm text-gray-500">Top scholars this week</p>
        </div>

        {/* Podium */}
        {top3.length >= 3 && (
          <section className="flex items-end justify-center gap-3 pt-4">
            {[1, 0, 2].map((podiumIdx) => {
              const entry = top3[podiumIdx];
              const isFirst = podiumIdx === 0;
              return (
                <TouchFeedback key={podiumIdx}>
                  <div className="flex flex-col items-center w-24">
                    <div className={'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-md mb-1 ' + PODIUM_COLORS[podiumIdx] + (isFirst ? ' w-14 h-14 text-xl' : '')}>
                      {MEDAL_EMOJIS[podiumIdx]}
                    </div>
                    <p className="text-xs font-bold text-gray-900 text-center truncate w-full">{entry?.display_name}</p>
                    <p className="text-[10px] text-gray-500">{entry?.xp_total} XP</p>
                    <div className={PODIUM_HEIGHTS[podiumIdx] + ' w-full rounded-t-xl mt-1 flex items-start justify-center pt-2 ' + PODIUM_COLORS[podiumIdx]}>
                      <span className="text-white font-bold text-lg">{podiumIdx + 1}</span>
                    </div>
                  </div>
                </TouchFeedback>
              );
            })}
          </section>
        )}

        {/* Rest of leaderboard */}
        <section>
          <div className="space-y-2">
            {rest.map((entry) => (
              <TouchFeedback key={entry.rank}>
                <div className="card-interactive p-3 flex items-center gap-3">
                  <span className="w-8 text-center text-sm font-bold text-gray-400">{entry.rank}</span>
                  <div className="w-9 h-9 rounded-full gradient-violet flex items-center justify-center text-white font-bold text-xs">
                    {entry.display_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{entry.display_name}</p>
                    <p className="text-xs text-gray-500">Lv.{entry.level} {entry.level_title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-violet-primary">{entry.xp_total} XP</p>
                    {entry.streak_days > 0 && (
                      <p className="text-xs text-gray-400">🔥 {entry.streak_days}d</p>
                    )}
                  </div>
                </div>
              </TouchFeedback>
            ))}
          </div>
        </section>

        {entries.length === 0 && !loading && (
          <div className="card-interactive p-8 text-center">
            <p className="text-4xl mb-2">🏆</p>
            <p className="font-bold text-gray-900">No rankings yet</p>
            <p className="text-sm text-gray-500">Play games and study to climb the leaderboard</p>
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 w-full" />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
