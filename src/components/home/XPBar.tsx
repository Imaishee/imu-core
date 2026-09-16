'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface XPBarProps {
  level: number;
  xpInLevel: number;
  xpForNext: number;
  progress: number;
}

export function XPBar({ level, xpInLevel, xpForNext, progress }: XPBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Level {level} Progress
          </span>
          <span className="text-xs font-bold text-primary-400">
            {xpInLevel}/{xpForNext} XP
          </span>
        </div>
        <ProgressBar progress={progress} color="#2ABFBF" />
      </Card>
    </motion.div>
  );
}
