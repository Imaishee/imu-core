'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { motion } from 'framer-motion';
import { TouchFeedback } from '@/components/layout/TouchFeedback';

type Entry = {
  id: string; day_of_week: number; start_time: string; end_time: string;
  label: string; subject_code: string; subject_name: string; location: string;
  faculty_initials: string; entry_type: string; room: string;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SLOT_COLORS: Record<string, string> = {
  MJGG01: 'bg-violet-glow border-l-4 border-violet-primary',
  MJGG02: 'bg-coral-50 border-l-4 border-coral-primary',
  MJGG03: 'bg-mint-50 border-l-4 border-mint-primary',
  MJGG04: 'bg-amber-50 border-l-4 border-amber-primary',
  MJGG05: 'bg-rose-50 border-l-4 border-rose-primary',
  MNGG01: 'bg-sky-50 border-l-4 border-sky-primary',
  MNGG02: 'bg-blue-50 border-l-4 border-blue-500',
  SECGG01: 'bg-teal-50 border-l-4 border-teal-500',
  SECGG02: 'bg-indigo-50 border-l-4 border-indigo-500',
  RECESS: 'bg-gray-50 border-l-4 border-gray-300',
};

export default function TimetablePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date().getDay();
    return today === 0 ? 1 : today;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/timetable').then(r => r.json()).then(d => {
      setEntries(d.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const dayEntries = entries.filter(e => e.day_of_week === selectedDay);

  return (
    <AppShell>
      <div className="px-4 pb-24 pt-2 space-y-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Timetable</h1>
          <p className="text-sm text-gray-500">Your weekly class schedule</p>
        </motion.div>

        {/* Day Tabs */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[1, 2, 3, 4, 5].map((day) => (
            <TouchFeedback key={day}>
              <button
                onClick={() => setSelectedDay(day)}
                className={'mobile-tab ' + (selectedDay === day ? 'active' : '')}
              >
                {DAY_SHORT[day]}
              </button>
            </TouchFeedback>
          ))}
        </div>

        {/* Schedule */}
        <div>
          <h3 className="font-bold text-gray-900 mb-1">{DAYS[selectedDay]}</h3>
          <p className="text-xs text-gray-500 mb-3">{dayEntries.filter(e => e.entry_type === 'lecture').length} classes</p>

          <div className="space-y-2">
            {dayEntries.map((entry, i) => {
              const colorClass = SLOT_COLORS[entry.subject_code || entry.label] || 'bg-white border-l-4 border-gray-300';
              const isBreak = entry.entry_type === 'break' || entry.label === 'RECESS';
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <TouchFeedback>
                    <div className={'rounded-xl p-3 ' + (isBreak ? 'bg-gray-50 border-l-4 border-gray-300' : colorClass)}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className={'text-sm font-bold ' + (isBreak ? 'text-gray-400 italic' : 'text-gray-900')}>
                            {entry.label}
                          </p>
                          {entry.subject_name && (
                            <p className="text-xs text-gray-600 mt-0.5">{entry.subject_name}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-gray-700">
                            {entry.start_time?.slice(0, 5)} - {entry.end_time?.slice(0, 5)}
                          </p>
                          {entry.faculty_initials && (
                            <p className="text-xs text-gray-500">{entry.faculty_initials} · {entry.location}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TouchFeedback>
                </motion.div>
              );
            })}
            {dayEntries.length === 0 && !loading && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="card-interactive p-8 text-center">
                <p className="text-4xl mb-2">🎉</p>
                <p className="font-bold text-gray-900">No classes today!</p>
                <p className="text-sm text-gray-500">Enjoy your day off</p>
              </motion.div>
            )}
          </div>
        </div>

        {loading && (
          <div className="space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-16 w-full" />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
