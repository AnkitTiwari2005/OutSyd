'use client';

// app/admin/coefficients/new/page.tsx — Publish New Coefficient Dataset
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { toast } from 'sonner';
import { ArrowLeft, Database, Shield, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DEFAULT_DATASET } from '@/lib/engine/coefficients';
import { validateDatasetCompleteness } from '@/lib/engine/estimator';

export default function NewCoefficientDatasetPage() {
  const router = useRouter();
  const [version, setVersion] = useState(
    () => `${new Date().toISOString().slice(0, 10)}-v${Math.floor(Date.now() / 1000).toString().slice(-4)}`
  );
  const [description, setDescription] = useState('CPWD DSR Schedule of Rates calibration update');
  const [ratesJson, setRatesJson] = useState(() => JSON.stringify(DEFAULT_DATASET.rates, null, 2));
  const [loading, setLoading] = useState(false);

  const validation = useMemo(() => {
    try {
      const parsed = JSON.parse(ratesJson);
      const ratesDict =
        typeof parsed === 'object' &&
        parsed !== null &&
        'rates' in parsed &&
        typeof (parsed as { rates: unknown }).rates === 'object' &&
        (parsed as { rates: unknown }).rates !== null
          ? ((parsed as { rates: Record<string, unknown> }).rates)
          : (parsed as Record<string, unknown>);

      if (typeof ratesDict !== 'object' || ratesDict === null) {
        return { validJson: true, isValid: false, missingCodes: ['Root rates object required'], changedCount: 0, totalCount: 0 };
      }

      const res = validateDatasetCompleteness(ratesDict);
      let changedCount = 0;
      let totalCount = 0;
      for (const [k, v] of Object.entries(ratesDict)) {
        totalCount++;
        if (DEFAULT_DATASET.rates[k] !== v) {
          changedCount++;
        }
      }

      return {
        validJson: true,
        isValid: res.isValid,
        missingCodes: res.missingCodes,
        changedCount,
        totalCount,
      };
    } catch {
      return { validJson: false, isValid: false, missingCodes: [], changedCount: 0, totalCount: 0 };
    }
  }, [ratesJson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.validJson) {
      toast.error('Rates specification must be valid JSON');
      return;
    }
    if (!validation.isValid) {
      toast.error(`Rates incomplete: missing ${validation.missingCodes.length} required line item(s)`);
      return;
    }

    setLoading(true);
    try {
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
              <Logo width={100} height={28} className="h-7 w-auto" />
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">Rates JSON Specification</label>
              <div className="flex items-center gap-2">
                {!validation.validJson ? (
                  <span className="text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1">
                    <AlertTriangle size={11} /> Invalid JSON
                  </span>
                ) : !validation.isValid ? (
                  <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1">
                    <AlertTriangle size={11} /> {validation.missingCodes.length} rate(s) missing
                  </span>
                ) : (
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1">
                    <CheckCircle2 size={11} /> {validation.totalCount}/{Object.keys(DEFAULT_DATASET.rates).length} rates verified ({validation.changedCount} modified)
                  </span>
                )}
              </div>
            </div>
            <textarea
              value={ratesJson}
              onChange={(e) => setRatesJson(e.target.value)}
              rows={16}
              required
              className="form-input font-mono text-xs leading-relaxed"
              spellCheck={false}
            />
            {!validation.isValid && validation.missingCodes.length > 0 && (
              <p className="text-[11px] text-amber-700 mt-1">
                Missing required codes: {validation.missingCodes.slice(0, 8).join(', ')}
                {validation.missingCodes.length > 8 ? ` and ${validation.missingCodes.length - 8} more` : ''}
              </p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <Link href="/admin" className="btn-secondary py-2 px-4 text-xs">
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading || !validation.isValid}
              className="btn-primary py-2.5 px-6 text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
