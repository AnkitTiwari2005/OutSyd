import { Logo } from '@/components/Logo';

export default function ProjectDetailLoading() {
  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">
      {/* Top nav */}
      <nav className="bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 py-3 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="skeleton w-6 h-6 rounded" />
            <Logo width={90} height={26} className="h-6 w-auto" priority />
            <span className="text-[var(--text-muted)]">/</span>
            <div className="skeleton h-4 w-32 rounded" />
          </div>
          <div className="skeleton h-8 w-28 rounded-md" />
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="skeleton h-8 w-64 rounded-md" />
            <div className="skeleton h-4 w-44 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="skeleton h-9 w-28 rounded-md" />
            <div className="skeleton h-9 w-28 rounded-md" />
          </div>
        </div>

        {/* 4 Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-standard p-5 bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-7 w-32 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
          ))}
        </div>

        {/* Table placeholder */}
        <div className="card-standard p-6 bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
          <div className="skeleton h-5 w-48 rounded" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                  <div className="skeleton w-3 h-3 rounded-full" />
                  <div className="skeleton h-4 w-36 rounded" />
                </div>
                <div className="skeleton h-4 w-20 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
