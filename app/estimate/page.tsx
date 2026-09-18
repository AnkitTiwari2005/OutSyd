// app/estimate/page.tsx — Estimator Page
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
        {/* Estimator Shell */}
        <EstimateFormShell />
      </div>
    </main>
  );
}
