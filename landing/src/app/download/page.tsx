import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Download — I'MU",
  description: "Download I'MU for Android. Free, fast, and private.",
};

export default function Download() {
  return (
    <>
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-8">
            <span className="text-black font-black text-3xl">I&apos;M</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Get I&apos;MU
          </h1>
          <p className="text-imu-muted text-lg mb-10 max-w-md mx-auto">
            Free. No ads. No tracking. Just an AI that actually helps.
          </p>

          {/* Download Card */}
          <div className="bg-imu-card border border-imu-border rounded-2xl p-8 md:p-12 mb-8">
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-lg">Android APK</p>
                  <p className="text-imu-muted text-sm">Android 7.0+ &middot; ~25MB</p>
                </div>
              </div>

              <a
                href="https://github.com/your-repo/imu/releases/latest/download/imu.apk"
                className="w-full max-w-sm bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-200 transition-colors inline-block"
              >
                Download Latest
              </a>

              <p className="text-imu-muted text-xs">
                Current version: <span className="text-white">1.0.1</span> &middot; Updated September 2026
              </p>
            </div>
          </div>

          {/* Install Instructions */}
          <div className="bg-imu-card border border-imu-border rounded-2xl p-8 text-left">
            <h2 className="text-white font-bold text-lg mb-4">How to install</h2>
            <ol className="space-y-3">
              {[
                'Download the APK file using the button above.',
                'Open the file. If prompted, enable "Install from unknown sources" in Settings.',
                'Tap Install and wait a few seconds.',
                'Open I\'MU and start chatting.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-white bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-white/80 text-sm leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Auto-update note */}
          <div className="mt-8 bg-imu-card border border-imu-border rounded-2xl p-6">
            <p className="text-imu-muted text-sm">
              💡 <span className="text-white font-medium">Auto-updates:</span> I&apos;MU checks for new versions on launch.
              When an update is available, it downloads in the background and installs automatically — no extra steps needed.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
