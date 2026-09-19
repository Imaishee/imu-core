'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const links = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/users', label: 'Users', icon: '👥' },
  { href: '/conversations', label: 'Conversations', icon: '💬' },
  { href: '/ai-messages', label: 'AI Messages', icon: '🤖' },
  { href: '/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/friends', label: 'Friends', icon: '🫂' },
  { href: '/updates', label: 'App Updates', icon: '📦' },
  { href: '/health', label: 'System Health', icon: '💓' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [latestVersion, setLatestVersion] = useState('...');

  useEffect(() => {
    fetch('/api/app-versions')
      .then(r => r.json())
      .then(data => {
        const versions = data.versions || [];
        if (versions.length > 0) {
          setLatestVersion(versions[0].version);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="w-64 bg-[#0a0a0b] border-r border-[#1a1a1e] flex flex-col">
      <div className="p-4 border-b border-[#1a1a1e]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-violet-500/20">
            <img src="/icon.png" alt="I'MU" className="w-full h-full object-cover" onError={(e) => {
              // Fallback to gradient with text if icon not found
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.className = 'w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20';
                const span = document.createElement('span');
                span.className = 'text-white font-bold text-sm';
                span.textContent = 'I\'M';
                parent.appendChild(span);
              }
            }} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">I&apos;MU Admin</h1>
            <p className="text-[11px] text-zinc-500">Mission Control</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                  : 'text-zinc-500 hover:bg-[#141416] hover:text-zinc-300 border border-transparent'
              }`}
            >
              <span className="text-base">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#1a1a1e]">
        <div className="px-3 py-2 text-[11px] text-zinc-600">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>System Online</span>
          </div>
          <div>IMU v{latestVersion}</div>
        </div>
      </div>
    </aside>
  );
}
