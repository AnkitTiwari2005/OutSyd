// app/estimate/[id]/page.tsx
// Shareable, server-rendered estimate result page — works without Zustand store
// URL: /estimate/:id — accessible by anyone with the link
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { estimates, buildingInputs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { formatINR, formatINRFull, estimateTimeline, computeLabourBreakdown, computeAlternatives } from '@/lib/utils';
import { Gauge, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ShareResultClient } from './_components/ShareResultClient';
import { getCategoryColor, BAND_CONFIG, PHASE_COLORS } from '@/lib/constants';
import type { EstimateResult, CategoryTotal, EstimateLineItem } from '@/lib/engine/types';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [est]  = await db.select().from(estimates).where(eq(estimates.id, id)).limit(1);
  if (!est) return { title: 'Estimate Not Found — OUTSYD' };
  return {
    title      : `OUTSYD Estimate — ${formatINR(est.grandTotalMaterialCost ?? 0)} (${est.accuracyBand?.replace(/_/g,' ')})`,
    description: `Category-wise construction cost estimate. Total: ${formatINRFull(est.grandTotalMaterialCost ?? 0)} with ${est.accuracyBand?.replace(/_/g,' ')} accuracy.`,
  };
}

export default async function SharedEstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = await params;
  const [estimate] = await db.select().from(estimates).where(eq(estimates.id, id)).limit(1);
  if (!estimate) notFound();

  const result = (typeof estimate.resultJson === 'string'
    ? JSON.parse(estimate.resultJson)
    : estimate.resultJson) as unknown as EstimateResult;
  const [input] = await db.select().from(buildingInputs).where(eq(buildingInputs.id, estimate.buildingInputId)).limit(1);

  const band        = BAND_CONFIG[estimate.accuracyBand] ?? BAND_CONFIG['Preliminary_15_20'];
  const buaSqft     = result.derivedDimensions?.totalBuaSqft ?? 0;
  const costPerSqft = buaSqft > 0 ? Math.round((estimate.grandTotalMaterialCost ?? 0) / buaSqft) : 0;
  const labourRows  = computeLabourBreakdown(Math.max(0, (estimate.grandTotalWithLabor ?? 0) - (estimate.grandTotalMaterialCost ?? 0)));
  const timeline    = estimateTimeline(buaSqft, input?.numFloors ?? 1, input?.typology ?? 'Residential');
  const alternatives = computeAlternatives(estimate.grandTotalMaterialCost ?? 0, input?.qualityTier ?? 'Standard');

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <Link href="/">
            <Image src="/outsyd-logo.png" alt="OUTSYD" width={110} height={32} className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            {/* Client-side share + PDF buttons */}
            <ShareResultClient estimateId={id} grandTotal={estimate.grandTotalMaterialCost ?? 0} />
            <Link href="/estimate" className="btn-primary py-2 px-4 text-xs">+ New Estimate</Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        {/* Shared badge */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          Shared estimate · Read-only · Generated {new Date(estimate.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>

        {/* Accuracy band */}
        {(() => {
          const ICONS = { Gauge, Info, CheckCircle2 } as const;
          const BandIcon = ICONS[band.icon as keyof typeof ICONS] ?? Info;
          return (
            <div className={`rounded-2xl border-2 p-4 flex items-start gap-4 slide-up ${band.cls}`}>
              <div className={`mt-0.5 shrink-0 ${band.iconCls}`} aria-hidden>
                <BandIcon size={20} />
              </div>
              <div>
                <p className="font-bold text-base">{band.label}</p>
                <p className="text-sm opacity-75 mt-0.5">
                  Tier {estimate.classificationTier} · {estimate.buildingCategory?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Material Cost',      value: formatINR(estimate.grandTotalMaterialCost ?? 0) },
            { label: 'With Labour (+30%)', value: formatINR(estimate.grandTotalWithLabor ?? 0),    highlight: true },
            { label: 'Cost / sqft',        value: `₹${costPerSqft.toLocaleString('en-IN')}` },
            { label: 'Built-up Area',      value: `${buaSqft.toLocaleString('en-IN')} sqft` },
          ].map(({ label, value, highlight }) => (
            <div key={label} className={`card p-4 ${highlight ? 'border-orange-200 bg-orange-50' : ''}`}>
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className={`text-xl font-bold ${highlight ? 'text-orange-600' : 'text-slate-900'}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Input summary */}
        {input && (
          <div className="card p-5">
            <p className="section-title">Project Details</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2.5">
              {[
                ['Dimensions',        `${input.lengthFt}ft × ${input.breadthFt}ft × ${input.heightFt}ft`],
                ['Floors',            `${input.numFloors}`],
                ['Typology',          `${input.typology} — ${input.buildingUse}`],
                ['Location',          input.locationRegion],
                ['Soil Type',         input.soilType],
                ['Quality Tier',      input.qualityTier],
                ['Structural System', input.structuralSystem ?? 'Not specified'],
                ['Foundation',        input.foundationType  ?? 'Not specified'],
                ['Seismic Zone',      input.seismicZone     ?? 'Not specified'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-[11px] text-slate-500">{k}</p>
                  <p className="text-xs font-medium text-slate-700">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category breakdown */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm">Category-wise Breakdown</h2>
            <span className="text-xs text-slate-400">{result.categoryTotals?.length} categories</span>
          </div>
          <div className="divide-y divide-slate-50">
            {result.categoryTotals?.map((cat: CategoryTotal) => {
              const pct = (cat.subtotal / (estimate.grandTotalMaterialCost ?? 1) * 100);
              return (
                <div key={cat.categoryCode} className="px-5 py-3 flex items-center gap-4">
                  <div className="w-5 h-5 rounded-md shrink-0" style={{ background: getCategoryColor(cat.categoryCode) }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-600 truncate">{cat.categoryCode} — {cat.name}</span>
                      <span className="text-xs font-semibold text-slate-800 ml-2 whitespace-nowrap">{formatINR(cat.subtotal)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: getCategoryColor(cat.categoryCode) }} />
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 w-8 text-right">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex justify-between">
            <span className="font-semibold text-slate-700 text-sm">Grand Total (Materials)</span>
            <span className="font-bold text-orange-600">{formatINRFull(estimate.grandTotalMaterialCost ?? 0)}</span>
          </div>
        </div>

        {/* Labour breakdown */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Labour Breakdown (+30% = {formatINR((estimate.grandTotalMaterialCost ?? 0) * 0.30)})</h2>
          </div>
          <div className="p-5 grid sm:grid-cols-2 gap-2">
            {labourRows.map(r => (
              <div key={r.trade} className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-50 text-xs">
                <span className="text-slate-600">{r.trade}</span>
                <span className="font-semibold text-slate-800">{formatINR(r.amount)} <span className="text-slate-400 font-normal">({r.pct}%)</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Construction Timeline — ~{timeline.totalMonths[0]}–{timeline.totalMonths[1]} months</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex h-7 rounded-xl overflow-hidden gap-0.5">
              {timeline.phases.map((p, i) => (
                <div key={p.name} style={{ width: `${p.pct}%`, background: PHASE_COLORS[i] }} title={`${p.name}: ${p.pct}%`} />
              ))}
            </div>
            <div className="space-y-1.5">
              {timeline.phases.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PHASE_COLORS[i] }} />
                  <span className="flex-1 text-slate-600">{p.name}</span>
                  <span className="text-slate-500">Month {p.months[0]}–{p.months[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full line items */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Full Material Line Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead><tr className="bg-slate-50 text-slate-500">
                <th className="px-5 py-2.5 text-left font-medium">Item</th>
                <th className="px-3 py-2.5 text-left font-medium">Grade</th>
                <th className="px-3 py-2.5 text-right font-medium">Qty</th>
                <th className="px-3 py-2.5 text-right font-medium">Unit</th>
                <th className="px-3 py-2.5 text-right font-medium">Rate</th>
                <th className="px-5 py-2.5 text-right font-medium">Amount</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {result.lineItems?.map((item: EstimateLineItem) => (
                  <tr key={item.materialItemCode} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5">
                      <p className="font-medium text-slate-700">{item.name}</p>
                      <p className="text-[11px] text-slate-500">{item.categoryCode}</p>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 max-w-[120px]"><p className="truncate">{item.recommendedGrade}</p></td>
                    <td className="px-3 py-2.5 text-right text-slate-700">{item.quantity?.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2.5 text-right text-slate-400">{item.unit}</td>
                    <td className="px-3 py-2.5 text-right text-slate-700">{item.unitRate?.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-2.5 text-right font-semibold text-slate-800">{formatINRFull(item.lineCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-4 border-red-100 bg-red-50">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" aria-hidden />
            <p className="text-xs text-red-700 leading-relaxed">
              <strong>Disclaimer:</strong> {result.disclaimer}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 pb-6">
          <Image src="/outsyd-icon.png" alt="OUTSYD" width={20} height={20} className="h-5 w-auto opacity-30" />
          <p className="text-[11px] text-slate-500">
            Coefficient dataset {estimate.coefficientDatasetVersion} · Ideated &amp; created by Ankit Kumar Tiwari
          </p>
        </div>
      </div>
    </main>
  );
}
