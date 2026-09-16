'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';

interface LevelCardProps {
  level: number;
  title: string;
  color: string;
  xp: number;
}

export function LevelCard({ level, title, color, xp }: LevelCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, type: 'spring' }}
      className="flex-1"
    >
      <Card glow className="text-center">
        <motion.div
          whileHover={{ rotate: [0, -5, 5, 0] }}
          className="w-16 h-16 rounded-2xl mx-auto mb-2 flex items-center justify-center text-2xl font-black text-white shadow-lg"
          style={{ background: color }}
        >
          {level}
        </motion.div>
        <h3 className="font-bold text-slate-800 dark:text-white text-sm">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{xp} XP earned</p>
      </Card>
    </motion.div>
  );
}
