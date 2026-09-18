// app/admin/page.tsx — Admin Panel (admin role required)
import Image from 'next/image';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { coefficientDatasets, regionalRateIndex, estimates, users } from '@/lib/db/schema';
import { desc, count } from 'drizzle-orm';
import Link from 'next/link';
import { Shield, Database, MapPin, BarChart3, Users, TrendingUp, Info } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export const metadata = { title: 'Admin — OUTSYD' };

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'admin') redirect('/dashboard');

  // Stats
  const [totalEstimates] = await db.select({ c: count() }).from(estimates);
  const [totalUsers]     = await db.select({ c: count() }).from(users);
  const datasets         = await db.select().from(coefficientDatasets).orderBy(desc(coefficientDatasets.publishedAt)).limit(10);
  const rates            = await db.select().from(regionalRateIndex).orderBy(regionalRateIndex.regionName).limit(60);
  const recentEstimates  = await db.select().from(estimates).orderBy(desc(estimates.createdAt)).limit(15);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image src="/outsyd-logo.png" alt="OUTSYD" width={110} height={32} className="h-8 w-auto" />
            </Link>
            <span className="badge-orange text-[10px]">Admin</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <Shield size={14} className="text-orange-500" />
            {session.user.name ?? session.user.email}
            <Link href="/dashboard" className="btn-ghost py-1.5 px-3 text-xs">← Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <h1 className="text-2xl font-bold" style={{ color: '#1e2d4e' }}>Admin Panel</h1>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Estimates', value: totalEstimates.c, icon: BarChart3,  color: 'text-orange-500' },
            { label: 'Total Users',     value: totalUsers.c,     icon: Users,      color: 'text-blue-500' },
            { label: 'Datasets',        value: datasets.length,  icon: Database,   color: 'text-green-500' },
            { label: 'Rate Regions',    value: rates.length,     icon: MapPin,     color: 'text-purple-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <Icon size={18} className={color} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Coefficient Datasets */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-slate-400" />
              <h2 className="font-semibold text-slate-800">Coefficient Datasets</h2>
              <span className="badge-orange text-[10px]">Immutable — BR-6</span>
            </div>
            <Link href="/admin/coefficients/new" className="btn-primary py-2 px-4 text-xs">+ Publish New Version</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-slate-500 text-xs">
                <th className="px-5 py-2.5 text-left font-medium">Version</th>
                <th className="px-3 py-2.5 text-left font-medium">Description</th>
                <th className="px-3 py-2.5 text-left font-medium">Published</th>
                <th className="px-3 py-2.5 text-center font-medium">Active</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {datasets.map(ds => (
                  <tr key={ds.version} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-mono text-xs font-semibold text-slate-800">{ds.version}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500 max-w-[300px]">
                      <p className="truncate">{ds.description ?? '—'}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400">{new Date(ds.publishedAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-3 py-3 text-center">
                      {ds.isActive
                        ? <span className="badge-green">Active</span>
                        : <span className="badge text-slate-400 bg-slate-100">Inactive</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
            <div className="flex items-start gap-2">
              <Info size={11} className="text-slate-400 mt-0.5 shrink-0" aria-hidden />
              <p className="text-[10px] text-slate-400">
                Coefficient datasets are <strong>append-only</strong> (BR-6). Existing rows are never modified or deleted.
                Publishing a new version creates a new row and marks the previous as inactive.
              </p>
            </div>
          </div>
        </div>

        {/* Regional Rate Index */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-slate-400" />
              <h2 className="font-semibold text-slate-800">Regional Rate Index</h2>
              <span className="badge-blue text-[10px]">{rates.length} regions</span>
            </div>
            <Link href="/admin/rates/edit" className="btn-secondary py-2 px-4 text-xs">Edit Rates</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-slate-500 text-xs">
                <th className="px-5 py-2.5 text-left font-medium">Region</th>
                <th className="px-3 py-2.5 text-right font-medium">Index</th>
                <th className="px-3 py-2.5 text-left font-medium">Effective Date</th>
                <th className="px-3 py-2.5 text-left font-medium">Notes</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {rates.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5">
                      <p className="text-xs font-medium text-slate-700">{r.regionName}</p>
                      {r.regionCode && <p className="text-[10px] text-slate-400">{r.regionCode}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={`text-xs font-bold ${
                        r.indexValue > 1.1 ? 'text-red-500' :
                        r.indexValue < 0.95 ? 'text-green-500' : 'text-slate-700'
                      }`}>{Number(r.indexValue).toFixed(3)}×</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-400">{r.effectiveDate}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-400 max-w-[200px]">
                      <p className="truncate">{r.notes ?? '—'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Estimates */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-400" />
            <h2 className="font-semibold text-slate-800">Recent Estimates</h2>
            <span className="badge-orange text-[10px]">Last 15</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 text-slate-500">
                <th className="px-5 py-2.5 text-left font-medium">ID</th>
                <th className="px-3 py-2.5 text-left font-medium">Tier / Category</th>
                <th className="px-3 py-2.5 text-left font-medium">Accuracy</th>
                <th className="px-3 py-2.5 text-right font-medium">Total</th>
                <th className="px-3 py-2.5 text-right font-medium">Regional ×</th>
                <th className="px-5 py-2.5 text-left font-medium">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {recentEstimates.map(est => (
                  <tr key={est.id} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5">
                      <Link href={`/estimate/${est.id}`} className="font-mono text-[10px] text-orange-500 hover:underline">
                        {est.id.slice(0, 12)}…
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">
                      Tier {est.classificationTier} · {est.buildingCategory?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`badge text-[10px] ${
                        est.accuracyBand === 'Advanced_5_10' ? 'badge-green' :
                        est.accuracyBand === 'Standard_10_15' ? 'badge-blue' : 'badge-amber'
                      }`}>{est.accuracyBand?.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-800">
                      {formatINR(est.grandTotalMaterialCost ?? 0)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-400">{Number(est.regionalIndexApplied).toFixed(3)}×</td>
                    <td className="px-5 py-2.5 text-slate-400">
                      {new Date(est.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
