import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Features — I'MU",
  description: "Everything I'MU can do, and how it actually helps.",
};

const features = [
  {
    icon: '💬',
    title: 'Smart Conversations',
    desc: 'I\'MU uses advanced language models to understand context, follow multi-turn conversations, and give genuinely useful responses. Not template answers — real understanding.',
    details: ['Context-aware responses', 'Multi-turn memory', 'Natural language understanding'],
  },
  {
    icon: '🧠',
    title: 'Deep Research Mode',
    desc: 'Need to understand a complex topic? I\'MU can dive deep, break down concepts, find sources, and present findings in a clear, digestible format.',
    details: ['Source-backed answers', 'Concept breakdowns', 'Visual summaries'],
  },
  {
    icon: '🎨',
    title: 'Artifact Generation',
    desc: 'From code snippets to formatted documents, I\'MU creates rich artifacts right in your chat. View, copy, or download them instantly.',
    details: ['Code generation', 'Document creation', 'Visual outputs'],
  },
  {
    icon: '📅',
    title: 'Schedule & Reminders',
    desc: 'Talk naturally about your schedule. I\'MU understands time references, sets reminders, and keeps you on track without you lifting a finger.',
    details: ['Natural language scheduling', 'Smart reminders', 'Timetable management'],
  },
  {
    icon: '🎤',
    title: 'Voice Interaction',
    desc: 'Speak instead of type. I\'MU listens and responds with natural voice output. Perfect for when your hands are busy.',
    details: ['Speech-to-text input', 'Text-to-speech output', 'Hands-free mode'],
  },
  {
    icon: '🔒',
    title: 'Privacy First',
    desc: 'Your data stays on your device. Conversations are encrypted. No tracking, no ads, no data selling. This is how AI should work.',
    details: ['Local-first storage', 'Encrypted sync', 'Zero tracking'],
  },
];

export default function Features() {
  return (
    <>
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Built different
            </h1>
            <p className="text-imu-muted text-lg max-w-md mx-auto">
              Every feature exists because it&apos;s actually useful. No bloat, no gimmicks.
            </p>
          </div>

          <div className="space-y-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-imu-card border border-imu-border rounded-2xl p-8 md:p-10 hover:border-white/10 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <span className="text-4xl">{f.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-xl mb-3">{f.title}</h3>
                    <p className="text-imu-muted text-base leading-relaxed mb-4">{f.desc}</p>
                    <ul className="flex flex-wrap gap-3">
                      {f.details.map((d, j) => (
                        <li key={j} className="text-xs font-medium text-white bg-white/5 px-3 py-1.5 rounded-full">
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="py-20 px-6 border-t border-imu-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Under the hood</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'AI Models', value: 'OpenAI + Groq', desc: 'Fast, accurate, multimodal' },
              { label: 'Sync', value: 'Real-time', desc: 'Cloud sync with local fallback' },
              { label: 'Storage', value: 'Encrypted', desc: 'Your data, your device' },
            ].map((s, i) => (
              <div key={i} className="bg-imu-card border border-imu-border rounded-xl p-6 text-center">
                <p className="text-imu-muted text-sm mb-1">{s.label}</p>
                <p className="text-white font-bold text-2xl">{s.value}</p>
                <p className="text-imu-muted text-xs mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
