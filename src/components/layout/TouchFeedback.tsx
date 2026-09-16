'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface TouchFeedbackProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function TouchFeedback({ children, onClick, className = '', disabled = false }: TouchFeedbackProps) {
  return (
    <motion.div
      whileTap={disabled ? {} : { scale: 0.97 }}
      whileHover={disabled ? {} : { scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={disabled ? undefined : onClick}
      className={className + (disabled ? ' opacity-50 pointer-events-none' : ' cursor-pointer active:bg-gray-50/50')}
    >
      {children}
    </motion.div>
  );
}
