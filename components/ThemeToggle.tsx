'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 ${className}`} />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
      className={`relative p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors duration-200 flex items-center justify-center ${className}`}
    >
      {theme === 'dark' ? (
        <Sun size={18} className="text-amber-400 animate-in fade-in transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon size={18} className="text-slate-700 animate-in fade-in transition-transform duration-200 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
