'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

const links = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/updates', label: 'Updates' },
  { href: '/download', label: 'Download' },
  { href: '/about', label: 'About' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(14, 21, 18, 0.75)', borderBottom: '1px solid rgba(42, 59, 50, 0.5)' }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={36} rounded="lg" />
          <span className="font-bold text-cream-text text-lg tracking-tight">I&apos;MU</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                pathname === link.href
                  ? 'text-white'
                  : 'text-cream-muted hover:text-cream-text'
              }`}
              style={pathname === link.href ? { background: 'rgba(45, 106, 79, 0.3)', border: '1px solid rgba(82, 183, 136, 0.2)' } : {}}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href="/download"
          className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-all cute-press"
          style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}
        >
          Get App
        </Link>
      </div>
    </nav>
  );
}
