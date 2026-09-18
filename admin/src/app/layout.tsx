import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "I'MU Admin — Mission Control",
  description: 'I\'MU system administration and monitoring',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#060607] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
