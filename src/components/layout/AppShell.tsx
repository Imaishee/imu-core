'use client';

import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { RouteProgress } from './RouteProgress';
import { SwipeBack } from './SwipeBack';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-warm-bg">
      <RouteProgress />
      <TopBar />
      <SwipeBack>
        <main className="max-w-lg mx-auto">
          {children}
        </main>
      </SwipeBack>
      <BottomNav />
    </div>
  );
}
