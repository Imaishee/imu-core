import Link from 'next/link';
import { Heart } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer
      className="border-t"
      style={{ borderColor: '#E9E0CE', backgroundColor: '#FBF6EC' }}
    >
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Logo size={36} rounded="lg" />
              <span className="font-bold text-lg" style={{ color: '#1F2A24' }}>
                I&apos;MU
              </span>
            </div>
            <p className="text-sm max-w-xs" style={{ color: '#5C6B62' }}>
              Your AI companion. Built with care.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <h4 className="font-semibold text-sm mb-3" style={{ color: '#1F2A24' }}>
                Product
              </h4>
              <div className="flex flex-col gap-2">
                <Link href="/features" className="text-sm transition-colors" style={{ color: '#5C6B62' }}>
                  Features
                </Link>
                <Link href="/download" className="text-sm transition-colors" style={{ color: '#5C6B62' }}>
                  Download
                </Link>
                <Link href="/updates" className="text-sm transition-colors" style={{ color: '#5C6B62' }}>
                  Updates
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3" style={{ color: '#1F2A24' }}>
                About
              </h4>
              <div className="flex flex-col gap-2">
                <Link href="/about" className="text-sm transition-colors" style={{ color: '#5C6B62' }}>
                  About Us
                </Link>
                <Link href="/about#privacy" className="text-sm transition-colors" style={{ color: '#5C6B62' }}>
                  Privacy
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3"
          style={{ borderTop: '1px solid #E9E0CE' }}
        >
          <p className="text-xs" style={{ color: '#5C6B62' }}>
            &copy; {new Date().getFullYear()} I&apos;MU. All rights reserved.
          </p>
          <p className="text-xs flex items-center gap-1" style={{ color: '#5C6B62' }}>
            Made with <Heart size={12} style={{ color: '#52B788' }} fill="#52B788" />
          </p>
        </div>
      </div>
    </footer>
  );
}
