'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function HeroSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-6"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-500 shadow-glow mb-4"
      >
        <span className="text-4xl">📚</span>
      </motion.div>

      <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">
        Welcome back, <span className="text-gradient-primary">Scholar</span>!
      </h1>

      <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center justify-center gap-1.5">
        <Sparkles className="w-4 h-4 text-xp-400" />
        Keep up the great work!
        <Sparkles className="w-4 h-4 text-xp-400" />
      </p>
    </motion.section>
  );
}
