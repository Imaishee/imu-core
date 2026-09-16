'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Star } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface Level {
  id: number;
  title: string;
  xpRequired: number;
  unlockFeature: string;
  icon: string;
  color: string;
}

const levels: Level[] = [
  { id: 1, title: 'Beginner', xpRequired: 0, unlockFeature: 'Flashcards', icon: '🌱', color: 'from-green-400 to-emerald-500' },
  { id: 2, title: 'Apprentice', xpRequired: 100, unlockFeature: 'Quiz Mode', icon: '📚', color: 'from-blue-400 to-indigo-500' },
  { id: 3, title: 'Scholar', xpRequired: 300, unlockFeature: 'Match Game', icon: '🎓', color: 'from-purple-400 to-violet-500' },
  { id: 4, title: 'Expert', xpRequired: 600, unlockFeature: 'Word Search', icon: '🧠', color: 'from-pink-400 to-rose-500' },
  { id: 5, title: 'Master', xpRequired: 1000, unlockFeature: 'Puzzle Mode', icon: '⚡', color: 'from-amber-400 to-orange-500' },
  { id: 6, title: 'Champion', xpRequired: 1500, unlockFeature: 'Speed Round', icon: '🏆', color: 'from-red-400 to-pink-500' },
  { id: 7, title: 'Legend', xpRequired: 2200, unlockFeature: 'Boss Battles', icon: '👑', color: 'from-yellow-400 to-amber-500' },
  { id: 8, title: 'Mythic', xpRequired: 3000, unlockFeature: 'Custom Games', icon: '🔥', color: 'from-orange-400 to-red-500' },
  { id: 9, title: 'Divine', xpRequired: 4000, unlockFeature: 'Multiplayer', icon: '✨', color: 'from-cyan-400 to-blue-500' },
  { id: 10, title: 'Transcendent', xpRequired: 5500, unlockFeature: 'All Features', icon: '🌟', color: 'from-violet-400 to-purple-500' },
];

export default function LevelsPage() {
  const [userXP, setUserXP] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setUserXP(d.data.xp_total || 0);
          setCurrentLevel(d.data.level || 1);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getNextLevelXP = () => {
    const next = levels.find(l => l.id === currentLevel + 1);
    return next ? next.xpRequired : levels[levels.length - 1].xpRequired;
  };

  const getCurrentLevelXP = () => {
    const level = levels.find(l => l.id === currentLevel);
    return level ? level.xpRequired : 0;
  };

  const getProgress = () => {
    const current = getCurrentLevelXP();
    const next = getNextLevelXP();
    if (next === current) return 100;
    return Math.min(100, Math.max(0, ((userXP - current) / (next - current)) * 100));
  };

  const isUnlocked = (levelId: number) => {
    const level = levels.find(l => l.id === levelId);
    return level ? userXP >= level.xpRequired : false;
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 pb-24 pt-2 space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 font-display">Your Levels</h1>
          <p className="text-sm text-gray-500">Level up to unlock new features</p>
        </div>

        {/* Current Level Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={'relative overflow-hidden rounded-3xl bg-gradient-to-br ' + (levels[currentLevel - 1]?.color || 'from-purple-400 to-violet-500') + ' p-6 shadow-2xl'}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-5xl">
                {levels[currentLevel - 1]?.icon || '🌱'}
              </motion.div>
              <div>
                <p className="text-white/80 text-sm">Current Level</p>
                <h2 className="text-2xl font-black text-white">{levels[currentLevel - 1]?.title || 'Beginner'}</h2>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-white/80 mb-2">
                <span>{userXP} XP</span>
                <span>{getNextLevelXP()} XP</span>
              </div>
              <div className="w-full h-3 bg-white/30 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: getProgress() + '%' }}
                  transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-white rounded-full" />
              </div>
              <p className="text-white/60 text-xs mt-2 text-center">{Math.max(0, getNextLevelXP() - userXP)} XP to next level</p>
            </div>
          </div>
        </motion.div>

        {/* Level Grid */}
        <div className="grid grid-cols-2 gap-3">
          {levels.map((level, i) => {
            const unlocked = isUnlocked(level.id);
            const isCurrent = level.id === currentLevel;
            return (
              <motion.div key={level.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={'relative rounded-2xl p-4 ' +
                  (unlocked ? 'bg-gradient-to-br ' + level.color + ' shadow-lg' : 'bg-gray-100') +
                  (isCurrent ? ' ring-2 ring-violet-primary ring-offset-2' : '')}
              >
                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 rounded-2xl z-10">
                    <Lock className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="text-center">
                  <span className="text-2xl">{level.icon}</span>
                  <h3 className={'font-bold mt-1 text-sm ' + (unlocked ? 'text-white' : 'text-gray-500')}>{level.title}</h3>
                  <p className={'text-xs mt-0.5 ' + (unlocked ? 'text-white/80' : 'text-gray-400')}>{level.xpRequired} XP</p>
                  <p className={'text-[10px] mt-1 ' + (unlocked ? 'text-white/60' : 'text-gray-400')}>{level.unlockFeature}</p>
                </div>
                {isCurrent && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg z-20">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
