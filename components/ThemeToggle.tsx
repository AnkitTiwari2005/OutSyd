'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        callback();
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', callback);

  return () => {
    window.removeEventListener('storage', callback);
    observer.disconnect();
    mediaQuery.removeEventListener('change', callback);
  };
}

function getSnapshot(): 'light' | 'dark' {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  if (currentTheme === 'dark' || currentTheme === 'light') {
    return currentTheme;
  }
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function getServerSnapshot(): 'light' | 'dark' {
  return 'light';
}

const emptySubscribe = () => () => {};

export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('outsyd-theme', nextTheme);
    } catch {
      // Ignore localStorage write failures (e.g. private mode)
    }
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-navy-subtle)] hover:border-[var(--border-muted)] transition-colors cursor-pointer ${className}`}
      aria-label={isClient ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Toggle theme'}
      title={isClient ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Toggle theme'}
    >
      {isClient && theme === 'dark' ? (
        <Sun size={15} className="text-amber-400" />
      ) : (
        <Moon size={15} className="text-[var(--accent-navy)]" />
      )}
    </button>
  );
}

