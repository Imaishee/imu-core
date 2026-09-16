'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const routes = ['/', '/syllabus', '/chat', '/leaderboard', '/settings', '/prep', '/timetable', '/videos', '/games', '/profile', '/levels'];

export function RouteProgress() {
  const pathname = usePathname();
  const idx = routes.indexOf(pathname);
  const progress = idx >= 0 ? ((idx + 1) / routes.length) * 100 : 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-transparent">
      <motion.div
        className="h-full gradient-violet"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      />
    </div>
  );
}
