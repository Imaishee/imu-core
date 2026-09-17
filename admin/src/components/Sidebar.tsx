'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/users', label: 'Users', icon: '👥' },
  { href: '/conversations', label: 'Conversations', icon: '💬' },
  { href: '/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/prompts', label: 'Prompt Engine', icon: '🧠' },
  { href: '/versions', label: 'App Versions', icon: '📱' },
  { href: '/activity', label: 'Activity Log', icon: '📋' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#18181b] border-r border-[#27272a] flex flex-col">
      <div className="p-4 border-b border-[#27272a]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-black font-bold text-xs">IM</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">I'MU Admin</h1>
            <p className="text-xs text-zinc-500">Management Panel</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              pathname === link.href
                ? 'bg-[#27272a] text-white'
                : 'text-zinc-400 hover:bg-[#27272a] hover:text-white'
            }`}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-[#27272a]">
        <a href="/" className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors">
          <span>←</span>
          <span>Back to App</span>
        </a>
      </div>
    </aside>
  );
}
