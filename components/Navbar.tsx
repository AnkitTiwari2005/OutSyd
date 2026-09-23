'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ArrowRight, Menu, X, Calculator, User, LogOut, Shield, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { startTopProgress } from '@/components/TopProgressBar';

// Animated nav link with sliding underline on hover
function NavLink({ href, children, isActive }: { href: string; children: React.ReactNode; isActive?: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-1.5 transition-colors pb-0.5 ${
        isActive
          ? 'text-[var(--accent-navy)] font-semibold'
          : 'text-[var(--text-muted)] hover:text-[var(--accent-navy)]'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <motion.span
        className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[var(--accent-navy)] origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isActive || hovered ? 1 : 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      />
    </Link>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobileSigningOut, setIsMobileSigningOut] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const headerRef = useRef<HTMLElement>(null);

  // Scroll-shrink shadow effect
  const { scrollY } = useScroll();
  const boxShadow = useTransform(
    scrollY,
    [0, 40],
    ['0 0 0 rgba(0,0,0,0)', '0 2px 16px rgba(30,45,78,0.10)']
  );

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const isEstimate = pathname.startsWith('/estimate');
  const loginHref =
    pathname && pathname !== '/' && !pathname.startsWith('/login') && !pathname.startsWith('/register')
      ? `/login?redirect=${encodeURIComponent(pathname)}`
      : '/login';

  return (
    <motion.header
      ref={headerRef}
      className="sticky top-0 z-40 h-16 bg-[var(--bg-card)] border-b border-[var(--border-color)]"
      style={{ boxShadow }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Logo priority />
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <NavLink href="/estimate" isActive={isEstimate}>
              <Calculator size={15} />
              Estimator
            </NavLink>
            <NavLink href="/#categories">18 Categories</NavLink>
            <NavLink href="/#how-it-works">Methodology</NavLink>
            <NavLink href="/#features">Accuracy &amp; Standards</NavLink>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {session?.user ? (
            <div className="hidden sm:block">
              <ProfileDropdown session={session} />
            </div>
          ) : (
            <Link
              href={loginHref}
              onClick={() => startTopProgress()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--accent-navy)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors"
            >
              Sign In
            </Link>
          )}

          {/* CTA */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/estimate" className="btn-primary">
              <span>Estimate Free</span>
              <ArrowRight size={14} />
            </Link>
          </motion.div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileOpen ? 'close' : 'open'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ display: 'block' }}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile Drawer — AnimatePresence for smooth enter/exit */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            role="navigation"
            aria-label="Mobile navigation"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
            className="md:hidden border-b border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-4 space-y-2 shadow-sm"
            onKeyDown={(e) => { if (e.key === 'Escape') setMobileOpen(false); }}
          >
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-color)] pb-2 mb-2">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Theme</span>
              <ThemeToggle />
            </div>

            <Link href="/estimate" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md">
              Estimator (18 Categories)
            </Link>
            <Link href="/#categories" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] rounded-md">
              18 Construction Categories
            </Link>
            <Link href="/#how-it-works" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] rounded-md">
              Methodology &amp; Standards
            </Link>

            {session?.user ? (
              <>
                <div className="px-3 py-2.5 border-t border-b border-[var(--border-color)] my-1 bg-[var(--bg-secondary)] rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--accent-navy)] to-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {(session.user.name || session.user.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {session.user.name || session.user.email}
                      </p>
                      {session.user.email && (
                        <p className="text-[10px] text-[var(--text-muted)] truncate">
                          {session.user.email}
                        </p>
                      )}
                    </div>
                    {session.user.role === 'admin' ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 shrink-0">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-muted)] text-[var(--text-muted)] shrink-0">
                        User
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => {
                    startTopProgress();
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--accent-navy)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors"
                >
                  <User size={16} />
                  <span>Dashboard &amp; Projects</span>
                </Link>

                {session.user.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => {
                      startTopProgress();
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 rounded-md transition-colors"
                  >
                    <Shield size={16} />
                    <span>Admin Console</span>
                  </Link>
                )}

                <button
                  type="button"
                  disabled={isMobileSigningOut}
                  onClick={async () => {
                    setIsMobileSigningOut(true);
                    startTopProgress();
                    await signOut({ callbackUrl: '/' });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--error-text)] hover:bg-[var(--error-bg)] rounded-md transition-colors text-left cursor-pointer disabled:opacity-50"
                >
                  {isMobileSigningOut ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Signing out…</span>
                    </>
                  ) : (
                    <>
                      <LogOut size={16} />
                      <span>Sign out</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <Link
                href={loginHref}
                onClick={() => {
                  startTopProgress();
                  setMobileOpen(false);
                }}
                className="block px-3 py-2 text-sm font-medium text-[var(--accent-navy)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors"
              >
                Sign In / Register
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
