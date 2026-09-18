// app/layout.tsx — Root layout with logo favicon + Sonner
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title       : 'OUTSYD — Smart Construction Cost & BOQ Estimator',
  description : 'Outside User-focused Technology for Smart Yield-based Design Estimation. Category-wise material quantities & costs for any building in India.',
  keywords    : ['construction cost estimator', 'building material cost India', 'OUTSYD', 'BOQ estimator', 'CPWD DSR 2024'],
  icons: {
    icon  : '/outsyd-icon.png',
    apple : '/outsyd-icon.png',
  },
  openGraph: {
    title      : 'OUTSYD — Smart Construction Cost Estimator',
    description: 'Know your build cost before you break ground.',
    images     : ['/outsyd-logo.png'],
    type       : 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-white text-[#0F172A] min-h-screen">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
