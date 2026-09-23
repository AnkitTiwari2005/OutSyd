'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import {
  LayoutDashboard,
  Calculator,
  Shield,
  LogOut,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { startTopProgress } from '@/components/TopProgressBar';

interface ProfileDropdownProps {
  session: Session;
}

export function ProfileDropdown({ session }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = session.user;
  const userName = user?.name || user?.email || 'User';
  const userEmail = user?.email || '';
  const isAdmin = user?.role === 'admin';
  const initial = (userName.trim()[0] || 'U').toUpperCase();

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNavClick = () => {
    startTopProgress();
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    startTopProgress();
    try {
      await signOut({ callbackUrl: '/' });
    } finally {
      // If signOut navigation completes, page unmounts; keep indicator active
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button — Instant 0ms response */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="User profile menu"
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 ${
          isOpen
            ? 'bg-[var(--accent-navy-subtle)] border-[var(--accent-navy)] ring-2 ring-[var(--accent-navy)]/20 text-[var(--accent-navy)]'
            : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--border-muted)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]'
        }`}
      >
        {/* Avatar badge with initial */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[var(--accent-navy)] to-slate-700 text-white flex items-center justify-center text-xs font-bold shadow-xs">
          {initial}
        </div>

        {/* User name truncated */}
        <span className="text-xs font-semibold max-w-[110px] sm:max-w-[140px] truncate hidden sm:inline-block text-left">
          {userName}
        </span>

        {/* Chevron that smoothly rotates */}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="text-[var(--text-muted)] flex items-center"
        >
          <ChevronDown size={13} strokeWidth={2.5} />
        </motion.span>
      </button>

      {/* Dropdown Menu Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            role="menu"
            aria-orientation="vertical"
            className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl z-50 overflow-hidden focus:outline-none"
          >
            {/* User Info Header */}
            <div className="p-3.5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--accent-navy)] to-slate-800 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {userName}
                    </p>
                    {isAdmin ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
                        Admin
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-card)] border border-[var(--border-muted)] text-[var(--text-muted)]">
                        Account
                      </span>
                    )}
                  </div>
                  {userEmail && (
                    <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5" title={userEmail}>
                      {userEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Options */}
            <div className="p-1.5 space-y-0.5">
              {/* Dashboard */}
              <Link
                href="/dashboard"
                role="menuitem"
                onClick={handleNavClick}
                className="flex items-start gap-2.5 px-3 py-2 text-xs rounded-lg text-[var(--text-primary)] hover:bg-[var(--accent-navy-subtle)] hover:text-[var(--accent-navy)] transition-colors group cursor-pointer"
              >
                <LayoutDashboard size={15} className="mt-0.5 text-[var(--text-muted)] group-hover:text-[var(--accent-navy)] transition-colors shrink-0" />
                <div>
                  <div className="font-semibold">Dashboard &amp; Projects</div>
                  <div className="text-[10px] text-[var(--text-muted)]">View saved BOQ estimates</div>
                </div>
              </Link>

              {/* New Estimate */}
              <Link
                href="/estimate"
                role="menuitem"
                onClick={handleNavClick}
                className="flex items-start gap-2.5 px-3 py-2 text-xs rounded-lg text-[var(--text-primary)] hover:bg-[var(--accent-navy-subtle)] hover:text-[var(--accent-navy)] transition-colors group cursor-pointer"
              >
                <Calculator size={15} className="mt-0.5 text-[var(--text-muted)] group-hover:text-[var(--accent-navy)] transition-colors shrink-0" />
                <div>
                  <div className="font-semibold">New Calculation</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Run 18-category BOQ</div>
                </div>
              </Link>

              {/* Admin console link if admin */}
              {isAdmin && (
                <Link
                  href="/admin"
                  role="menuitem"
                  onClick={handleNavClick}
                  className="flex items-start gap-2.5 px-3 py-2 text-xs rounded-lg text-orange-800 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors group cursor-pointer"
                >
                  <Shield size={15} className="mt-0.5 text-orange-600 dark:text-orange-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Admin Console</div>
                    <div className="text-[10px] text-orange-700/80 dark:text-orange-400/80">Rates &amp; coefficients datasets</div>
                  </div>
                </Link>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--border-color)] my-1" />

            {/* Sign Out Button */}
            <div className="p-1.5">
              <button
                type="button"
                role="menuitem"
                disabled={isSigningOut}
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--error-text)] hover:bg-[var(--error-bg)] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSigningOut ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-[var(--error-text)] shrink-0" />
                    <span>Signing out…</span>
                  </>
                ) : (
                  <>
                    <LogOut size={14} className="shrink-0" />
                    <span>Sign out</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
