import Link from 'next/link';
import { Logo } from '@/components/Logo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — OUTSYD',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b border-slate-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/"><Logo width={100} height={28} className="h-7 w-auto" /></Link>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#1e2d4e' }}>Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: September 2026</p>
        <div className="prose prose-sm prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#1e2d4e' }}>Information We Collect</h2>
            <p className="text-slate-600 leading-relaxed">OUTSYD collects building dimensions, location (city/region), and optional account information (email, name) when you create an account. We do not collect personal financial information, payment details, or sensitive personal data.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#1e2d4e' }}>How We Use Your Data</h2>
            <p className="text-slate-600 leading-relaxed">Building input data is used solely to generate construction cost estimates. Location data determines the regional rate index. Account data enables saving estimates to your dashboard.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#1e2d4e' }}>Data Retention</h2>
            <p className="text-slate-600 leading-relaxed">Guest estimates are retained for 30 days. Registered user data is retained until account deletion. We do not sell or share your data with third parties.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#1e2d4e' }}>Contact</h2>
            <p className="text-slate-600 leading-relaxed">For privacy-related inquiries, contact the creator: Ankit Kumar Tiwari.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
