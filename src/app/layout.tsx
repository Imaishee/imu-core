import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#7C3AED',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "I'M U CORE — Gamified Study Platform",
    template: "%s | I'M U CORE",
  },
  description: 'Duolingo-inspired gamified study platform for B.A. Geography Honours and competitive exams. Learn with flashcards, quizzes, boss battles, and more.',
  keywords: ['study app', 'geography', 'honours', 'competitive exams', 'gamified learning', 'flashcards', 'quiz'],
  authors: [{ name: "I'M U" }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://imu-core.vercel.app',
    siteName: "I'M U CORE",
    title: "I'M U CORE — Gamified Study Platform",
    description: 'Duolingo-inspired gamified study platform for B.A. Geography Honours and competitive exams.',
  },
  twitter: {
    card: 'summary_large_image',
    title: "I'M U CORE — Gamified Study Platform",
    description: 'Duolingo-inspired gamified study platform for B.A. Geography Honours and competitive exams.',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "I'M U",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-warm-bg antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); }); }`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
