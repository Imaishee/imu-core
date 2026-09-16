'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { QuickGames } from '@/components/home/QuickGames';
import Link from 'next/link';

const GRADIENTS = ['gradient-violet', 'gradient-coral', 'gradient-mint', 'gradient-rose', 'gradient-amber', 'gradient-sky'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Profile = {
  display_name: string; xp_total: number; level: number; level_title: string;
  streak_days: number; total_study_minutes: number; games_played: number;
};
type LevelDef = { level_number: number; title: string; xp_required: number; color: string; };
type DailyChallenge = { title: string; description: string; progress: number; target_value: number; xp_reward: number; completed: boolean; };
type Subject = { code: string; name: string; topic_count: string; done_count: string; };
type PrepExam = { exam_key: string; name: string; full_name: string; icon: string; color: string; description: string; tags: string[]; };
type TimetableEntry = { day_of_week: number; start_time: string; end_time: string; label: string; subject_code: string; location: string; faculty_initials: string; entry_type: string; };
type TodayClass = TimetableEntry;

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [levels, setLevels] = useState<LevelDef[]>([]);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<PrepExam[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => setProfile(d.data)).catch(() => {});
    fetch('/api/levels').then(r => r.json()).then(d => setLevels(d.data || [])).catch(() => {});
    fetch('/api/challenges/daily').then(r => r.json()).then(d => setChallenges(d.data || [])).catch(() => {});
    fetch('/api/subjects').then(r => r.json()).then(d => setSubjects(d.data || [])).catch(() => {});
    fetch('/api/prep/exams').then(r => r.json()).then(d => setExams(d.data || [])).catch(() => {});
    fetch('/api/timetable').then(r => r.json()).then(d => {
      const entries = d.data || [];
      setTimetable(entries);
      const today = new Date().getDay();
      setTodayClasses(entries.filter((e: TimetableEntry) => e.day_of_week === today && e.entry_type === 'lecture'));
    }).catch(() => {});
  }, []);

  const currentLevel = levels.find(l => l.level_number === profile?.level) || levels[2];
  const nextLevel = levels.find(l => l.level_number === (profile?.level || 3) + 1);
  const xpInLevel = profile ? profile.xp_total - (currentLevel?.xp_required || 0) : 0;
  const xpForNext = nextLevel ? nextLevel.xp_required - (currentLevel?.xp_required || 0) : 300;
  const progress = Math.min((xpInLevel / Math.max(xpForNext, 1)) * 100, 100);

  const totalTopics = subjects.reduce((sum, s) => sum + parseInt(s.topic_count || '0'), 0);
  const totalDone = subjects.reduce((sum, s) => sum + parseInt(s.done_count || '0'), 0);
  const syllabusProgress = totalTopics > 0 ? Math.round((totalDone / totalTopics) * 100) : 0;

  const quickLinks = [
    { href: '/syllabus', label: 'Syllabus', icon: '📚', color: 'bg-violet-glow text-violet-primary', gradient: 'gradient-violet' },
    { href: '/prep', label: 'Exam Prep', icon: '🎯', color: 'bg-coral-50 text-coral-primary', gradient: 'gradient-coral' },
    { href: '/timetable', label: 'Timetable', icon: '📅', color: 'bg-mint-50 text-mint-primary', gradient: 'gradient-mint' },
    { href: '/videos', label: 'Videos', icon: '🎬', color: 'bg-rose-50 text-rose-primary', gradient: 'gradient-rose' },
    { href: '/leaderboard', label: 'Ranks', icon: '🏆', color: 'bg-amber-50 text-amber-primary', gradient: 'gradient-amber' },
  ];

  return (
    <AppShell>
      <div className="px-4 pb-24 pt-2 space-y-5">

        {/* XP + Level Bar */}
        <section className="card-interactive p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-violet flex items-center justify-center text-white font-bold text-lg shadow-md">
                {profile?.level || 3}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{currentLevel?.title || 'Scholar'}</p>
                <p className="text-xs text-gray-500">{profile?.xp_total || 550} XP</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Next Level</p>
              <p className="text-sm font-bold text-violet-primary">{xpForNext - xpInLevel} XP away</p>
            </div>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill gradient-violet" style={{ width: `${progress}%` }} />
          </div>
        </section>

        {/* Streak + Stats Row */}
        <section className="grid grid-cols-3 gap-3">
          <div className="card-interactive p-3 text-center">
            <p className="streak-fire">🔥</p>
            <p className="text-xl font-bold text-gray-900">{profile?.streak_days || 0}</p>
            <p className="text-xs text-gray-500">Day Streak</p>
          </div>
          <div className="card-interactive p-3 text-center">
            <p className="text-2xl">⏱️</p>
            <p className="text-xl font-bold text-gray-900">{Math.round((profile?.total_study_minutes || 0) / 60)}h</p>
            <p className="text-xs text-gray-500">Study Time</p>
          </div>
          <div className="card-interactive p-3 text-center">
            <p className="text-2xl">🎮</p>
            <p className="text-xl font-bold text-gray-900">{profile?.games_played || 0}</p>
            <p className="text-xs text-gray-500">Games</p>
          </div>
        </section>

        {/* Syllabus Progress */}
        <section className="card-interactive p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Syllabus Progress</h3>
            <span className="text-sm font-bold text-violet-primary">{syllabusProgress}%</span>
          </div>
          <div className="progress-bar-track mb-3">
            <div className="progress-bar-fill gradient-mint" style={{ width: `${syllabusProgress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{totalDone}/{totalTopics} topics done</span>
            <span>{subjects.length} subjects</span>
          </div>
        </section>

        {/* Daily Challenge */}
        {challenges.length > 0 && (
          <section className="rounded-2xl gradient-daily p-4 text-white shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚡</span>
              <h3 className="font-bold">Daily Challenge</h3>
            </div>
            {challenges.slice(0, 2).map((c, i) => (
              <div key={i} className="bg-white/15 rounded-xl p-3 mt-2 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{c.title}</p>
                    <p className="text-xs text-white/70">{c.description}</p>
                  </div>
                  <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg">+{c.xp_reward} XP</span>
                </div>
                <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min((c.progress / Math.max(c.target_value, 1)) * 100, 100)}%` }} />
                </div>
                <p className="text-xs text-white/60 mt-1">{c.progress}/{c.target_value}</p>
              </div>
            ))}
          </section>
        )}

        {/* Today's Classes */}
        {todayClasses.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Today&apos;s Classes</h3>
              <Link href="/timetable" className="text-xs font-semibold text-violet-primary">View All</Link>
            </div>
            <div className="space-y-2">
              {todayClasses.slice(0, 4).map((cls, i) => (
                <div key={i} className="card-interactive p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-glow flex items-center justify-center text-violet-primary font-bold text-xs">
                    {cls.faculty_initials || 'TBA'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{cls.label}</p>
                    <p className="text-xs text-gray-500">{cls.start_time?.slice(0,5)} - {cls.end_time?.slice(0,5)} · {cls.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Games */}
        <QuickGames />

        {/* Quick Links Grid */}
        <section>
          <h3 className="font-bold text-gray-900 mb-3">Quick Access</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="card-interactive p-3 text-center group">
                <div className={`w-12 h-12 rounded-xl ${link.gradient} flex items-center justify-center text-2xl mx-auto mb-2 group-hover:scale-110 transition-transform shadow-sm`}>
                  {link.icon}
                </div>
                <p className="text-xs font-semibold text-gray-700">{link.label}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Competitive Exams Preview */}
        {exams.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Exam Prep</h3>
              <Link href="/prep" className="text-xs font-semibold text-violet-primary">See All</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {exams.slice(0, 5).map((exam) => (
                <Link key={exam.exam_key} href={`/prep/${exam.exam_key}`} className="min-w-[140px] card-interactive p-3 flex-shrink-0">
                  <p className="text-2xl mb-1">{exam.icon}</p>
                  <p className="text-sm font-bold text-gray-900">{exam.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{exam.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Subjects Preview */}
        {subjects.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">My Subjects</h3>
              <Link href="/syllabus" className="text-xs font-semibold text-violet-primary">View All</Link>
            </div>
            <div className="space-y-2">
              {subjects.slice(0, 4).map((subj) => {
                const done = parseInt(subj.done_count || '0');
                const total = parseInt(subj.topic_count || '0');
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <Link key={subj.code} href={`/syllabus?highlight=${subj.code}`} className="card-interactive p-3 block">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{subj.name}</p>
                      <span className="text-xs font-bold text-violet-primary ml-2">{pct}%</span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill gradient-violet" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{done}/{total} topics · {subj.code}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </AppShell>
  );
}
