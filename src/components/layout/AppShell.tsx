'use client';

import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { RouteProgress } from './RouteProgress';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-warm-bg">
      <RouteProgress />
      <TopBar />
      <main className="max-w-lg mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
