import type { Metadata } from 'next';
import { Cairo, Poppins } from 'next/font/google';
import './globals.css';

const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Neyome Admin',
  description: 'Neyome administration dashboard',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${poppins.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
