'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'xp';
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const variantStyles = {
  primary: 'bg-primary-400 text-white hover:bg-primary-500 shadow-cartoon hover:shadow-cartoon-lg',
  secondary: 'bg-white text-primary-500 border-2 border-primary-200 hover:bg-primary-50 shadow-cartoon hover:shadow-cartoon-lg',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  xp: 'bg-gradient-to-r from-xp-400 to-xp-300 text-white hover:from-xp-500 hover:to-xp-400 shadow-cartoon hover:shadow-cartoon-lg',
};

export function Button({ variant = 'primary', className, children, disabled, onClick, type = 'button' }: ButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      className={twMerge(
        clsx(
          'rounded-full px-6 py-3 font-bold text-base transition-colors duration-200 active:translate-y-1 active:shadow-none',
          variantStyles[variant],
          disabled && 'opacity-50 cursor-not-allowed shadow-none'
        ),
        className
      )}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </motion.button>
  );
}
