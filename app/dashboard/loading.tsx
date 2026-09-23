import { Logo } from '@/components/Logo';

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">
      {/* Top Navbar Skeleton */}
      <header className="h-16 bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <Logo width={105} height={26} className="h-6 w-auto" priority />
          <div className="flex items-center gap-3">
            <div className="skeleton h-8 w-28 rounded-md" />
            <div className="skeleton h-8 w-8 rounded-md" />
            <div className="skeleton h-8 w-16 rounded-md" />
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="skeleton h-7 w-56 rounded-md" />
            <div className="skeleton h-4 w-40 rounded-md" />
          </div>
          <div className="skeleton h-9 w-36 rounded-md" />
        </div>

        {/* Project cards skeleton grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="card-standard p-5 bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="skeleton w-8 h-8 rounded-md" />
                <div className="skeleton h-3 w-16 rounded" />
              </div>
              <div className="space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
                <div className="skeleton h-3 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
