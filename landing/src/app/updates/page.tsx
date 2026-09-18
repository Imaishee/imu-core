import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Updates — I'MU",
  description: "See what's new in I'MU. Release notes and changelog.",
};

const releases = [
  {
    version: '1.0.1',
    date: 'September 2026',
    type: 'patch' as const,
    changes: [
      'Fixed verification polling — now uses fresh server data instead of cached state',
      'Fixed password reset — properly shows errors instead of silently failing',
      'Fixed alarm toggle — schedules notifications with correct enabled/disabled state',
      'Fixed Pomodoro timer — survives background and app kill with persistent state',
      'Fixed dark mode — toggle now persists correctly across all screens',
      'Background APK downloads with notification progress',
      'Added pagination to local message storage for faster chat loading',
    ],
  },
  {
    version: '1.0.0',
    date: 'August 2026',
    type: 'major' as const,
    changes: [
      'Initial release of I\'MU',
      'AI-powered chat with streaming responses',
      'Voice input and output',
      'Timetable management with smart reminders',
      'Pomodoro timer with background persistence',
      'Dark mode support',
      'Cloud sync across devices',
      'Artifact generation (code, documents, summaries)',
    ],
  },
];

export default function Updates() {
  return (
    <>
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">What&apos;s new</h1>
            <p className="text-imu-muted text-lg">
              Every update, every fix, every improvement. Transparently.
            </p>
          </div>

          <div className="space-y-8">
            {releases.map((r, i) => (
              <div key={i} className="bg-imu-card border border-imu-border rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold">
                    v{r.version}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.type === 'major'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {r.type === 'major' ? 'Major Release' : 'Bug Fixes'}
                  </span>
                  <span className="text-imu-muted text-sm">{r.date}</span>
                </div>

                <ul className="space-y-3">
                  {r.changes.map((c, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-white/80 text-sm leading-relaxed">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
