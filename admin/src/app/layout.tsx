import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "I'MU Admin Panel",
  description: 'Manage users, notifications, and AI settings',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
