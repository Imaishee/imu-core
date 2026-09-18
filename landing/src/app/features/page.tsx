'use client';

import {
  MessageCircle,
  Brain,
  Palette,
  Calendar,
  Mic,
  ShieldCheck,
  Cpu,
  Cloud,
  Database,
} from 'lucide-react';

const features = [
  {
    icon: MessageCircle,
    title: 'Smart Conversations',
    desc: 'I\'MU uses advanced language models to understand context, follow multi-turn conversations, and give genuinely useful responses. Not template answers — real understanding.',
    details: ['Context-aware responses', 'Multi-turn memory', 'Natural language understanding'],
  },
  {
    icon: Brain,
    title: 'Deep Research Mode',
    desc: 'Need to understand a complex topic? I\'MU can dive deep, break down concepts, find sources, and present findings in a clear, digestible format.',
    details: ['Source-backed answers', 'Concept breakdowns', 'Visual summaries'],
  },
  {
    icon: Palette,
    title: 'Artifact Generation',
    desc: 'From code snippets to formatted documents, I\'MU creates rich artifacts right in your chat. View, copy, or download them instantly.',
    details: ['Code generation', 'Document creation', 'Visual outputs'],
  },
  {
    icon: Calendar,
    title: 'Schedule & Reminders',
    desc: 'Talk naturally about your schedule. I\'MU understands time references, sets reminders, and keeps you on track without you lifting a finger.',
    details: ['Natural language scheduling', 'Smart reminders', 'Timetable management'],
  },
  {
    icon: Mic,
    title: 'Voice Interaction',
    desc: 'Speak instead of type. I\'MU listens and responds with natural voice output. Perfect for when your hands are busy.',
    details: ['Speech-to-text input', 'Text-to-speech output', 'Hands-free mode'],
  },
  {
    icon: ShieldCheck,
    title: 'Privacy First',
    desc: 'Your data stays on your device. Conversations are encrypted. No tracking, no ads, no data selling. This is how AI should work.',
    details: ['Local-first storage', 'Encrypted sync', 'Zero tracking'],
  },
];

const specs = [
  { icon: Cpu, label: 'AI Models', value: 'OpenAI + Groq', desc: 'Fast, accurate, multimodal' },
  { icon: Cloud, label: 'Sync', value: 'Real-time', desc: 'Cloud sync with local fallback' },
  { icon: Database, label: 'Storage', value: 'Encrypted', desc: 'Your data, your device' },
];

export default function Features() {
  return (
    <>
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#1F2A24' }}>
              Built different
            </h1>
            <p className="text-lg max-w-md mx-auto" style={{ color: '#5C6B62' }}>
              Every feature exists because it&apos;s actually useful. No bloat, no gimmicks.
            </p>
          </div>

          <div className="space-y-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="glass-card p-8 md:p-10"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="icon-circle shrink-0">
                    <f.icon size={24} style={{ color: '#2D6A4F' }} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-3" style={{ color: '#1F2A24' }}>
                      {f.title}
                    </h3>
                    <p className="text-base leading-relaxed mb-4" style={{ color: '#5C6B62' }}>
                      {f.desc}
                    </p>
                    <ul className="flex flex-wrap gap-3">
                      {f.details.map((d, j) => (
                        <li
                          key={j}
                          className="text-xs font-medium px-3 py-1.5 rounded-full"
                          style={{
                            color: '#2D6A4F',
                            background: 'rgba(45, 106, 79, 0.08)',
                            border: '1px solid rgba(45, 106, 79, 0.12)',
                          }}
                        >
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
      <section className="py-20 px-6" style={{ borderTop: '1px solid #E9E0CE' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: '#1F2A24' }}>
            Under the hood
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {specs.map((s, i) => (
              <div key={i} className="glass-card p-6 text-center">
                <s.icon size={24} className="mx-auto mb-3" style={{ color: '#2D6A4F' }} />
                <p className="text-sm mb-1" style={{ color: '#5C6B62' }}>
                  {s.label}
                </p>
                <p className="font-bold text-2xl" style={{ color: '#1F2A24' }}>
                  {s.value}
                </p>
                <p className="text-xs mt-1" style={{ color: '#5C6B62' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
