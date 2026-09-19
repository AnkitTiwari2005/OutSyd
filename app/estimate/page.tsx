import { Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { EstimateFormShell } from './_components/EstimateFormShell';

export const metadata = {
  title: 'Calculate Construction Estimate — OUTSYD',
  description: 'Precision 18-category construction cost estimate across 160+ Indian cities.',
};

export default function EstimatePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">
      <Navbar />

      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Suspense fallback={<div className="card-standard bg-[var(--bg-card)] border border-[var(--border-color)] p-12 text-center text-sm text-[var(--text-muted)]">Loading estimator wizard...</div>}>
          <EstimateFormShell />
        </Suspense>
      </div>
    </main>
  );
}
