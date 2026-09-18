'use client';

// app/admin/coefficients/new/page.tsx — Publish New Coefficient Dataset
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { ArrowLeft, Database, Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { DEFAULT_DATASET } from '@/lib/engine/coefficients';

export default function NewCoefficientDatasetPage() {
  const router = useRouter();
  const [version, setVersion] = useState(
    () => `${new Date().toISOString().slice(0, 10)}-v${Math.floor(Date.now() / 1000).toString().slice(-4)}`
  );
  const [description, setDescription] = useState('CPWD DSR Schedule of Rates calibration update');
  const [ratesJson, setRatesJson] = useState(() => JSON.stringify(DEFAULT_DATASET.rates, null, 2));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate JSON client-side
      JSON.parse(ratesJson);

      const res = await fetch('/api/admin/coefficients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version,
          description,
          ratesJson,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish dataset');
      }

      toast.success(`Published dataset version ${version}`);
      router.push('/admin');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error publishing dataset';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="btn-ghost py-1.5 px-2 text-xs flex items-center gap-1">
              <ArrowLeft size={13} /> Admin
            </Link>
            <Link href="/">
              <Image src="/outsyd-logo.png" alt="OUTSYD" width={100} height={28} className="h-7 w-auto" />
            </Link>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield size={14} className="text-orange-500" />
            <span>Admin</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-orange-600 font-semibold mb-1">
            <Database size={14} />
            <span>BR-6 Immutable Versioning</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Publish New Coefficient Dataset</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create an append-only coefficient dataset version. Existing estimates retain their pinned dataset version.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 bg-white border border-slate-200 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Version Identifier</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                required
                className="form-input font-mono text-xs"
                placeholder="e.g. 2026-09-19-v1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="form-input text-xs"
                placeholder="Brief summary of revisions or circulars applied"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Rates JSON Specification</label>
              <span className="text-[11px] text-slate-400 font-mono">
                {Object.keys(DEFAULT_DATASET.rates).length} base line item rates
              </span>
            </div>
            <textarea
              value={ratesJson}
              onChange={(e) => setRatesJson(e.target.value)}
              rows={16}
              required
              className="form-input font-mono text-xs leading-relaxed"
              spellCheck={false}
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <Link href="/admin" className="btn-secondary py-2 px-4 text-xs">
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-2.5 px-6 text-xs flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Publishing Dataset…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Publish Immutable Version</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
