import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-imu-border bg-imu-dark">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">I&apos;M</span>
              </div>
              <span className="font-bold text-white text-lg">I&apos;MU</span>
            </div>
            <p className="text-imu-muted text-sm max-w-xs">
              Your AI companion. Built with care.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Product</h4>
              <div className="flex flex-col gap-2">
                <Link href="/features" className="text-imu-muted text-sm hover:text-white transition-colors">Features</Link>
                <Link href="/download" className="text-imu-muted text-sm hover:text-white transition-colors">Download</Link>
                <Link href="/updates" className="text-imu-muted text-sm hover:text-white transition-colors">Updates</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">About</h4>
              <div className="flex flex-col gap-2">
                <Link href="/about" className="text-imu-muted text-sm hover:text-white transition-colors">About Us</Link>
                <Link href="/about#privacy" className="text-imu-muted text-sm hover:text-white transition-colors">Privacy</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-imu-border flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-imu-muted text-xs">&copy; {new Date().getFullYear()} I&apos;MU. All rights reserved.</p>
          <p className="text-imu-muted text-xs">Made with purpose.</p>
        </div>
      </div>
    </footer>
  );
}
