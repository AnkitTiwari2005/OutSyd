'use client';
// app/admin/rates/edit/page.tsx — Regional Rate Editor
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';

interface RateRow { id: string; regionName: string; indexValue: number; notes: string | null; }

export default function RateEditorPage() {
  const [rates, setRates]     = useState<RateRow[]>([]);
  const [edits, setEdits]     = useState<Record<string, { indexValue: string; notes: string }>>({});
  const [saving, setSaving]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/rates').then(r => r.json()).then(d => {
      setRates(d.rates ?? []);
      setLoading(false);
    }).catch(() => { toast.error('Failed to load rates'); setLoading(false); });
  }, []);

  const handleEdit = (id: string, field: 'indexValue' | 'notes', value: string) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSave = async (rate: RateRow) => {
    const edit = edits[rate.id];
    if (!edit) return;
    setSaving(rate.id);
    try {
      const res = await fetch(`/api/admin/rates/${rate.id}`, {
        method : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ indexValue: parseFloat(edit.indexValue ?? rate.indexValue.toString()), notes: edit.notes ?? rate.notes }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Updated ${rate.regionName}`);
      setRates(prev => prev.map(r => r.id === rate.id ? { ...r, ...{ indexValue: parseFloat(edit.indexValue), notes: edit.notes } } : r));
      setEdits(prev => { const n = { ...prev }; delete n[rate.id]; return n; });
    } catch { toast.error('Failed to update rate'); }
    finally { setSaving(null); }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="btn-ghost py-1.5 px-2 text-xs"><ArrowLeft size={13} /> Admin</Link>
            <Link href="/">
              <Image src="/outsyd-logo.png" alt="OUTSYD" width={100} height={28} className="h-7 w-auto" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1e2d4e' }}>Regional Rate Index Editor</h1>
          <p className="text-sm text-slate-400 mt-1">
            Adjust the multiplier per region. 1.000 = base rate. Higher = more expensive market.
          </p>
        </div>

        {loading ? (
          <div className="card p-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-orange-400" size={24} />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 text-slate-500 text-xs">
                  <th className="px-5 py-2.5 text-left font-medium w-[200px]">Region</th>
                  <th className="px-3 py-2.5 text-left font-medium w-[140px]">Index (×)</th>
                  <th className="px-3 py-2.5 text-left font-medium">Notes</th>
                  <th className="px-5 py-2.5 text-right font-medium w-[80px]">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {rates.map(rate => {
                    const edit    = edits[rate.id];
                    const isDirty = !!edit;
                    const currentVal = edit?.indexValue ?? rate.indexValue.toString();
                    const numVal     = parseFloat(currentVal);

                    return (
                      <tr key={rate.id} className={isDirty ? 'bg-orange-50' : 'hover:bg-slate-50'}>
                        <td className="px-5 py-2.5">
                          <p className="text-xs font-medium text-slate-700">{rate.regionName}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="number" step="0.001" min="0.5" max="3"
                              value={currentVal}
                              onChange={e => handleEdit(rate.id, 'indexValue', e.target.value)}
                              className="w-24 form-input py-1.5 text-xs"
                            />
                            <span className={`text-[10px] font-semibold ${
                              numVal > 1.1 ? 'text-red-500' : numVal < 0.95 ? 'text-green-500' : 'text-slate-400'
                            }`}>
                              {numVal > 1 ? `+${((numVal - 1) * 100).toFixed(1)}%` : numVal < 1 ? `-${((1 - numVal) * 100).toFixed(1)}%` : 'base'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            value={edit?.notes ?? rate.notes ?? ''}
                            onChange={e => handleEdit(rate.id, 'notes', e.target.value)}
                            placeholder="Optional note…"
                            className="w-full form-input py-1.5 text-xs"
                          />
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          {isDirty ? (
                            <button onClick={() => handleSave(rate)} disabled={saving === rate.id}
                              className="btn-primary py-1.5 px-3 text-xs">
                              {saving === rate.id ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                              Save
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
