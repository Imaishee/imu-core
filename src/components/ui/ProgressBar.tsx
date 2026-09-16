'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercent?: boolean;
  color?: string;
  className?: string;
}

export function ProgressBar({
  progress,
  label,
  showPercent = true,
  color = '#2ABFBF',
  className,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={twMerge('w-full', className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</span>}
          {showPercent && (
            <span className="text-xs font-bold text-slate-400">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div className="w-full h-4 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className="h-full rounded-full relative"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}dd)` }}
        >
          <div
            className="absolute inset-0 rounded-full opacity-60"
            style={{ boxShadow: `0 0 12px ${color}80` }}
          />
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/30 rounded-full" />
        </motion.div>
      </div>
    </div>
  );
}
