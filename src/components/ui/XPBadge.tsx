'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Star } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useEffect, useState } from 'react';

interface XPBadgeProps {
  amount: number;
  showSparkle?: boolean;
  className?: string;
}

export function XPBadge({ amount, showSparkle = true, className }: XPBadgeProps) {
  const [display, setDisplay] = useState(0);
  const count = useMotionValue(0);

  useEffect(() => {
    const controls = animate(count, amount, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [amount, count]);

  const colorClass = amount >= 50
    ? 'text-yellow-500'
    : amount >= 25
      ? 'text-xp-500'
      : 'text-xp-400';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={twMerge(
        clsx('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-xp-50 dark:bg-xp-900/30', className)
      )}
    >
      {showSparkle && (
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Star className={clsx('w-4 h-4 fill-current', colorClass)} />
        </motion.div>
      )}
      <span className={clsx('font-bold text-sm', colorClass)}>
        +{display}
      </span>
      <span className="text-xs font-semibold text-slate-500">XP</span>
    </motion.div>
  );
}
