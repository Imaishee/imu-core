'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, glow = false, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={twMerge(
        clsx(
          'rounded-cartoon bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 p-4 transition-all duration-200',
          glow && 'shadow-glow animate-pulse-glow',
          onClick && 'cursor-pointer'
        ),
        className
      )}
    >
      {children}
    </motion.div>
  );
}
