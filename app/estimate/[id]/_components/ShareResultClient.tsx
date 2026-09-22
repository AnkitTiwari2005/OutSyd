'use client';
// app/estimate/[id]/_components/ShareResultClient.tsx
// Client-side share, save, and PDF download buttons for the shareable page
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Share2, Download, Save, Loader2 } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { useEstimateStore } from '@/stores/estimate-store';

interface Props {
  estimateId : string;
  grandTotal : number;
}

export function ShareResultClient({ estimateId, grandTotal }: Props) {
  const router = useRouter();
  const { guestToken, estimateId: currentStoreId } = useEstimateStore();
  const [saving, setSaving]   = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName]       = useState('');

  useEffect(() => {
    if (!saveOpen) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSaveOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      prevActive?.focus?.();
    };
  }, [saveOpen]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!', { description: 'Anyone with this link can view the estimate.' });
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleDownload = () => {
    const guestParam = (estimateId === currentStoreId && guestToken) ? `?guestToken=${encodeURIComponent(guestToken)}` : '';
    const url = `/api/estimate/${estimateId}/report${guestParam}`;
    const a   = document.createElement('a');
    a.href    = url;
    a.download = `OUTSYD-Estimate-${estimateId.slice(0, 8)}.pdf`;
    a.click();
    toast.info('Generating PDF…', { description: 'Download will start in a moment.' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const activeGuestToken = (estimateId === currentStoreId && guestToken) ? guestToken : undefined;
      const res = await fetch(`/api/estimate/${estimateId}/save`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          projectName: name || 'Untitled Project',
          guestToken: activeGuestToken,
        }),
      });
      if (res.status === 401) {
        toast.info('Sign in to save', { action: { label: 'Sign In', onClick: () => router.push(`/login?redirect=/estimate/${estimateId}`) } });
        setSaveOpen(false);
        return;
      }
      if (!res.ok) throw new Error('Save failed');
      toast.success('Saved to your dashboard!', { action: { label: 'View Dashboard', onClick: () => router.push('/dashboard') } });
      setSaveOpen(false);
    } catch {
      toast.error('Could not save estimate. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button onClick={handleShare}   className="btn-secondary py-2 px-3.5 text-xs"><Share2 size={12} />Share</button>
        <button onClick={handleDownload} className="btn-secondary py-2 px-3.5 text-xs"><Download size={12} />PDF</button>
        <button onClick={() => setSaveOpen(true)} className="btn-primary py-2 px-3.5 text-xs"><Save size={12} />Save</button>
      </div>

      {/* Save dialog */}
      {saveOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-save-title"
          onClick={e => { if (e.target === e.currentTarget) setSaveOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        >
          <div className="card-md w-full max-w-sm p-6 slide-up">
            <h2 id="share-save-title" className="font-bold text-slate-800 mb-1">Save Estimate</h2>
            <p className="text-xs text-slate-400 mb-4">Give this project a name and save it to your dashboard.</p>
            <div className="mb-1">
              <p className="text-xs text-slate-500 mb-1">Total: <strong className="text-orange-600">{formatINR(grandTotal)}</strong></p>
            </div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. G+2 House — Bangalore"
              className="form-input mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setSaveOpen(false)} className="btn-secondary flex-1 py-2.5">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
