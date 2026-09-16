'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';

const quickGames = [
  { slug: 'flashcard', title: 'Flashcards', icon: '🃏', color: 'from-purple-400 to-violet-500', unlocked: true },
  { slug: 'quiz', title: 'Quiz', icon: '❓', color: 'from-blue-400 to-indigo-500', unlocked: true },
  { slug: 'match', title: 'Match Pairs', icon: '🔗', color: 'from-amber-400 to-orange-500', unlocked: true },
  { slug: 'wordsearch', title: 'Word Search', icon: '🔍', color: 'from-pink-400 to-rose-500', unlocked: true },
  { slug: 'puzzle', title: 'Puzzle', icon: '🧩', color: 'from-green-400 to-emerald-500', unlocked: true },
  { slug: 'speedround', title: 'Speed Round', icon: '⚡', color: 'from-red-400 to-pink-500', unlocked: true },
  { slug: 'bossbattle', title: 'Boss Battle', icon: '🐉', color: 'from-orange-400 to-red-500', unlocked: true },
  { slug: 'reflexchallenge', title: 'Reflex Challenge', icon: '🎯', color: 'from-cyan-400 to-blue-500', unlocked: true },
  { slug: 'strategyquiz', title: 'Strategy Quiz', icon: '📈', color: 'from-violet-400 to-purple-500', unlocked: true },
  { slug: 'knowledgeexplorer', title: 'Explorer', icon: '🗺️', color: 'from-teal-400 to-green-500', unlocked: true },
];

export function QuickGames() {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-900 text-lg">Quick Play</h2>
        <Link href="/games" className="text-xs font-semibold text-violet-primary">See All</Link>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {quickGames.slice(0, 10).map((game, i) => (
          <motion.div key={game.slug} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.04 }}>
            <Link href={'/games/' + game.slug} className="block text-center">
              <motion.div whileHover={{ scale: 1.15, rotate: 5 }} whileTap={{ scale: 0.9 }}
                className={'w-12 h-12 rounded-2xl mx-auto mb-1 flex items-center justify-center bg-gradient-to-br ' + game.color + ' shadow-sm'}>
                <span className="text-lg">{game.icon}</span>
              </motion.div>
              <span className="text-[9px] font-semibold text-gray-600 leading-tight block">{game.title}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
