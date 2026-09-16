'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Award } from 'lucide-react';

interface BadgeProps {
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  earned?: boolean;
  title?: string;
  className?: string;
}

const tierColors = {
  bronze: { bg: 'bg-amber-600', text: 'text-amber-100', glow: 'shadow-[0_0_15px_rgba(180,83,9,0.4)]' },
  silver: { bg: 'bg-slate-400', text: 'text-slate-100', glow: 'shadow-[0_0_15px_rgba(148,163,184,0.4)]' },
  gold: { bg: 'bg-yellow-500', text: 'text-yellow-50', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.5)]' },
  platinum: { bg: 'bg-cyan-500', text: 'text-cyan-50', glow: 'shadow-[0_0_25px_rgba(6,182,212,0.5)]' },
  diamond: { bg: 'bg-purple-500', text: 'text-purple-50', glow: 'shadow-[0_0_30px_rgba(168,85,247,0.5)]' },
};

export function Badge({ icon, tier, earned = false, title, className }: BadgeProps) {
  const colors = tierColors[tier];

  return (
    <motion.div
      whileHover={{ scale: 1.1, rotate: earned ? [0, -5, 5, 0] : 0 }}
      className={twMerge('relative group', className)}
    >
      <div
        className={clsx(
          'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300',
          earned ? colors.bg : 'bg-slate-200 dark:bg-slate-700',
          earned && colors.glow
        )}
      >
        {earned ? (
          <span className={colors.text}>{icon}</span>
        ) : (
          <Award className="w-6 h-6 text-slate-400" />
        )}
      </div>
      {title && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap z-10">
          {title}
        </div>
      )}
    </motion.div>
  );
}
