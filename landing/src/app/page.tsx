'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  MessageCircle,
  BookOpen,
  Target,
  ShieldCheck,
  Download,
  ArrowRight,
  Sparkles,
  Zap,
  Users,
  Star,
  Clock,
  Globe,
  Lock,
  Code,
  FileText,
  Search,
} from 'lucide-react';
import Logo from '@/components/Logo';

const ParticleHero = dynamic(() => import('@/components/ParticleHero'), {
  ssr: false,
  loading: () => null,
});

const rotatingWords = [
  'learns how you think',
  'remembers everything',
  'never judges you',
  'actually listens',
  'speaks your language',
  'saves you hours',
];

const features = [
  {
    icon: MessageCircle,
    title: 'Natural Conversation',
    desc: 'Talk to I\'MU like a friend. It understands context, remembers your preferences, and responds naturally.',
  },
  {
    icon: BookOpen,
    title: 'Study Smarter',
    desc: 'Summarize notes, generate practice questions, and explain complex topics in simple language.',
  },
  {
    icon: Target,
    title: 'Actually Useful',
    desc: 'Not another gimmick. I\'MU is designed to be genuinely helpful — scheduling, reminders, quick answers.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by Default',
    desc: 'Your conversations stay yours. No data selling, no tracking, no nonsense.',
  },
  {
    icon: Code,
    title: 'Code & Build',
    desc: 'Generate, explain, and debug code in any language. From Python scripts to full Flutter apps.',
  },
  {
    icon: Search,
    title: 'Deep Research',
    desc: 'Dive into complex topics. I\'MU breaks down concepts, finds sources, and presents clear findings.',
  },
];

const stats = [
  { icon: Users, value: '1,000+', label: 'Active Users' },
  { icon: MessageCircle, value: '50K+', label: 'Conversations' },
  { icon: Star, value: '4.8', label: 'User Rating' },
  { icon: Clock, value: '<2s', label: 'Avg Response' },
];

/* ═══════════════════════════════════════════════
   CONVERSATION DEMO DATA
   Multi-turn conversations that cycle automatically
═══════════════════════════════════════════════ */
const conversations = [
  {
    messages: [
      { role: 'user', text: 'Hey I\'MU, summarize my notes on photosynthesis' },
      {
        role: 'ai',
        text: 'Photosynthesis converts light energy into chemical energy. Two main stages:\n\n1. **Light reactions** — Thylakoid membranes, splits water, produces ATP + NADPH\n2. **Calvin Cycle** — Stroma, uses ATP/NADPH to fix CO₂ into glucose\n\nWant me to make flashcards from this?',
      },
    ],
  },
  {
    messages: [
      { role: 'user', text: 'Write me a Python script to scrape product prices' },
      {
        role: 'ai',
        text: 'Here\'s a clean scraper using requests + BeautifulSoup:\n\n```python\nimport requests\nfrom bs4 import BeautifulSoup\n\ndef scrape_prices(url):\n    soup = BeautifulSoup(requests.get(url).text, \'html.parser\')\n    return [el.text.strip() for el in soup.select(\'.price\')]\n```\n\nWorks with most sites. Want me to add CSV export?',
      },
    ],
  },
  {
    messages: [
      { role: 'user', text: 'Explain quantum computing like I\'m 10' },
      {
        role: 'ai',
        text: 'Imagine a regular computer is like a light switch — it\'s either ON or OFF.\n\nA quantum computer is like a spinning coin — it can be heads AND tails at the same time until you catch it.\n\nThis means it can try millions of possibilities simultaneously, making it crazy fast for certain problems!',
      },
    ],
  },
  {
    messages: [
      { role: 'user', text: 'What should I cook tonight? I have eggs, rice, and veggies' },
      {
        role: 'ai',
        text: 'How about egg fried rice? Super quick:\n\n1. Cook rice, let it cool\n2. Scramble 3 eggs, set aside\n3. Stir-fry veggies (2 min)\n4. Toss in rice + eggs, soy sauce, done!\n\n**Pro tip:** Day-old rice works best. Takes about 10 minutes total.',
      },
    ],
  },
];

