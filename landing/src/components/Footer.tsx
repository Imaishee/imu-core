import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: 'rgba(42, 59, 50, 0.5)', backgroundColor: '#0E1512' }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Logo size={36} rounded="lg" />
              <span className="font-bold text-cream-text text-lg">I&apos;MU</span>
            </div>
            <p className="text-cream-muted text-sm max-w-xs">
              Your AI companion. Built with care.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <h4 className="text-cream-text font-semibold text-sm mb-3">Product</h4>
              <div className="flex flex-col gap-2">
                <Link href="/features" className="text-cream-muted text-sm hover:text-green-light transition-colors">Features</Link>
                <Link href="/download" className="text-cream-muted text-sm hover:text-green-light transition-colors">Download</Link>
                <Link href="/updates" className="text-cream-muted text-sm hover:text-green-light transition-colors">Updates</Link>
              </div>
            </div>
            <div>
              <h4 className="text-cream-text font-semibold text-sm mb-3">About</h4>
              <div className="flex flex-col gap-2">
                <Link href="/about" className="text-cream-muted text-sm hover:text-green-light transition-colors">About Us</Link>
                <Link href="/about#privacy" className="text-cream-muted text-sm hover:text-green-light transition-colors">Privacy</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3" style={{ borderTop: '1px solid rgba(42, 59, 50, 0.5)' }}>
          <p className="text-cream-muted text-xs">&copy; {new Date().getFullYear()} I&apos;MU. All rights reserved.</p>
          <p className="text-cream-muted text-xs">Made with 💚</p>
        </div>
      </div>
    </footer>
  );
}
