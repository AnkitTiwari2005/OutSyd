// instrumentation.ts — Next.js server instrumentation hook
// N-1: Validates runtime environment configuration on server boot

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Avoid failing static analysis / build sandbox if env is not provided at build-time
    if (process.env.NEXT_PHASE === 'phase-production-build' && !process.env.DATABASE_URL) {
      return;
    }
    const { validateEnv } = await import('@/lib/env');
    validateEnv();
  }
}
