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
  Users,
  Heart,
  MapPin,
  Bell,
} from 'lucide-react';

const features = [
  {
    icon: Heart,
    title: 'IMU Heart Model',
    desc: 'Our custom fine-tuned model trained on real Banglish/Hinglish conversations. Not generic AI — an AI that speaks your language, knows your culture, and feels real.',
    details: ['Fine-tuned transformer model', 'Banglish/Hinglish native', 'Dataset-grounded responses', 'Two-layer architecture (IMU Heart → Groq polish)'],
  },
  {
    icon: Users,
    title: 'Friends Chat',
    desc: 'Connect with classmates and friends. Real-time one-on-one messaging with read receipts. Find users by name or email and send friend requests.',
    details: ['Real-time Supabase messaging', 'Read receipts (✓/✓✓)', 'Friend request system', 'Online presence indicators'],
  },
  {
    icon: ShieldCheck,
    title: 'Privacy Controls',
    desc: 'Full control over your visibility. Hide from search, block friend requests, or stay completely invisible. Your profile, your rules.',
    details: ['Visible/invisible toggle', 'Block friend requests', 'No data selling', 'Delete anytime'],
  },
  {
    icon: MessageCircle,
    title: 'Smart Conversations',
    desc: 'I\'MU uses advanced language models to understand context, follow multi-turn conversations, and give genuinely useful responses.',
    details: ['Context-aware responses', 'Multi-turn memory', 'Natural language understanding', 'IMU Heart seed responses'],
  },
  {
    icon: Calendar,
    title: 'Schedule & Reminders',
    desc: 'AI-powered timetable management. Talk naturally about your schedule — I\'MU understands time references and keeps you on track.',
    details: ['Natural language scheduling', 'Smart reminders', 'Timetable management', 'Class notifications'],
  },
  {
    icon: Bell,
    title: 'Proactive Check-ins',
    desc: 'Your companion reaches out 4 times a day — morning, afternoon, evening, and night. Real friends don\'t wait to be asked how you are.',
    details: ['4 daily check-ins', 'Gender-aware messages', 'Push notifications', 'Respects your visibility settings'],
  },
  {
    icon: MapPin,
    title: 'Location Sharing',
    desc: 'Optional location sharing helps find nearby classmates. Updates every 15 minutes. You can disable it anytime.',
    details: ['Periodic background updates', 'Find nearby friends', 'Privacy-first design', 'Manual refresh option'],
  },
  {
    icon: Mic,
    title: 'Voice & Vision',
    desc: 'Speak instead of type, or snap a photo of your notes. I\'MU parses images, understands speech, and responds naturally.',
    details: ['Speech-to-text input', 'Image parsing (timetable)', 'Hands-free mode', 'Quick capture'],
  },
  {
    icon: Brain,
    title: 'Deep Research Mode',
    desc: 'Need to understand a complex topic? I\'MU dives deep, breaks down concepts, and presents findings clearly.',
    details: ['Source-backed answers', 'Concept breakdowns', 'Visual summaries', 'Multi-model routing'],
  },
];

const specs = [
  { icon: Cpu, label: 'AI Models', value: 'IMU Heart + Groq', desc: 'Fine-tuned + polished responses' },
  { icon: Cloud, label: 'Sync', value: 'Real-time', desc: 'Cloud sync with Supabase Realtime' },
  { icon: Database, label: 'Storage', value: 'Encrypted', desc: 'Your data, your device, your rules' },
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
