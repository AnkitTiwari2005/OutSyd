export default function RootLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-10 h-10 rounded-full border-3 border-[var(--border-muted)] border-t-[var(--accent-navy)] animate-spin mb-4" />
      <p className="text-xs font-medium text-[var(--text-muted)] animate-pulse">Loading experience…</p>
    </div>
  );
}
