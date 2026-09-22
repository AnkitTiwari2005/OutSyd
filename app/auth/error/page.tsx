'use client';

// app/auth/error/page.tsx — Authentication Error Handler
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { AlertTriangle, ArrowLeft, LogIn } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Server Configuration Error',
    description: 'There is a problem with the server authentication configuration. Please contact the administrator.',
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to access this resource.',
  },
  Verification: {
    title: 'Verification Link Expired',
    description: 'The verification token has expired or has already been used. Please request a new sign-in link.',
  },
  CredentialsSignin: {
    title: 'Invalid Credentials',
    description: 'The email or password you entered is incorrect. Please verify your credentials and try again.',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An unexpected authentication error occurred. Please try signing in again.',
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorKey = searchParams?.get('error') ?? 'Default';
  const errorInfo = ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.Default;

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-6">
        <Link href="/" className="inline-block mb-4">
          <Logo width={120} height={30} className="h-7 w-auto mx-auto" priority />
        </Link>
      </div>

      <div className="card-standard p-6 sm:p-8 bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--error-bg)] border border-[var(--error-border)] flex items-center justify-center mx-auto mb-4 text-[var(--error-text)]">
          <AlertTriangle size={24} />
        </div>

        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">{errorInfo.title}</h1>
        <p className="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">{errorInfo.description}</p>

        <div className="space-y-3">
          <Link
            href="/login"
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
          >
            <LogIn size={15} />
            <span>Return to Sign In</span>
          </Link>

          <Link
            href="/"
            className="btn-secondary w-full py-2 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <main className="relative min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)] flex flex-col items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Suspense
        fallback={
          <div className="text-xs text-[var(--text-muted)]">Loading authentication status…</div>
        }
      >
        <AuthErrorContent />
      </Suspense>
    </main>
  );
}
