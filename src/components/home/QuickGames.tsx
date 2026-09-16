'use client';

import { motion } from 'framer-motion';
import { Layers, Brain, Timer, Link, Zap, Swords, Trophy, TrendingUp, Zap as ZapIcon, Map } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const quickGames = [
  { title: 'Flashcards', icon: Layers, color: '#60A5FA', unlocked: true },
  { title: 'Quiz', icon: Brain, color: '#34D399', unlocked: true },
  { title: 'Speed Test', icon: Timer, color: '#F59E0B', unlocked: true },
  { title: 'Match Up', icon: Link, color: '#A78BFA', unlocked: false },
  { title: 'Speed Round', icon: Zap, color: '#F472B6', unlocked: false },
  { title: 'Boss Battle', icon: Swords, color: '#EF4444', unlocked: false },
  { title: 'Marathon', icon: Trophy, color: '#2ABFBF', unlocked: false },
  { title: 'Strategy Quiz', icon: TrendingUp, color: '#8B5CF6', unlocked: false },
  { title: 'Reflex Challenge', icon: ZapIcon, color: '#06B6D4', unlocked: false },
  { title: 'Knowledge Explorer', icon: Map, color: '#10B981', unlocked: false },
];

export function QuickGames() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h2 className="font-bold text-slate-800 dark:text-white text-lg mb-3">Quick Play</h2>
      <div className="grid grid-cols-4 gap-3">
        {quickGames.map((game, i) => {
          const Icon = game.icon;
          return (
            <motion.div
              key={game.title}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.05 }}
            >
              <Card
                className={`text-center py-4 ${!game.unlocked ? 'opacity-50' : ''}`}
                onClick={game.unlocked ? () => {} : undefined}
              >
                <motion.div
                  whileHover={game.unlocked ? { scale: 1.15, rotate: 5 } : {}}
                  whileTap={game.unlocked ? { scale: 0.9 } : {}}
                  className="w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center"
                  style={{ background: `${game.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: game.color }} />
                </motion.div>
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 leading-tight">
                  {game.title}
                </span>
                {!game.unlocked && (
                  <div className="absolute top-1 right-1 text-xs">🔒</div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}