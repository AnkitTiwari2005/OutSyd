// app/layout.tsx — Root layout with logo favicon + Sonner
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Providers } from '@/components/Providers';
import { TopProgressBar } from '@/components/TopProgressBar';
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Flash-prevention script: sets data-theme on <html> before first paint */}
        {/* Note: next.config.ts uses Content-Security-Policy-Report-Only. If CSP is switched to enforcing, add nonce or hash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('outsyd-theme');if(s==='dark'||s==='light'){document.documentElement.setAttribute('data-theme',s)}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.setAttribute('data-theme','dark')}else{document.documentElement.setAttribute('data-theme','light')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen">
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
