import Link from 'next/link';
import Logo from '@/components/Logo';

const features = [
  {
    icon: '💬',
    title: 'Natural Conversation',
    desc: 'Talk to I\'MU like a friend. It understands context, remembers your preferences, and responds naturally.',
  },
  {
    icon: '📚',
    title: 'Study Smarter',
    desc: 'Summarize notes, generate practice questions, and explain complex topics in simple language.',
  },
  {
    icon: '🎯',
    title: 'Actually Useful',
    desc: 'Not another gimmick. I\'MU is designed to be genuinely helpful — scheduling, reminders, quick answers.',
  },
  {
    icon: '🔒',
    title: 'Private by Default',
    desc: 'Your conversations stay yours. End-to-end encryption and no data selling. Ever.',
  },
];

export default function Home() {
  return (
    <div className="cute-pattern-bg min-h-screen relative">
      {/* Floating sparkles */}
      <div className="sparkle sparkle-1" />
      <div className="sparkle sparkle-2" />
      <div className="sparkle sparkle-3" />
      <div className="sparkle sparkle-4" />
      <div className="sparkle sparkle-5" />
      <div className="sparkle sparkle-6" />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="animate-fade-in-up">
            <div className="mx-auto mb-8 logo-bounce" style={{ boxShadow: '0 0 40px rgba(82, 183, 136, 0.25), 0 0 80px rgba(45, 106, 79, 0.12)', borderRadius: '1.25rem' }}>
              <Logo size={96} rounded="3xl" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-8xl font-black mb-6 animate-fade-in-up delay-1 tracking-tight">
            <span className="gradient-text">I&apos;MU</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-cream-muted mb-3 animate-fade-in-up delay-2 font-medium">
            Your AI. That&apos;s it.
          </p>

          <p className="text-base text-cream-muted/60 mb-12 max-w-lg mx-auto animate-fade-in-up delay-3 leading-relaxed">
            Not a study buddy. Not a productivity app. Just an AI that listens,
            learns, and actually helps — without the corporate cringe.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-4">
            <Link
              href="/download"
              className="px-8 py-4 rounded-full font-semibold text-base text-white transition-all cute-press"
              style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)', boxShadow: '0 4px 20px rgba(45, 106, 79, 0.3)' }}
            >
              Download for Android
            </Link>
            <Link
              href="/features"
              className="glass-card px-8 py-4 font-semibold text-base text-cream-text transition-all cute-press"
            >
              See What It Does →
            </Link>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-cream-text mb-4">
              What you actually get
            </h2>
            <p className="text-cream-muted text-lg max-w-md mx-auto">
              No fluff. No filler. Just features that matter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="glass-card p-8 group"
              >
                <span className="text-4xl mb-5 block transition-transform group-hover:scale-110 duration-300">{f.icon}</span>
                <h3 className="text-cream-text font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-cream-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chat Preview (cartoonish mockup) */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card p-8 md:p-12 green-glow">
            <div className="space-y-4">
              {/* User message bubble */}
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-br-md px-5 py-3 max-w-[80%]" style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>
                  <p className="text-white text-sm">Hey I&apos;MU, summarize my notes on photosynthesis 🌱</p>
                </div>
              </div>
              {/* AI response bubble */}
              <div className="flex justify-start gap-3">
                <Logo size={28} rounded="lg" className="mt-1 shrink-0" />
                <div className="glass-card rounded-2xl rounded-bl-md px-5 py-3 max-w-[80%]" style={{ background: 'rgba(22, 33, 28, 0.8)', border: '1px solid rgba(42, 59, 50, 0.5)' }}>
                  <p className="text-cream-text text-sm leading-relaxed">
                    Photosynthesis converts light energy → chemical energy. Two stages:<br/><br/>
                    <span className="text-green-light font-medium">1. Light reactions</span> — Thylakoid membranes, splits water, produces ATP + NADPH<br/><br/>
                    <span className="text-green-light font-medium">2. Calvin Cycle</span> — Stroma, uses ATP/NADPH to fix CO₂ into glucose<br/><br/>
                    <span className="text-cream-muted text-xs">✨ Want me to make flashcards from this?</span>
                  </p>
                </div>
              </div>
              {/* Typing indicator */}
              <div className="flex justify-start gap-3">
                <Logo size={28} rounded="lg" className="shrink-0" />
                <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3" style={{ background: 'rgba(22, 33, 28, 0.5)', border: '1px solid rgba(42, 59, 50, 0.3)' }}>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-light/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-green-light/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-green-light/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-cream-muted/40 text-xs mt-6">— actual I&apos;MU conversation —</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card p-12 md:p-16 green-glow">
            <Logo size={64} rounded="2xl" className="mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-cream-text mb-4">
              Ready to try something different?
            </h2>
            <p className="text-cream-muted text-lg mb-10 max-w-md mx-auto">
              Free to use. No ads. No BS. Just download and start talking.
            </p>
            <Link
              href="/download"
              className="inline-block px-10 py-4 rounded-full font-semibold text-lg text-white transition-all cute-press"
              style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)', boxShadow: '0 4px 20px rgba(45, 106, 79, 0.3)' }}
            >
              Get I&apos;MU 💚
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
