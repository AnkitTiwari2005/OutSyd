import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — OUTSYD',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">
      <header className="h-16 bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <Link href="/">
            <Logo width={105} height={28} className="h-7 w-auto" priority />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">Privacy Policy</h1>
        <p className="text-sm text-[var(--text-muted)] mb-8">Last updated: September 2026</p>
        <div className="space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed">
          <section className="card-standard bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-xl">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Information We Collect</h2>
            <p>OUTSYD collects building dimensions, location (city/region), and optional account information (email, name) when you create an account. We do not collect personal financial information, payment details, or sensitive personal data.</p>
          </section>
          <section className="card-standard bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-xl">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">How We Use Your Data</h2>
            <p>Building input data is used solely to generate construction cost estimates. Location data determines the regional rate index. Account data enables saving estimates to your dashboard.</p>
          </section>
          <section className="card-standard bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-xl">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Data Retention</h2>
            <p>Guest estimates are retained for 30 days. Registered user data is retained until account deletion. We do not sell or share your data with third parties.</p>
          </section>
          <section className="card-standard bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-xl">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Contact</h2>
            <p>For privacy-related inquiries, contact the creator: Ankit Kumar Tiwari.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
