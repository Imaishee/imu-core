'use client';

import { useEffect, useState } from 'react';

export function TopBar() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-2">
      <div>
        <p className="text-sm text-gray-500 font-medium">{greeting} 👋</p>
        <h1 className="text-xl font-bold text-gray-900 font-display">I&apos;M U CORE</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-xl bg-white shadow-card hover:shadow-card-hover transition-all">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-primary rounded-full border-2 border-cream-100"></span>
        </button>
        <div className="w-9 h-9 rounded-full gradient-violet flex items-center justify-center text-white font-bold text-sm shadow-md">
          S
        </div>
      </div>
    </header>
  );
}
