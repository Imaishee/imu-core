'use client';

import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';

interface DailyChallengeProps {
  title: string;
  description: string;
  progress: number;
  target: number;
  xpReward: number;
}

export function DailyChallenge({ title, description, progress, target, xpReward }: DailyChallengeProps) {
  const percent = (progress / target) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card glow>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-xp-100 dark:bg-xp-900/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-xp-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">{title}</h3>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
        </div>

        <ProgressBar progress={percent} showPercent={false} color="#F59E0B" className="mb-3" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Resets in 12h</span>
          </div>
          <Button variant="xp" className="px-4 py-1.5 text-xs">
            +{xpReward} XP
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
