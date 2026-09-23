import { Logo } from '@/components/Logo';

export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">
      {/* Top Nav */}
      <nav className="bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 py-3 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo width={110} height={32} className="h-8 w-auto" priority />
            <span className="badge-orange text-[10px]">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="skeleton h-4 w-28 rounded" />
            <div className="skeleton h-7 w-24 rounded-md" />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <div className="skeleton h-8 w-44 rounded-md" />

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-standard p-5 bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
              <div className="flex items-start justify-between">
                <div className="skeleton w-6 h-6 rounded" />
              </div>
              <div className="skeleton h-8 w-20 rounded" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>
          ))}
        </div>

        {/* Table placeholder */}
        <div className="card-standard p-6 bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
          <div className="skeleton h-5 w-40 rounded" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-4 w-24 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
