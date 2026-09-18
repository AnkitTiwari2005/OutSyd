'use client';

// app/estimate/result/page.tsx — OUTSYD Institutional BOQ Results
import Image from 'next/image';
import { useEstimateStore } from '@/stores/estimate-store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatINR, formatINRFull, estimateTimeline, computeLabourBreakdown } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Download, Share2, Save, ArrowLeft,
  ChevronDown, ChevronUp, Info, Loader2,
  AlertTriangle, CheckCircle2, Gauge, Layers, FileSpreadsheet, FileText,
  RotateCcw
} from 'lucide-react';
import { getCategoryColor, BAND_CONFIG, PHASE_COLORS, QUALITATIVE_CHART_COLORS } from '@/lib/constants';

function SectionCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`card-standard bg-white border border-[#E2E8F0] overflow-hidden ${className}`}>
      <div className="px-5 py-3 border-b border-[#E2E8F0] bg-[#F7F8FA]">
        <h3 className="font-bold text-[#1E3A5F] text-sm tracking-tight">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function CollapseSection({ title, badge, children, defaultOpen = true }: {
  title: string; badge?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card-standard bg-white border border-[#E2E8F0] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between hover:bg-[#F7F8FA] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <h3 className="font-bold text-[#1E3A5F] text-sm">{title}</h3>
          {badge && (
            <span className="text-[11px] bg-[#EFF4FA] text-[#1E3A5F] font-semibold px-2 py-0.5 rounded border border-[#CBD5E1]">
              {badge}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-[#64748B]" /> : <ChevronDown size={16} className="text-[#64748B]" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

function CategorySection({ code, name, subtotal, pct, items, defaultOpen = false, isHighCost = false }: {
  code: string; name: string; subtotal: number; pct: string;
  items: any[]; defaultOpen?: boolean; isHighCost?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const color = getCategoryColor(code);

  // Top line items driving this category
  const topDrivers = [...items].sort((a, b) => b.lineCost - a.lineCost).slice(0, 3);

  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#F7F8FA] transition-colors cursor-pointer text-left"
      >
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-[11px] font-mono font-bold text-[#64748B] shrink-0">{code}</span>
        <span className="text-sm font-semibold text-[#0F172A] flex-1 truncate">{name}</span>

        {isHighCost && (
          <span className="hidden sm:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EFF4FA] text-[#1E3A5F] border border-[#CBD5E1]">
            High Driver ({pct}%)
          </span>
        )}

        {subtotal === 0 ? (
          <span className="text-xs font-semibold text-[#64748B] italic">Not applicable (₹0)</span>
        ) : (
          <span className="text-xs font-bold text-[#0F172A] tabular-nums">{formatINR(subtotal)}</span>
        )}
        <span className="text-[11px] font-medium text-[#64748B] w-10 text-right tabular-nums">{pct}%</span>
        {open ? <ChevronUp size={14} className="text-[#64748B] shrink-0" /> : <ChevronDown size={14} className="text-[#64748B] shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-[#E2E8F0] bg-[#F7F8FA]/40">
          {/* Why affordance callout if high cost category */}
          {isHighCost && (
            <div className="px-4 py-2 bg-[#EFF4FA] border-b border-[#E2E8F0] text-xs text-[#1E3A5F]">
              <span className="font-bold">Primary cost drivers: </span>
              {topDrivers.map((d, i) => (
                <span key={d.materialItemCode} className="text-[#0F172A]">
                  {d.name} ({formatINR(d.lineCost)}){i < topDrivers.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </div>
          )}

          {/* Desktop Table or Empty Note */}
          {items.length === 0 ? (
            <div className="p-4 text-xs text-[#64748B] italic bg-[#F7F8FA]">
              No scope or itemized specifications required for this project category based on building inputs (₹0).
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="bg-[#F7F8FA] text-[#64748B] border-b border-[#E2E8F0] font-semibold">
                  <th className="px-4 py-2 text-left">Item Description</th>
                  <th className="px-3 py-2 text-left">Recommended Specification</th>
                  <th className="px-3 py-2 text-right">Quantity</th>
                  <th className="px-3 py-2 text-right">Unit</th>
                  <th className="px-3 py-2 text-right">Unit Rate (₹)</th>
                  <th className="px-4 py-2 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {items.map(item => (
                  <tr key={item.materialItemCode} className="hover:bg-white transition-colors bg-white/70">
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-[#0F172A]">{item.name}</p>
                      {item.isApproximate && <p className="text-[10px] text-[#B45309] mt-0.5">~ {item.approximateNote}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-[#64748B] max-w-[200px]">
                      <span className="whitespace-normal leading-snug">{item.recommendedGrade}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-[#0F172A] tabular-nums font-medium">
                      {item.quantity.toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2.5 text-right text-[#64748B]">{item.unit}</td>
                    <td className="px-3 py-2.5 text-right text-[#0F172A] tabular-nums font-medium">
                      ₹{item.unitRate.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-[#0F172A] tabular-nums">
                      {formatINR(item.lineCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}
  </div>
);
}

export default function ResultPage() {
  const { result, formData, estimateId, resetForm, clearResult } = useEstimateStore();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [expandedWhyCode, setExpandedWhyCode] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [xlsxLoading, setXlsxLoading] = useState(false);

  useEffect(() => {
    if (!result) router.replace('/estimate');
  }, [result, router]);

  if (!result) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-10 h-10 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#0F172A] font-semibold text-sm">Loading calculated estimate…</p>
          <button
            onClick={() => router.push('/estimate')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-[#1E3A5F] text-white hover:bg-[#0F172A] transition-colors"
          >
            <RotateCcw size={13} /> Return to Form
          </button>
        </div>
      </div>
    );
  }

  const band = BAND_CONFIG[result.accuracyBand] ?? BAND_CONFIG.Standard_10_15;
  const buaSqft = result.derivedDimensions.totalBuaSqft;
  const costPerSqft = buaSqft > 0 ? Math.round(result.grandTotalMaterialCost / buaSqft) : 0;
  const costPerSqftLabour = buaSqft > 0 ? Math.round(result.grandTotalWithLabor / buaSqft) : 0;

  // Check variance between bottom-up turnkey total and macro plinth area estimate
  const divergenceRatio = result.plinthAreaEstimate > 0
    ? Math.abs(result.grandTotalWithLabor - result.plinthAreaEstimate) / result.plinthAreaEstimate
    : 0;
  const isDivergent = divergenceRatio > 0.20;

  const chartData = result.categoryTotals
    .filter(c => c.subtotal > 0)
    .map((c, i) => ({
      name: c.name.split(' / ')[0],
      value: c.subtotal,
      full: c.name,
      code: c.categoryCode,
      color: getCategoryColor(c.categoryCode),
    }));

  const labourRows = computeLabourBreakdown(result.grandTotalMaterialCost);
  const labourTotal = labourRows.reduce((s, r) => s + r.amount, 0);
  const timeline = estimateTimeline(buaSqft, formData?.numFloors ?? 1, formData?.typology ?? 'Residential');

  // Auto-generate or ensure estimate ID
  const ensureEstimateId = async (): Promise<string | null> => {
    const state = useEstimateStore.getState();
    if (state.estimateId) return state.estimateId;

    if (formData) {
      try {
        const res = await fetch('/api/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.estimateId) {
          state.setResult(result, json.estimateId, json.guestToken);
          return json.estimateId;
        }
      } catch (e) {
        console.error('Auto persist error:', e);
      }
    }
    return null;
  };

  const handleShare = async () => {
    const id = await ensureEstimateId();
    const url = id ? `${window.location.origin}/estimate/${id}` : window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Shareable link copied to clipboard!');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleDownload = async (type: 'pdf' | 'xlsx') => {
    if (type === 'pdf') setPdfLoading(true);
    else setXlsxLoading(true);

    try {
      const id = await ensureEstimateId();
      if (!id) {
        toast.error('Could not obtain estimate reference', {
          description: 'Please click "Modify Inputs" and recalculate.',
        });
        return;
      }

      const endpoint = type === 'pdf' ? `/api/estimate/${id}/report` : `/api/estimate/${id}/excel`;
      const ext = type === 'pdf' ? 'pdf' : 'xlsx';
      const res = await fetch(endpoint);

      if (!res.ok) {
        toast.error(`Export failed (${res.status})`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OUTSYD-BOQ-${id.slice(0, 8)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${type.toUpperCase()} downloaded successfully!`);
    } catch (err) {
      toast.error('Download encountered an error', { description: String(err) });
    } finally {
      if (type === 'pdf') setPdfLoading(false);
      else setXlsxLoading(false);
    }
  };

  const handleSaveSubmit = async () => {
    setSaveLoading(true);
    try {
      const id = await ensureEstimateId();
      if (!id) {
        toast.error('Save failed');
        return;
      }

      const res = await fetch(`/api/estimate/${id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: saveName || `${formData?.typology || 'Project'} — ${formData?.locationRegion || 'India'}` }),
      });

      if (res.status === 401) {
        toast.info('Sign in required to save estimates', {
          action: { label: 'Sign In', onClick: () => router.push('/login') }
        });
        setSaveOpen(false);
        return;
      }

      if (!res.ok) throw new Error();
      toast.success('Saved to your projects dashboard!', {
        action: { label: 'Dashboard', onClick: () => router.push('/dashboard') }
      });
      setSaveOpen(false);
    } catch {
      toast.error('Could not save estimate.');
    } finally {
      setSaveLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#0F172A] text-white p-2.5 rounded-md shadow-lg text-xs">
        <p className="font-bold mb-0.5">{payload[0].payload.full}</p>
        <p className="font-mono text-sm font-semibold">{formatINRFull(payload[0].value)}</p>
        <p className="text-[#94A3B8] text-[11px] mt-0.5">
          {((payload[0].value / result.grandTotalMaterialCost) * 100).toFixed(1)}% of materials
        </p>
      </div>
    );
  };

  const ICONS = { Gauge, AlertTriangle, Info, CheckCircle2 } as const;
  const BandIcon = ICONS[band.icon as keyof typeof ICONS] ?? Info;

  return (
    <main className="min-h-screen bg-[#F7F8FA] text-[#0F172A]">
      {/* ── Fixed Position Header Toolbar (Fixes Overlap Defect) ── */}
      {/* Defined height: 64px, solid white background, z-index 40, border bottom #E2E8F0 */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#E2E8F0] z-40 shadow-xs">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => router.push('/estimate?mode=edit&step=3')}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#1E3A5F] hover:underline cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Modify Inputs</span>
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                clearResult();
                router.push('/estimate');
              }}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 text-[#1E3A5F] bg-[#EFF4FA] border border-[#CBD5E1] rounded hover:bg-[#E2E8F0] cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Start New Estimate</span>
            </button>
            <div className="w-px h-5 bg-[#E2E8F0]" />
            <Link href="/">
              <Image
                src="/outsyd-logo.png"
                alt="OUTSYD"
                width={96}
                height={24}
                className="h-6 w-auto"
                priority
              />
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              title="Copy link"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E3A5F] bg-white border border-[#CBD5E1] rounded-md hover:bg-[#F7F8FA] cursor-pointer"
            >
              <Share2 size={13} />
              <span>Share</span>
            </button>

            {/* Save */}
            <button
              type="button"
              onClick={() => setSaveOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E3A5F] bg-white border border-[#CBD5E1] rounded-md hover:bg-[#F7F8FA] cursor-pointer"
            >
              <Save size={13} />
              <span>Save</span>
            </button>

            {/* Excel (.xlsx) */}
            <button
              type="button"
              onClick={() => handleDownload('xlsx')}
              disabled={xlsxLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E3A5F] bg-white border border-[#CBD5E1] rounded-md hover:bg-[#F7F8FA] cursor-pointer disabled:opacity-40"
            >
              {xlsxLoading ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
              <span className="hidden sm:inline">Excel Workbook</span>
            </button>

            {/* Single Primary Action: PDF BOQ (Amber #D97706) */}
            <button
              type="button"
              onClick={() => handleDownload('pdf')}
              disabled={pdfLoading}
              className="btn-primary py-2 px-3.5 text-xs"
            >
              {pdfLoading ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
              <span>PDF BOQ</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Container (Guaranteed pt-20 to never render under toolbar) ── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-20 pb-16 space-y-6">

        {/* ── Accuracy Band Card ── */}
        <div className={`rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${band.cls}`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 shrink-0 ${band.iconCls}`}>
              <BandIcon size={20} />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">{band.label}</p>
              <p className="text-xs opacity-85 mt-0.5">
                Classification: Tier {result.classification.tier} · {result.classification.category.replace(/_/g, ' ')}
                {result.classification.reasons.length > 0 && (
                  <span className="ml-1 opacity-75">({result.classification.reasons.join(' · ')})</span>
                )}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0 text-xs">
            <span className="opacity-75">CPWD DSR Schedule:</span>{' '}
            <strong className="font-mono">{result.coefficientDatasetVersion}</strong>
          </div>
        </div>

        {/* Disclaimer Callout (Semantic Warning Palette: #B45309 on #FEF3C7) */}
        <div className="p-3 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-xs text-[#B45309] flex items-start gap-2.5">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-[#B45309]" />
          <p className="leading-relaxed">
            <strong>Planning estimate:</strong> Quantities and unit rates reflect CPWD DSR 2024 specifications and regional cost indices. Not a substitute for a licensed structural engineer&apos;s BOQ. <Link href="/disclaimer" className="underline font-semibold">Full disclaimer →</Link>
          </p>
        </div>

        {/* Macro Benchmark Sanity-Check Warning when BOQ diverges from plinth rate by > 20% */}
        {isDivergent && (
          <div className="p-3.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] flex items-start gap-3">
            <Info size={16} className="shrink-0 mt-0.5 text-[#D97706]" />
            <div>
              <p className="font-bold">Macro Benchmark Sanity-Check Notice ({(divergenceRatio * 100).toFixed(0)}% methodology variance)</p>
              <p className="mt-0.5 leading-relaxed text-[#78350F]">
                The bottom-up itemized BOQ turnkey total ({formatINR(result.grandTotalWithLabor)}) varies from the macro plinth area rate benchmark ({formatINR(result.plinthAreaEstimate)}) by {(divergenceRatio * 100).toFixed(0)}%. Detailed BOQ aggregates individual elemental takeoff quantities (soil conditions, seismic detailing, facade specs, and MEP systems) rather than top-down flat-area approximations.
              </p>
            </div>
          </div>
        )}

        {/* ── 4 Key Figures Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-standard p-4 bg-white border border-[#E2E8F0]">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Material Cost</p>
            <p className="text-2xl font-bold text-[#0F172A] tabular-nums mt-1">{formatINR(result.grandTotalMaterialCost)}</p>
            <p className="text-xs text-[#64748B] mt-0.5">Direct materials (18 categories)</p>
          </div>

          <div className="card-standard p-4 bg-[#EFF4FA] border-2 border-[#CBD5E1]">
            <p className="text-[11px] font-bold text-[#1E3A5F] uppercase tracking-wider">Total Turnkey Cost</p>
            <p className="text-2xl font-bold text-[#1E3A5F] tabular-nums mt-1">{formatINR(result.grandTotalWithLabor)}</p>
            <p className="text-xs text-[#1E3A5F] mt-0.5">Includes standard +30% labour</p>
          </div>

          <div className="card-standard p-4 bg-white border border-[#E2E8F0]">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Material / sqft</p>
            <p className="text-2xl font-bold text-[#0F172A] tabular-nums mt-1">₹{costPerSqft.toLocaleString('en-IN')}</p>
            <p className="text-xs text-[#64748B] mt-0.5">Per sqft built-up area</p>
          </div>

          <div className="card-standard p-4 bg-white border border-[#E2E8F0]">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">All-in / sqft</p>
            <p className="text-2xl font-bold text-[#0F172A] tabular-nums mt-1">₹{costPerSqftLabour.toLocaleString('en-IN')}</p>
            <p className="text-xs text-[#64748B] mt-0.5">Turnkey execution rate</p>
          </div>
        </div>

        {/* Input Scope Metadata Pills */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-white border border-[#E2E8F0] font-medium text-[#0F172A]">
            BUA: <strong>{result.derivedDimensions.totalBuaSqft.toLocaleString('en-IN')} sqft</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-white border border-[#E2E8F0] font-medium text-[#0F172A]">
            Location: <strong>{formData?.locationRegion}</strong> ({result.regionalIndexApplied}× index)
          </span>
          <span className="px-2.5 py-1 rounded bg-white border border-[#E2E8F0] font-medium text-[#0F172A]">
            Quality: <strong>{formData?.qualityTier}</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-white border border-[#E2E8F0] font-medium text-[#0F172A]">
            Structure: <strong>{(formData?.structuralSystem || 'RCC Frame').replace(/_/g, ' ')}</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-white border border-[#E2E8F0] font-medium text-[#0F172A]">
            Line Items: <strong>{result.lineItems.length} items</strong>
          </span>
        </div>

        {/* ── 2-Column Grid: Donut Chart + Category Breakdown List (No floating elements) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Column 1: Cost Distribution Donut Chart with Direct Legend */}
          <SectionCard title="Cost Distribution by Category" className="lg:col-span-2">
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    onMouseEnter={(_, i) => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {chartData.map((d, i) => (
                      <Cell
                        key={d.code}
                        fill={d.color}
                        opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                        stroke="#FFFFFF"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Direct Labels / Percentages List */}
            <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {result.categoryTotals.filter(d => d.subtotal > 0).map((d) => {
                const pctVal = ((d.subtotal / result.grandTotalMaterialCost) * 100).toFixed(1);
                const isLarge = Number(pctVal) >= 20;

                return (
                  <div
                    key={d.categoryCode}
                    className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-[#F7F8FA]"
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: getCategoryColor(d.categoryCode) }} />
                      <span className="text-[#0F172A] truncate font-medium">{d.name.split(' / ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 tabular-nums">
                      {isLarge && (
                        <span className="text-[10px] font-bold text-[#1E3A5F] bg-[#EFF4FA] px-1 rounded">
                          Key Driver
                        </span>
                      )}
                      <span className="font-semibold text-[#0F172A]">{pctVal}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Column 2: Category Cost Breakdown List with Independent Scroll */}
          <SectionCard title="18-Category Cost Breakdown & Primary Drivers" className="lg:col-span-3">
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
              {result.categoryTotals.map(cat => {
                const pct = result.grandTotalMaterialCost > 0
                  ? (cat.subtotal / result.grandTotalMaterialCost * 100) : 0;
                const isHighCost = pct >= 20;
                const isZero = cat.subtotal === 0;

                return (
                  <div key={cat.categoryCode} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#0F172A] truncate flex-1 mr-3">
                        <span className="font-mono text-[#64748B] text-[11px] mr-1.5 font-bold">{cat.categoryCode}</span>
                        {cat.name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {isZero ? (
                          <span className="text-[11px] text-[#64748B] italic bg-[#F1F5F9] px-2 py-0.5 rounded">
                            Not applicable (₹0)
                          </span>
                        ) : (
                          <>
                            {isHighCost && (
                              <button
                                type="button"
                                onClick={() => setExpandedWhyCode(expandedWhyCode === cat.categoryCode ? null : cat.categoryCode)}
                                title="View primary line-item cost drivers"
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1E3A5F] bg-[#EFF4FA] px-1.5 py-0.5 rounded cursor-pointer hover:underline"
                              >
                                <Info size={11} />
                                <span>Why?</span>
                              </button>
                            )}
                            <span className="font-bold text-[#0F172A] tabular-nums">{formatINR(cat.subtotal)}</span>
                            <span className="text-[11px] text-[#64748B] w-8 text-right tabular-nums">{pct.toFixed(1)}%</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${isZero ? 0 : Math.max(pct, 0.5)}%`, background: getCategoryColor(cat.categoryCode) }}
                      />
                    </div>

                    {/* Inline Why Expansion Box */}
                    {expandedWhyCode === cat.categoryCode && (
                      <div className="p-2.5 rounded bg-[#F7F8FA] border border-[#E2E8F0] text-xs text-[#1E3A5F] mt-1.5 animate-in fade-in">
                        <p className="font-bold mb-1 text-[11px] uppercase tracking-wider text-[#64748B]">
                          Primary Cost Contributors for {cat.name}:
                        </p>
                        <div className="space-y-1">
                          {result.lineItems
                            .filter(li => li.categoryCode === cat.categoryCode)
                            .sort((a, b) => b.lineCost - a.lineCost)
                            .slice(0, 3)
                            .map(top => (
                              <div key={top.materialItemCode} className="flex justify-between text-[#0F172A]">
                                <span>{top.name}</span>
                                <span className="font-bold tabular-nums">{formatINR(top.lineCost)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-between items-center">
              <span className="text-sm font-bold text-[#1E3A5F]">Total Material BOQ</span>
              <span className="text-base font-bold text-[#0F172A] tabular-nums">
                {formatINRFull(result.grandTotalMaterialCost)}
              </span>
            </div>
          </SectionCard>
        </div>

        {/* ── Labour & Trades Breakdown ── */}
        <CollapseSection title="Labour & Trades Breakdown (+30%)" badge={`+30% = ${formatINR(labourTotal)}`}>
          <div className="space-y-3">
            {labourRows.map(r => (
              <div key={r.trade}>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="font-medium text-[#0F172A]">{r.trade}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0F172A] tabular-nums">{formatINR(r.amount)}</span>
                    <span className="text-[#64748B] text-[11px] w-8 text-right tabular-nums">{r.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#1E3A5F]"
                    style={{ width: `${(r.pct / 28) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-between items-center text-sm font-bold">
            <span className="text-[#1E3A5F]">Total Labour Component</span>
            <span className="tabular-nums text-[#0F172A]">{formatINRFull(labourTotal)}</span>
          </div>
        </CollapseSection>

        {/* ── Timeline Schedule ── */}
        <CollapseSection title={`Construction Phasing Schedule · ~${timeline.totalMonths[0]}–${timeline.totalMonths[1]} Months Estimated`} defaultOpen={false}>
          <div className="space-y-4">
            <div className="flex h-7 rounded-md overflow-hidden gap-px bg-[#E2E8F0] p-0.5">
              {timeline.phases.map((p, i) => (
                <div
                  key={p.name}
                  style={{ width: `${p.pct}%`, background: PHASE_COLORS[i % PHASE_COLORS.length] }}
                  className="flex items-center justify-center text-white text-[10px] font-bold px-1 truncate"
                  title={`${p.name}: Month ${p.months[0]}–${p.months[1]}`}
                >
                  {p.name.split(' ')[0]}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {timeline.phases.map((p, i) => (
                <div key={p.name} className="p-2.5 rounded bg-[#F7F8FA] border border-[#E2E8F0] text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PHASE_COLORS[i % PHASE_COLORS.length] }} />
                    <div>
                      <p className="font-semibold text-[#0F172A]">{p.name}</p>
                      <p className="text-[11px] text-[#64748B]">Month {p.months[0]}–{p.months[1]}</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#0F172A] tabular-nums">{p.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </CollapseSection>

        {/* ── Complete 18-Category Itemized BOQ ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-bold text-base text-[#1E3A5F] flex items-center gap-2">
              <Layers size={17} />
              <span>Full Itemized Bill of Quantities ({result.lineItems.length} Line Items)</span>
            </h2>
            <span className="text-xs text-[#64748B]">Click category to expand line items</span>
          </div>

          {result.categoryTotals.map(cat => {
            const items = result.lineItems.filter(li => li.categoryCode === cat.categoryCode);
            const pct = result.grandTotalMaterialCost > 0
              ? (cat.subtotal / result.grandTotalMaterialCost * 100) : 0;
            const isLargest = cat.subtotal > 0 && cat.subtotal === Math.max(...result.categoryTotals.map(c => c.subtotal));

            return (
              <CategorySection
                key={cat.categoryCode}
                code={cat.categoryCode}
                name={cat.name}
                subtotal={cat.subtotal}
                pct={pct.toFixed(1)}
                items={items}
                defaultOpen={isLargest}
                isHighCost={pct >= 20}
              />
            );
          })}
        </div>

        {/* ── Bottom Export Actions ── */}
        <div className="p-6 rounded-lg bg-white border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-[#1E3A5F]">Export Formal Documentation</h4>
            <p className="text-xs text-[#64748B] mt-0.5">
              Available as a formal CPWD-formatted PDF report or formulaic 3-sheet Excel (.xlsx) workbook.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                resetForm();
                clearResult();
                router.push('/estimate');
              }}
              className="btn-secondary flex-1 sm:flex-initial py-2.5 px-4 text-xs font-semibold"
            >
              <RotateCcw size={14} />
              <span>Start New Estimate</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('xlsx')}
              disabled={xlsxLoading}
              className="btn-secondary flex-1 sm:flex-initial py-2.5 px-4 text-xs font-semibold"
            >
              {xlsxLoading ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
              <span>Export Excel (.xlsx)</span>
            </button>

            {/* Primary Action Button (Amber #D97706) */}
            <button
              type="button"
              onClick={() => handleDownload('pdf')}
              disabled={pdfLoading}
              className="btn-primary flex-1 sm:flex-initial py-2.5 px-5 text-xs font-semibold"
            >
              {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              <span>Export PDF BOQ</span>
            </button>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-center text-xs text-[#64748B] pt-4">
          <span>Engine v{result.coefficientDatasetVersion} · CPWD DSR 2024 & NBC 2016 Specification Norms</span>
        </div>
      </div>

      {/* ── Save Modal Dialog ── */}
      {saveOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={e => { if (e.target === e.currentTarget) setSaveOpen(false); }}
        >
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xl w-full max-w-sm p-6 space-y-4 animate-in fade-in">
            <div>
              <h3 className="text-base font-bold text-[#1E3A5F]">Save Estimate Project</h3>
              <p className="text-xs text-[#64748B] mt-1">Assign a project name to track and reload this BOQ in your dashboard.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">Project Name</label>
              <input
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="e.g. G+3 Residential — Whitefield"
                className="form-input"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSaveSubmit()}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSaveOpen(false)}
                className="btn-secondary flex-1 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSubmit}
                disabled={saveLoading}
                className="btn-primary flex-1 py-2 text-xs"
              >
                {saveLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>{saveLoading ? 'Saving…' : 'Save Project'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
