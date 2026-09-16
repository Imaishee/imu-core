import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#7C3AED',
};

export const metadata: Metadata = {
  title: "I'M U CORE — Study Platform",
  description: 'Gamified study platform for B.A. Geography Honours and competitive exams',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-warm-bg antialiased">{children}</body>
    </html>
  );
}
