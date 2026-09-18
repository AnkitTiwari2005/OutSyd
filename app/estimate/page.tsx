import { Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { EstimateFormShell } from './_components/EstimateFormShell';

export const metadata = {
  title: 'Calculate Construction Estimate — OUTSYD',
  description: 'Precision 18-category construction cost estimate across 160+ Indian cities.',
};

export default function EstimatePage() {
  return (
    <main className="min-h-screen bg-[#F7F8FA] text-[#0F172A]">
      <Navbar />

      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Suspense fallback={<div className="card-standard bg-white border border-[#E2E8F0] p-12 text-center text-sm text-[#64748B]">Loading estimator wizard...</div>}>
          <EstimateFormShell />
        </Suspense>
      </div>
    </main>
  );
}
