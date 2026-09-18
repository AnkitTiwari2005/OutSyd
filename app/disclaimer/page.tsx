import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer — OUTSYD',
};

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b border-slate-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/"><Image src="/outsyd-logo.png" alt="OUTSYD" width={100} height={28} className="h-7 w-auto" /></Link>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle size={28} className="text-amber-500" />
          <h1 className="text-3xl font-bold" style={{ color: '#1e2d4e' }}>Disclaimer</h1>
        </div>
        <div className="card p-6 border-amber-200 bg-amber-50 mb-8">
          <p className="text-sm text-amber-900 leading-relaxed font-medium">
            This estimate is for planning purposes only (accuracy band as stated). It is NOT a substitute for a detailed Bill of Quantities prepared by a licensed structural engineer. OUTSYD does not guarantee construction outcomes. Engage qualified professionals before committing to construction.
          </p>
        </div>
        <div className="prose prose-sm prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#1e2d4e' }}>Estimate Accuracy</h2>
            <p className="text-slate-600 leading-relaxed">OUTSYD estimates carry an explicitly stated accuracy band (±5% to ±20%) depending on the completeness of input data. These bands are derived from statistical analysis of coefficient validation against real-world project data.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#1e2d4e' }}>Data Sources</h2>
            <p className="text-slate-600 leading-relaxed">Coefficients are calibrated against CPWD DSR 2024 (Central Public Works Department Delhi Schedule of Rates). Regional rate indexes are sourced from market surveys across 43 Indian cities as of September 2026. Seismic zone classifications follow IS 1893:2016.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#1e2d4e' }}>Not Professional Advice</h2>
            <p className="text-slate-600 leading-relaxed">OUTSYD is a parametric estimation tool. It does not replace site investigation, structural design, geotechnical assessment, or any other professional engineering service. All construction projects must be designed and supervised by licensed engineers and architects as required by local building codes.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#1e2d4e' }}>Rate Fluctuations</h2>
            <p className="text-slate-600 leading-relaxed">Material rates fluctuate with market conditions, supply chain disruptions, and seasonal demand. OUTSYD rates represent a point-in-time snapshot and may not reflect current market prices at the time of actual procurement.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