const useCases = [
  {
    icon: Globe,
    title: 'For Students',
    desc: 'Summarize lectures, explain formulas, generate practice questions, and help with assignments — all in natural language.',
  },
  {
    icon: Code,
    title: 'For Developers',
    desc: 'Debug code, learn new frameworks, generate boilerplates, and get architecture advice without leaving your workflow.',
  },
  {
    icon: FileText,
    title: 'For Professionals',
    desc: 'Draft emails, summarize reports, schedule meetings, and brainstorm ideas. Your AI assistant that actually saves time.',
  },
  {
    icon: Lock,
    title: 'For Everyone',
    desc: 'Ask anything. From cooking recipes to career advice. I\'MU adapts to your level and speaking style.',
  },
];

export default function Home() {
  const [rotateIndex, setRotateIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  /* Chat demo state */
  const [convIndex, setConvIndex] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [visibleText, setVisibleText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const currentConv = conversations[convIndex];

  /* Scroll tracking */
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Rotating text */
  useEffect(() => {
    const interval = setInterval(() => {
      setRotateIndex((p) => (p + 1) % rotatingWords.length);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  /* ── Chat typewriter effect ── */
  const typeText = useCallback(
    (text: string, cb: () => void) => {
      setIsTyping(true);
      setVisibleText('');
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setVisibleText(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setIsTyping(false);
          cb();
        }
      }, 12); // fast typing
    },
    []
  );

  useEffect(() => {
    const msg = currentConv.messages[msgIndex];
    if (!msg) {
      // conversation done — pause then start next
      const t = setTimeout(() => {
        setConvIndex((p) => (p + 1) % conversations.length);
        setMsgIndex(0);
        setVisibleText('');
        setShowTyping(false);
      }, 4000);
      return () => clearTimeout(t);
    }

    if (msg.role === 'user') {
      // Show user message instantly, then show typing after delay
      setVisibleText(msg.text);
      setShowTyping(false);
      const t = setTimeout(() => {
        setMsgIndex((p) => p + 1);
        setShowTyping(true);
      }, 1200);
      return () => clearTimeout(t);
    }

    if (msg.role === 'ai') {
      setShowTyping(false);
      typeText(msg.text, () => {
        const t = setTimeout(() => {
          setMsgIndex((p) => p + 1);
        }, 3500);
        return () => clearTimeout(t);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convIndex, msgIndex, typeText]);

  return (
    <div className="min-h-screen relative">
      {/* ═══════════════════════════════════════════
          HERO — 3D Particle Scene + Text Overlay
      ═══════════════════════════════════════════ */}
      <section className="relative h-[100vh] min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* 3D Background */}
        <ParticleHero scrollY={scrollY} />

        {/* Gradient overlay for text readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(251,246,236,0.3) 0%, rgba(251,246,236,0.6) 40%, rgba(251,246,236,0.92) 80%, rgba(251,246,236,1) 100%)',
            zIndex: 1,
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto" style={{ marginTop: '-4vh' }}>
          <div className="animate-fade-in-up">
            <h1 className="text-7xl md:text-9xl font-black mb-6 tracking-tight">
              <span className="gradient-text">I&apos;MU</span>
            </h1>
          </div>

          {/* Rotating subtitle */}
          <div className="h-12 mb-4 animate-fade-in-up delay-1 relative overflow-hidden">
            <p
              key={rotateIndex}
              className="rotate-text-item text-2xl md:text-3xl font-bold"
              style={{ color: '#1B4332' }}
            >
              An AI that {rotatingWords[rotateIndex]}
            </p>
          </div>

          <p
            className="text-lg md:text-xl mb-12 max-w-2xl mx-auto animate-fade-in-up delay-2 leading-relaxed"
            style={{ color: '#5C6B62' }}
          >
            Not a study buddy. Not a productivity app. Just an AI that listens,
            learns, and actually helps — without the corporate cringe.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-3">
            <Link
              href="/download"
              className="px-8 py-4 rounded-full font-semibold text-lg text-white transition-all cute-press inline-flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #2D6A4F, #40916C)',
                boxShadow: '0 4px 24px rgba(45, 106, 79, 0.35)',
              }}
            >
              <Download size={20} />
              Download for Android
            </Link>
            <Link
              href="/features"
              className="glass-card px-8 py-4 font-semibold text-lg transition-all cute-press inline-flex items-center gap-2"
              style={{ color: '#2D6A4F' }}
            >
              See What It Does
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce"
          style={{ color: '#9DB3A6' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SOCIAL PROOF — Stats Bar
      ═══════════════════════════════════════════ */}
      <section className="py-16 px-6 relative z-10" style={{ borderTop: '1px solid #E9E0CE' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <s.icon size={22} className="mx-auto mb-2" style={{ color: '#2D6A4F' }} />
                <p className="text-3xl md:text-4xl font-black gradient-text">{s.value}</p>
                <p className="text-sm mt-1" style={{ color: '#5C6B62' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURES — What you actually get
      ═══════════════════════════════════════════ */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#1F2A24' }}>
              What you actually get
            </h2>
            <p className="text-lg max-w-md mx-auto" style={{ color: '#5C6B62' }}>
              No fluff. No filler. Just features that matter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="glass-card p-8 group">
                <div className="icon-circle mb-5 transition-transform group-hover:scale-110 duration-300">
                  <f.icon size={24} style={{ color: '#2D6A4F' }} strokeWidth={1.8} />
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: '#1F2A24' }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#5C6B62' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ANIMATED CHAT DEMO — Live Typing
      ═══════════════════════════════════════════ */}
      <section className="py-24 px-6 relative z-10" style={{ background: 'rgba(45, 106, 79, 0.03)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#1F2A24' }}>
              Watch it think
            </h2>
            <p className="text-lg max-w-md mx-auto" style={{ color: '#5C6B62' }}>
              Real conversations. Real responses. No fake screenshots.
            </p>
          </div>

          <div className="glass-card p-6 md:p-10 green-glow">
            {/* Message area */}
            <div className="space-y-4 min-h-[240px]">
              {currentConv.messages.slice(0, msgIndex).map((msg, i) => (
                <div key={`${convIndex}-${i}`} className="flex justify-end gap-3">
                  {msg.role === 'user' ? (
                    <div
                      className="rounded-2xl rounded-br-md px-5 py-3 max-w-[80%] text-white text-sm"
                      style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}
                    >
                      {msg.text}
                    </div>
                  ) : null}
                </div>
              ))}

              {/* Current message being typed */}
              {msgIndex < currentConv.messages.length && (
                <div className="flex justify-end gap-3">
                  {currentConv.messages[msgIndex].role === 'user' ? (
                    <div
                      className="rounded-2xl rounded-br-md px-5 py-3 max-w-[80%] text-white text-sm"
                      style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}
                    >
                      {currentConv.messages[msgIndex].text}
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 flex justify-start gap-3">
                        <Logo size={28} rounded="lg" className="mt-1 shrink-0" />
                        <div
                          className="rounded-2xl rounded-bl-md px-5 py-3 max-w-[80%]"
                          style={{
                            background: 'rgba(255, 255, 255, 0.8)',
                            border: '1px solid rgba(233, 224, 206, 0.6)',
                          }}
                        >
                          {showTyping && !visibleText ? (
                            /* Typing indicator */
                            <div className="flex gap-1.5 py-1">
                              <div className="w-2 h-2 rounded-full typing-dot" style={{ background: '#52B788', animationDelay: '0ms' }} />
                              <div className="w-2 h-2 rounded-full typing-dot" style={{ background: '#52B788', animationDelay: '200ms' }} />
                              <div className="w-2 h-2 rounded-full typing-dot" style={{ background: '#52B788', animationDelay: '400ms' }} />
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#1F2A24' }}>
                              {visibleText}
                              {isTyping && <span className="typing-cursor">|</span>}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Show typing indicator before AI response */}
              {showTyping && visibleText && msgIndex < currentConv.messages.length && currentConv.messages[msgIndex].role === 'ai' && (
                <div className="flex justify-start gap-3">
                  <Logo size={28} rounded="lg" className="shrink-0" />
                  <div
                    className="rounded-2xl rounded-bl-md px-4 py-3"
                    style={{
                      background: 'rgba(255, 255, 255, 0.5)',
                      border: '1px solid rgba(233, 224, 206, 0.4)',
                    }}
                  >
                    <div className="flex gap-1.5 py-1">
                      <div className="w-2 h-2 rounded-full typing-dot" style={{ background: '#52B788', animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full typing-dot" style={{ background: '#52B788', animationDelay: '200ms' }} />
                      <div className="w-2 h-2 rounded-full typing-dot" style={{ background: '#52B788', animationDelay: '400ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-xs mt-6" style={{ color: '#9DB3A6' }}>
              — live conversation demo —
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          USE CASES — Who is this for?
      ═══════════════════════════════════════════ */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#1F2A24' }}>
              Built for real people
            </h2>
            <p className="text-lg max-w-md mx-auto" style={{ color: '#5C6B62' }}>
              Whether you&apos;re studying, coding, or just need a hand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((uc, i) => (
              <div key={i} className="glass-card p-8 flex items-start gap-5 group">
                <div className="icon-circle shrink-0 transition-transform group-hover:scale-110 duration-300">
                  <uc.icon size={24} style={{ color: '#2D6A4F' }} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2" style={{ color: '#1F2A24' }}>
                    {uc.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#5C6B62' }}>
                    {uc.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS — 3 Steps
      ═══════════════════════════════════════════ */}
      <section className="py-24 px-6 relative z-10" style={{ background: 'rgba(45, 106, 79, 0.03)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#1F2A24' }}>
              Start in 30 seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Download',
                desc: 'Grab the APK from our download page. Under 22 MB.',
              },
              {
                step: '02',
                title: 'Open & Talk',
                desc: 'No sign-up wall. Open the app and start chatting. That simple.',
              },
              {
                step: '03',
                title: 'It Learns',
                desc: 'The more you talk, the better it gets. It remembers your style.',
              },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p
                  className="text-5xl font-black mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #2D6A4F, #52B788)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {s.step}
                </p>
                <h3 className="font-bold text-xl mb-2" style={{ color: '#1F2A24' }}>
                  {s.title}
                </h3>
                <p className="text-sm" style={{ color: '#5C6B62' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PRIVACY CALLOUT
      ═══════════════════════════════════════════ */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-10 md:p-14 flex flex-col md:flex-row items-center gap-10">
            <div className="shrink-0">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(45, 106, 79, 0.1), rgba(82, 183, 136, 0.08))',
                  border: '1px solid rgba(45, 106, 79, 0.12)',
                }}
              >
                <Lock size={32} style={{ color: '#2D6A4F' }} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: '#1F2A24' }}>
                Your data stays yours
              </h2>
              <p className="text-base leading-relaxed" style={{ color: '#5C6B62' }}>
                Conversations are encrypted end-to-end. We don&apos;t read them, sell them, or use
                them to train models. No analytics that follow you around. No ads. No nonsense.
                Delete everything anytime from the app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════ */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card p-12 md:p-16 green-glow">
            <Logo size={64} rounded="2xl" className="mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#1F2A24' }}>
              Ready to try something different?
            </h2>
            <p className="text-lg mb-10 max-w-md mx-auto" style={{ color: '#5C6B62' }}>
              Free to use. No ads. No BS. Just download and start talking.
            </p>
            <Link
              href="/download"
              className="inline-block px-10 py-4 rounded-full font-semibold text-lg text-white transition-all cute-press"
              style={{
                background: 'linear-gradient(135deg, #2D6A4F, #52B788)',
                boxShadow: '0 4px 20px rgba(45, 106, 79, 0.3)',
              }}
            >
              Get I&apos;MU
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
