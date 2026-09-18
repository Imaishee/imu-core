import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://imaishee.vercel.app'),
  title: "I'MU — Your AI",
  description: "An AI that listens, learns, and adapts. Built for students who want smarter studying.",
  icons: {
    icon: '/icon.png',
  },
  openGraph: {
    title: "I'MU — Your AI",
    description: "An AI that listens, learns, and adapts.",
    images: ['/icon.png'],
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
