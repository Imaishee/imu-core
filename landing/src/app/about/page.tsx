import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About — I'MU",
  description: "Who made I'MU, why it exists, and what it stands for.",
};

export default function About() {
  return (
    <>
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">About I&apos;MU</h1>

          {/* The Story */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-4">Why this exists</h2>
            <div className="space-y-4 text-white/80 leading-relaxed">
              <p>
                Most AI apps try to be everything at once. They add features nobody asked for,
                bury you in notifications, and sell your data to advertisers.
              </p>
              <p>
                I&apos;MU started from a simple frustration: <em className="text-white">why can&apos;t an AI just be useful without being annoying?</em>
              </p>
              <p>
                So we built one. I&apos;MU is a straightforward AI assistant that talks naturally,
                helps with real tasks, and respects your privacy. No fluff, no gimmicks, no corporate speak.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6">What we believe</h2>
            <div className="space-y-4">
              {[
                {
                  title: 'Simple beats complicated',
                  desc: 'If a feature doesn\'t help you, it shouldn\'t exist. Every part of I\'MU is designed to be immediately useful.',
                },
                {
                  title: 'Privacy is non-negotiable',
                  desc: 'Your conversations are yours. We don\'t read them, sell them, or use them to train models. Your data stays on your device.',
                },
                {
                  title: 'Honest by default',
                  desc: 'I\'MU says "I don\'t know" when it doesn\'t know. No hallucinated facts, no confident wrong answers, no bullsh*t.',
                },
                {
                  title: 'Made with care',
                  desc: 'Every bug gets fixed, every feature gets thought through, and every interaction gets polished. We don\'t ship half-baked work.',
                },
              ].map((v, i) => (
                <div key={i} className="bg-imu-card border border-imu-border rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-2">{v.title}</h3>
                  <p className="text-imu-muted text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tech */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-4">Built with</h2>
            <div className="flex flex-wrap gap-3">
              {['Flutter', 'Dart', 'Supabase', 'OpenAI', 'Groq', 'Firebase', 'PostgreSQL'].map((t, i) => (
                <span key={i} className="bg-imu-card border border-imu-border px-4 py-2 rounded-full text-white/80 text-sm">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Privacy Section */}
          <div id="privacy" className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-4">Privacy</h2>
            <div className="space-y-4 text-white/80 leading-relaxed text-sm">
              <p>
                I&apos;MU collects the minimum data required to function. Conversations are encrypted in transit
                and at rest. We never sell, share, or monetize your personal data.
              </p>
              <p>
                Analytics are anonymous and aggregated. We use them solely to improve app stability —
                not to build advertising profiles.
              </p>
              <p>
                You can delete all your data at any time from the app settings. No questions asked.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-imu-card border border-imu-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-3">Get in touch</h2>
            <p className="text-imu-muted text-sm mb-4">
              Have a question, suggestion, or just want to say hi?
            </p>
            <a
              href="mailto:hello@imu.app"
              className="inline-block bg-white text-black px-6 py-3 rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              hello@imu.app
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
