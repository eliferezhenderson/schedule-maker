// app/layout.tsx
import './globals.css';
import './fonts.css';

import { EB_Garamond, Space_Mono } from 'next/font/google';

const caslon = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-caslon',
  display: 'swap',
});

const mono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400'],
  display: 'swap',
});

export const metadata = {
  title: 'Schedule Maker',
  description: 'Build quick, editable critique and meeting schedules.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${caslon.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-vwBg bg-grain text-vwRed font-caslon tracking-tight">
        {children}
      </body>
    </html>
  );
}
