import Link from 'next/link';

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
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_60%)]" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="animate-fade-in-up">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-8 animate-float">
              <span className="text-black font-black text-2xl">I&apos;M</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 animate-fade-in-up animate-delay-100 tracking-tight">
            I&apos;MU
          </h1>

          <p className="text-xl md:text-2xl text-imu-muted mb-4 animate-fade-in-up animate-delay-200">
            Your AI. That&apos;s it.
          </p>

          <p className="text-base text-imu-muted/60 mb-10 max-w-lg mx-auto animate-fade-in-up animate-delay-300">
            Not a study buddy. Not a productivity app. Just an AI that listens,
            learns, and actually helps — without the corporate cringe.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animate-delay-300">
            <Link
              href="/download"
              className="bg-white text-black px-8 py-3.5 rounded-full font-semibold text-base hover:bg-gray-200 transition-colors"
            >
              Download for Android
            </Link>
            <Link
              href="/features"
              className="border border-imu-border text-white px-8 py-3.5 rounded-full font-semibold text-base hover:bg-white/5 transition-colors"
            >
              See What It Does
            </Link>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What you actually get</h2>
            <p className="text-imu-muted text-lg max-w-md mx-auto">
              No fluff. No filler. Just features that matter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-imu-card border border-imu-border rounded-2xl p-8 hover:border-white/10 transition-colors"
              >
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-imu-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center bg-imu-card border border-imu-border rounded-3xl p-12 md:p-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to try something different?
          </h2>
          <p className="text-imu-muted text-lg mb-8 max-w-md mx-auto">
            Free to use. No ads. No BS. Just download and start talking.
          </p>
          <Link
            href="/download"
            className="inline-block bg-white text-black px-10 py-4 rounded-full font-semibold text-lg hover:bg-gray-200 transition-colors"
          >
            Get I&apos;MU
          </Link>
        </div>
      </section>
    </>
  );
}
