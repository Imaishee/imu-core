'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { QuickGames } from '@/components/home/QuickGames';
import { PullToRefresh } from '@/components/layout/PullToRefresh';

const GRADIENTS = ['gradient-violet', 'gradient-coral', 'gradient-mint', 'gradient-rose', 'gradient-amber', 'gradient-sky'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Profile = { name: string; streak: number; xp_total: number; level: number; avatar_url: string | null };
type TodayTask = { title: string; type: string; done: boolean };

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayTasks, setTodayTasks] = useState<TodayTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([
        fetch('/api/profile').then(r => r.ok ? r.json() : { data: null }),
        fetch('/api/study').then(r => r.ok ? r.json() : { data: { today: [] } }),
      ]);
      if (p.data) setProfile(p.data);
      if (s.data?.today) setTodayTasks(s.data.today);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const dayOfWeek = new Date().getDay();
  const dayName = DAY_NAMES[dayOfWeek];

  const quickLinks = [
    { href: '/syllabus', label: 'Syllabus', icon: '📚', gradient: GRADIENTS[0] },
    { href: '/chat', label: 'AI Chat', icon: '🤖', gradient: GRADIENTS[1] },
    { href: '/prep', label: 'Exam Prep', icon: '🎯', gradient: GRADIENTS[2] },
    { href: '/timetable', label: 'Timetable', icon: '📅', gradient: GRADIENTS[3] },
    { href: '/videos', label: 'Videos', icon: '🎥', gradient: GRADIENTS[4] },
    { href: '/leaderboard', label: 'Ranks', icon: '🏆', gradient: GRADIENTS[5] },
  ];

  return (
    <AppShell>
      <PullToRefresh onRefresh={fetchData}>
        <div className="px-4 pb-24 pt-2 space-y-5">
          {/* Welcome */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full gradient-violet flex items-center justify-center text-white text-lg font-bold shadow-lg">
              {profile?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-xs text-gray-500">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋</p>
              <h1 className="text-lg font-bold text-gray-900">{profile?.name || 'Student'}</h1>
            </div>
            <div className="ml-auto flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-full">
              <span className="streak-fire">🔥</span>
              <span className="text-sm font-bold text-orange-600">{profile?.streak || 0}</span>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="gradient-hero rounded-3xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white/80 text-xs">Total XP</p>
                <p className="text-3xl font-black">{profile?.xp_total || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-xs">Level</p>
                <p className="text-2xl font-bold">{profile?.level || 1}</p>
              </div>
            </div>
            <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} transition={{ delay: 0.5, duration: 1 }}
                className="h-full bg-white rounded-full" />
            </div>
          </motion.div>

          {/* Quick Links */}
          <div>
            <h2 className="font-bold text-gray-900 text-lg mb-3">Quick Links</h2>
            <div className="grid grid-cols-3 gap-2">
              {quickLinks.map((link, i) => (
                <motion.div key={link.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}>
                  <Link href={link.href} className="block text-center mobile-card p-3">
                    <motion.div whileTap={{ scale: 0.9 }}
                      className={'w-10 h-10 rounded-xl mx-auto mb-1.5 flex items-center justify-center bg-gradient-to-br ' + link.gradient + ' shadow-sm'}>
                      <span className="text-lg">{link.icon}</span>
                    </motion.div>
                    <span className="text-[10px] font-semibold text-gray-600">{link.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Games */}
          <QuickGames />

          {/* Today's Tasks */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 text-lg">Today — {dayName}</h2>
              <Link href="/timetable" className="text-xs font-semibold text-violet-primary">Full Timetable</Link>
            </div>
            {todayTasks.length === 0 ? (
              <div className="mobile-card p-4 text-center text-gray-400 text-sm">
                No tasks scheduled for today 🎉
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 4).map((task, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="mobile-list-item bg-white rounded-xl shadow-sm">
                    <div className={'w-8 h-8 rounded-lg flex items-center justify-center text-sm ' +
                      (task.type === 'lecture' ? 'bg-violet-100 text-violet-600' :
                       task.type === 'revision' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600')}>
                      {task.type === 'lecture' ? '📖' : task.type === 'revision' ? '📝' : '✅'}
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-700 truncate">{task.title}</span>
                    {task.done && <span className="text-green-500 text-xs">Done</span>}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </PullToRefresh>
    </AppShell>
  );
}
