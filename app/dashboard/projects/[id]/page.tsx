// app/dashboard/projects/[id]/page.tsx — Project detail v2
import { Logo } from '@/components/Logo';
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { projects, estimates } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import Link from 'next/link';
import {
  ArrowLeft, Download, Clock, TrendingUp, PlusCircle,
  ExternalLink, AlertTriangle, Info, CheckCircle2,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import type { EstimateResult, CategoryTotal } from '@/lib/engine/types';
import { BAND_CONFIG, getCategoryColor } from '@/lib/constants';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return { title: `${p?.name ?? 'Project'} — OUTSYD` };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = (session.user.id ?? '') as string;
  const { id } = await params;

  const [project] = await db.select().from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId))).limit(1);
  if (!project) notFound();

  const projectEstimates = await db.select().from(estimates)
    .where(eq(estimates.projectId, id))
    .orderBy(desc(estimates.createdAt)).limit(20);

  const latest = projectEstimates[0];

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <Link href="/">
              <Logo width={90} height={26} className="h-6 w-auto" priority />
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-700 truncate max-w-xs">{project.name}</span>
          </div>
          <Link href="/estimate" className="btn-primary py-2 px-3.5 text-xs">
            <PlusCircle size={14} /> New Estimate
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Project header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
              <Clock size={11} /> Created {new Date(project.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <Link href="/estimate" className="btn-secondary py-2 px-3.5 text-xs">
            <PlusCircle size={14} /> New Estimate
          </Link>
        </div>

        {/* Latest summary card */}
        {latest && (() => {
          const band = BAND_CONFIG[latest.accuracyBand] ?? BAND_CONFIG.Standard_10_15;
          const BandIcon = band.icon === 'CheckCircle2' ? CheckCircle2 : band.icon === 'Info' ? Info : AlertTriangle;
          const result = (typeof latest.resultJson === 'string' ? JSON.parse(latest.resultJson) : latest.resultJson) as unknown as EstimateResult;
          const bua = result?.derivedDimensions?.totalBuaSqft ?? 0;
          return (
            <div className="card-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <BandIcon size={14} className="text-orange-500" aria-hidden />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Latest Estimate</p>
                <span className={band.cls}>{band.label}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                {[
                  { label: 'Material Cost',   value: formatINR(latest.grandTotalMaterialCost ?? 0), highlight: false },
                  { label: 'With Labour',     value: formatINR(latest.grandTotalWithLabor ?? 0),    highlight: true  },
                  { label: 'Built-up Area',   value: `${bua.toLocaleString('en-IN')} sqft`,         highlight: false },
                  { label: 'Regional Index',  value: `${Number(latest.regionalIndexApplied).toFixed(3)}×`, highlight: false },
                ].map(({ label, value, highlight }) => (
                  <div key={label}>
                    <p className="text-[11px] text-slate-400 mb-0.5">{label}</p>
                    <p className={`text-lg font-bold ${highlight ? 'text-orange-600' : 'text-slate-900'}`}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <Link href={`/estimate/${latest.id}`}
                  className="btn-secondary py-2 px-3.5 text-xs">
                  <ExternalLink size={12} /> View Full Report
                </Link>
                <a href={`/api/estimate/${latest.id}/report`}
                  download={`OUTSYD-${project.name.replace(/\s+/g,'-')}.pdf`}
                  className="btn-ghost py-2 px-3 text-xs">
                  <Download size={12} /> Download PDF
                </a>
              </div>
            </div>
          );
        })()}

        {/* All estimates list */}
        <div>
          <h2 className="text-sm font-semibold text-slate-600 mb-3">
            All Estimates
            <span className="ml-2 text-slate-300 font-normal">({projectEstimates.length})</span>
          </h2>

          {projectEstimates.length === 0 ? (
            <div className="card text-center py-16">
              <TrendingUp size={28} className="text-slate-200 mx-auto mb-3" aria-hidden />
              <p className="text-slate-400 text-sm">No estimates yet for this project.</p>
              <Link href="/estimate" className="btn-primary mt-4 inline-flex">
                <PlusCircle size={14} /> Run First Estimate
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projectEstimates.map((est, i) => {
                const band = BAND_CONFIG[est.accuracyBand] ?? BAND_CONFIG.Standard_10_15;
                const BandIcon = band.icon === 'CheckCircle2' ? CheckCircle2 : band.icon === 'Info' ? Info : AlertTriangle;
                const resultData = (typeof est.resultJson === 'string'
                  ? JSON.parse(est.resultJson) : est.resultJson) as unknown as EstimateResult;

                return (
                  <div key={est.id} className="card p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-700">
                            Estimate #{projectEstimates.length - i}
                          </span>
                          <span className={band.cls}>
                            <BandIcon size={10} aria-hidden /> {band.label}
                          </span>
                          {est.buildingCategory && (
                            <span className="badge-slate">
                              {est.buildingCategory.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock size={10} aria-hidden />
                          {new Date(est.createdAt).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/estimate/${est.id}`} className="btn-ghost py-1.5 px-2.5 text-xs">
                          <ExternalLink size={11} /> View
                        </Link>
                        <a href={`/api/estimate/${est.id}/report`}
                          download className="btn-ghost py-1.5 px-2.5 text-xs">
                          <Download size={11} /> PDF
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                      {[
                        { label: 'Materials',    value: formatINR(est.grandTotalMaterialCost ?? 0) },
                        { label: 'With Labour',  value: formatINR(est.grandTotalWithLabor ?? 0)    },
                        { label: 'BUA',          value: `${(resultData?.derivedDimensions?.totalBuaSqft ?? 0).toLocaleString('en-IN')} sqft` },
                        { label: 'Region ×',     value: `${Number(est.regionalIndexApplied).toFixed(3)}` },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-50 rounded-xl p-2.5">
                          <p className="text-[10px] text-slate-400">{label}</p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Category bar */}
                    {resultData?.categoryTotals && (
                      <div>
                        <p className="text-[10px] text-slate-400 mb-1.5">Category distribution</p>
                        <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
                          {resultData.categoryTotals
                            .filter((c: CategoryTotal) => c.subtotal > 0)
                            .map((c: CategoryTotal) => {
                              const pct = (c.subtotal / (est.grandTotalMaterialCost ?? 1)) * 100;
                              return (
                                <div key={c.categoryCode}
                                  style={{ width: `${pct}%`, background: getCategoryColor(c.categoryCode) }}
                                  title={`${c.name}: ${pct.toFixed(1)}%`}
                                  aria-label={`${c.name} ${pct.toFixed(1)}%`}
                                />
                              );
                            })
                          }
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
