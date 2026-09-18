'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl"
      style={{
        background: 'rgba(251, 246, 236, 0.85)',
        borderBottom: '1px solid rgba(233, 224, 206, 0.6)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={36} rounded="lg" />
          <span className="font-bold text-lg tracking-tight" style={{ color: '#1F2A24' }}>
            I&apos;MU
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={
                pathname === link.href
                  ? {
                      background: 'rgba(45, 106, 79, 0.1)',
                      color: '#2D6A4F',
                      border: '1px solid rgba(45, 106, 79, 0.15)',
                    }
                  : { color: '#5C6B62' }
              }
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/download"
            className="hidden md:inline-block px-5 py-2 rounded-full text-sm font-semibold text-white transition-all cute-press"
            style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}
          >
            Get App
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ color: '#1F2A24' }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden px-6 pb-4 space-y-1"
          style={{ background: 'rgba(251, 246, 236, 0.95)', borderBottom: '1px solid rgba(233, 224, 206, 0.6)' }}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={
                pathname === link.href
                  ? { background: 'rgba(45, 106, 79, 0.1)', color: '#2D6A4F' }
                  : { color: '#5C6B62' }
              }
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/download"
            onClick={() => setMobileOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-white text-center"
            style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}
          >
            Get App
          </Link>
        </div>
      )}
    </nav>
  );
}
