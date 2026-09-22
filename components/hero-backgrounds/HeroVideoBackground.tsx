'use client';

import React, { useEffect, useRef } from 'react';

export function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set slow cinematic speed for architectural elegance
    video.playbackRate = 0.65;

    // Robust autoplay handling
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy prevented playback, video will show poster/first frame
      });
    }
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* ── Cinematic Video Element ──────────────────────────────── */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover object-center filter contrast-[1.12] brightness-[0.55] dark:brightness-[0.42] saturate-[0.85] transition-all duration-700"
      >
        <source src="/videos/city-timelapse.webm" type="video/webm" />
      </video>

      {/* ── Architectural Engineering HUD Grid Overlay ─────────── */}
      <div
        className="absolute inset-0 opacity-20 dark:opacity-30 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(56, 189, 248, 0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Architectural Camera HUD Badges ──────────────────────── */}
      <div className="absolute top-4 left-6 hidden sm:flex items-center gap-2 font-mono text-[10px] tracking-wider text-sky-600/70 dark:text-sky-400/60 uppercase">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>4K Architectural Reel · 24 FPS</span>
      </div>

      <div className="absolute top-4 right-6 hidden sm:flex items-center gap-3 font-mono text-[10px] tracking-wider text-slate-500/70 dark:text-slate-400/50 uppercase">
        <span>Sector IV</span>
        <span>·</span>
        <span>IS 1200 / CPWD 2024</span>
      </div>

      <div className="absolute bottom-6 left-6 hidden sm:flex items-center gap-3 font-mono text-[10px] tracking-wider text-slate-500/60 dark:text-slate-400/40">
        <span>LAT 28.6139° N</span>
        <span>·</span>
        <span>LONG 77.2090° E</span>
        <span>·</span>
        <span>ELEV +216m</span>
      </div>

      {/* ── High-Contrast Radial Vignette Mask ───────────────────── */}
      {/* Ensures center headline, subtitle, CTA, and estimate card remain 100% readable */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, transparent 15%, var(--bg-primary) 82%)',
        }}
      />
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[var(--bg-primary)]/80 to-transparent" />
    </div>
  );
}
