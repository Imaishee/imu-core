'use client';

import {
  Lightbulb,
  ShieldCheck,
  Heart,
  Gem,
  Mail,
  ExternalLink,
} from 'lucide-react';

const values = [
  {
    icon: Lightbulb,
    title: 'Simple beats complicated',
    desc: 'If a feature doesn\'t help you, it shouldn\'t exist. Every part of I\'MU is designed to be immediately useful.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy is non-negotiable',
    desc: 'Your conversations are yours. We don\'t read them, sell them, or use them to train models. Your data stays on your device.',
  },
  {
    icon: Gem,
    title: 'Honest by default',
    desc: 'I\'MU says "I don\'t know" when it doesn\'t know. No hallucinated facts, no confident wrong answers, no bullsh*t.',
  },
  {
    icon: Heart,
    title: 'Made with care',
    desc: 'Every bug gets fixed, every feature gets thought through, and every interaction gets polished. We don\'t ship half-baked work.',
  },
];

const techStack = [
  'Flutter',
  'Dart',
  'Supabase',
  'OpenAI',
  'Groq',
  'Firebase',
  'PostgreSQL',
];

export default function About() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8" style={{ color: '#1F2A24' }}>
          About I&apos;MU
        </h1>

        {/* The Story */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#1F2A24' }}>
            Why this exists
          </h2>
          <div className="space-y-4 leading-relaxed" style={{ color: '#5C6B62' }}>
            <p>
              Most AI apps try to be everything at once. They add features nobody asked for,
              bury you in notifications, and sell your data to advertisers.
            </p>
            <p>
              I&apos;MU started from a simple frustration:{' '}
              <em style={{ color: '#1F2A24' }}>
                why can&apos;t an AI just be useful without being annoying?
              </em>
            </p>
            <p>
              So we built one. I&apos;MU is a straightforward AI assistant that talks naturally,
              helps with real tasks, and respects your privacy. No fluff, no gimmicks, no corporate speak.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#1F2A24' }}>
            What we believe
          </h2>
          <div className="space-y-4">
            {values.map((v, i) => (
              <div key={i} className="glass-card p-6">
                <div className="flex items-start gap-4">
                  <div className="icon-circle shrink-0">
                    <v.icon size={20} style={{ color: '#2D6A4F' }} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: '#1F2A24' }}>
                      {v.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#5C6B62' }}>
                      {v.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#1F2A24' }}>
            Built with
          </h2>
          <div className="flex flex-wrap gap-3">
            {techStack.map((t, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-full text-sm"
                style={{
                  color: '#2D6A4F',
                  background: 'rgba(45, 106, 79, 0.08)',
                  border: '1px solid rgba(45, 106, 79, 0.12)',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Privacy Section */}
        <div id="privacy" className="mb-16">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#1F2A24' }}>
            Privacy
          </h2>
          <div className="space-y-4 leading-relaxed text-sm" style={{ color: '#5C6B62' }}>
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
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#1F2A24' }}>
            Get in touch
          </h2>
          <p className="text-sm mb-4" style={{ color: '#5C6B62' }}>
            Have a question, suggestion, or just want to say hi?
          </p>
          <a
            href="mailto:hello@imu.app"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white transition-all cute-press"
            style={{
              background: 'linear-gradient(135deg, #2D6A4F, #40916C)',
              boxShadow: '0 4px 16px rgba(45, 106, 79, 0.2)',
            }}
          >
            <Mail size={16} />
            hello@imu.app
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </section>
  );
}
