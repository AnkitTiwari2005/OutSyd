import { Logo } from '@/components/Logo';

export default function SharedEstimateLoading() {
  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">
      {/* Top bar */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-0 z-30 px-4 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <Logo width={110} height={32} className="h-8 w-auto" priority />
          <div className="flex items-center gap-2">
            <div className="skeleton h-8 w-16 rounded-md" />
            <div className="skeleton h-8 w-16 rounded-md" />
            <div className="skeleton h-8 w-24 rounded-md" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Banner skeleton */}
        <div className="skeleton h-12 w-full rounded-xl" />

        {/* Hero total skeleton */}
        <div className="card-standard p-6 bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-10 w-64 rounded-md" />
            </div>
            <div className="flex gap-4">
              <div className="skeleton h-12 w-28 rounded-lg" />
              <div className="skeleton h-12 w-28 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Breakdown skeleton */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-standard p-6 bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
            <div className="skeleton h-5 w-44 rounded" />
            <div className="skeleton h-48 w-full rounded-lg" />
          </div>
          <div className="card-standard p-6 bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
            <div className="skeleton h-5 w-44 rounded" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-1.5 py-1">
                <div className="flex justify-between">
                  <div className="skeleton h-3.5 w-32 rounded" />
                  <div className="skeleton h-3.5 w-16 rounded" />
                </div>
                <div className="skeleton h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
