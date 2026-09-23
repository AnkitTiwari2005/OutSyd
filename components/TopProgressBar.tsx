'use client';

import { useEffect, useState, useRef, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function startTopProgress() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('outsyd:navigation-start'));
  }
}

export function stopTopProgress() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('outsyd:navigation-complete'));
  }
}

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const isRunningRef = useRef(false);
  const [, startTransition] = useTransition();

  // Complete progress whenever route or query string changes
  useEffect(() => {
    stopTopProgress();
  }, [pathname, searchParams]);

  // Handle custom events and global link clicks
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let safetyTimeoutId: NodeJS.Timeout | null = null;

    const start = () => {
      isRunningRef.current = true;
      if (intervalId) clearInterval(intervalId);
      if (safetyTimeoutId) clearTimeout(safetyTimeoutId);

      setVisible(true);
      setProgress(25);

      intervalId = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 88) return prev;
          const increment = Math.max(1, (90 - prev) * 0.15);
          return Math.min(prev + increment, 88);
        });
      }, 120);

      // Auto-recover if navigation was aborted or took longer than 8 seconds
      safetyTimeoutId = setTimeout(() => {
        if (intervalId) clearInterval(intervalId);
        setProgress(100);
        setTimeout(() => {
          setVisible(false);
          setProgress(0);
          isRunningRef.current = false;
        }, 200);
      }, 8000);
    };

    const complete = () => {
      if (!isRunningRef.current) return;
      isRunningRef.current = false;
      if (intervalId) clearInterval(intervalId);
      if (safetyTimeoutId) clearTimeout(safetyTimeoutId);

      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    };

    const handleCustomStart = () => start();
    const handleCustomComplete = () => complete();

    // Intercept clicks on internal links to start progress instantly
    const handleClick = (e: MouseEvent) => {
      // Don't intercept if modifier keys are pressed (opens in new tab)
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }

      const target = (e.target as HTMLElement | null)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Ignore external, download, tel, mailto, target="_blank", or hash-only links
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        target.getAttribute('target') === '_blank' ||
        target.hasAttribute('download')
      ) {
        return;
      }

      // Check if navigating to a different pathname/search
      const currentFullUrl = window.location.pathname + window.location.search;
      if (href !== currentFullUrl && !href.startsWith(`${window.location.pathname}#`)) {
        startTransition(() => {
          start();
        });
      }
    };

    window.addEventListener('outsyd:navigation-start', handleCustomStart);
    window.addEventListener('outsyd:navigation-complete', handleCustomComplete);
    document.addEventListener('click', handleClick, true);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
      window.removeEventListener('outsyd:navigation-start', handleCustomStart);
      window.removeEventListener('outsyd:navigation-complete', handleCustomComplete);
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-label="Page loading progress"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="h-[3px] transition-all ease-out"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #f97316 0%, #ea580c 60%, #fbbf24 100%)',
          boxShadow: '0 0 10px rgba(249, 115, 22, 0.7), 0 0 5px rgba(234, 88, 12, 0.8)',
          transitionDuration: progress === 100 ? '150ms' : '220ms',
        }}
      >
        {/* Leading edge glow sparkle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-24 opacity-80"
          style={{
            background: 'radial-gradient(ellipse at right, rgba(251, 191, 36, 0.8) 0%, rgba(249, 115, 22, 0) 70%)',
          }}
        />
      </div>
    </div>
  );
}
