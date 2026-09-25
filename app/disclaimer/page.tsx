import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AlertTriangle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer — OUTSYD',
};

export default function DisclaimerPage() {
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
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle size={28} className="text-amber-500" />
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Disclaimer</h1>
        </div>

        <div className="card-standard p-6 border-amber-500/30 bg-amber-500/10 mb-8 rounded-xl">
          <p className="text-sm text-amber-600 dark:text-amber-300 leading-relaxed font-medium">
            This estimate is for planning purposes only (accuracy band as stated). It is NOT a substitute for a detailed Bill of Quantities prepared by a licensed structural engineer. OUTSYD does not guarantee construction outcomes. Engage qualified professionals before committing to construction.
          </p>
        </div>

        <div className="space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed">
          <section className="card-standard bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-xl">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Estimate Accuracy</h2>
            <p>OUTSYD estimates carry an explicitly stated accuracy band (±5% to ±20%) depending on the completeness of input data. These bands are derived from statistical analysis of coefficient validation against real-world project data.</p>
          </section>
          <section className="card-standard bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-xl">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Data Sources</h2>
            <p>Coefficients are calibrated against CPWD DSR 2024 (Central Public Works Department Delhi Schedule of Rates). Regional rate indexes are sourced from market surveys across 43 Indian cities as of September 2026. Seismic zone classifications follow IS 1893:2016.</p>
          </section>
          <section className="card-standard bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-xl">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Not Professional Advice</h2>
            <p>OUTSYD is a parametric estimation tool. It does not replace site investigation, structural design, geotechnical assessment, or any other professional engineering service. All construction projects must be designed and supervised by licensed engineers and architects as required by local building codes.</p>
          </section>
          <section className="card-standard bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-xl">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Rate Fluctuations</h2>
            <p>Material rates fluctuate with market conditions, supply chain disruptions, and seasonal demand. OUTSYD rates represent a point-in-time snapshot and may not reflect current market prices at the time of actual procurement.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
