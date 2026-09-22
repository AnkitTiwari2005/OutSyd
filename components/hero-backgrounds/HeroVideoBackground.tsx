'use client';

import React, { useEffect, useRef } from 'react';

export function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Slow cinematic speed for architectural elegance
    video.playbackRate = 0.65;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy prevented playback, video shows first frame
      });
    }
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* ── Engineering Construction Video ──────────────────────── */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover object-center filter contrast-[1.05] brightness-[1.05] dark:contrast-[1.20] dark:brightness-[0.44] saturate-[0.6] dark:saturate-[0.85] transition-all duration-700"
      >
        <source src="/videos/engineering-construction.webm" type="video/webm" />
      </video>

      {/* ── Light Mode Architectural Veil (Prevents Dark Smudges) ─ */}
      {/* In light mode, applies an elegant semi-transparent architectural veil so video acts as an architectural watermark */}
      <div className="absolute inset-0 bg-white/75 dark:bg-transparent transition-colors duration-500" />

      {/* ── Engineering Technical HUD Grid Overlay ─────────────── */}
      <div
        className="absolute inset-0 opacity-15 dark:opacity-25 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(30, 58, 95, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30, 58, 95, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Engineering Telemetry Badges ─────────────────────────── */}
      <div className="absolute top-4 left-6 hidden sm:flex items-center gap-2 font-mono text-[10px] tracking-wider text-sky-700/70 dark:text-sky-400/60 uppercase">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Structural Erection Timelapse · 24 FPS</span>
      </div>

      <div className="absolute top-4 right-6 hidden sm:flex items-center gap-3 font-mono text-[10px] tracking-wider text-slate-600/70 dark:text-slate-400/50 uppercase">
        <span>Heavy Steel Truss</span>
        <span>·</span>
        <span>IS 1200 / CPWD 2024</span>
      </div>

      <div className="absolute bottom-6 left-6 hidden sm:flex items-center gap-3 font-mono text-[10px] tracking-wider text-slate-600/60 dark:text-slate-400/40">
        <span>LAT 28.6139° N</span>
        <span>·</span>
        <span>LONG 77.2090° E</span>
        <span>·</span>
        <span>CRANE TC-01 / TC-02</span>
      </div>

      {/* ── High-Clarity Center Text Isolation & Vignette Mask ───── */}
      {/* Light Mode: Soft pure white center gradient provides 100% pristine contrast for navy text */}
      {/* Dark Mode: Pure obsidian center gradient provides 100% razor-sharp contrast for white text */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 40%,
              var(--bg-primary) 0%,
              var(--bg-primary) 35%,
              transparent 78%
            )
          `,
          opacity: 0.90,
        }}
      />

      {/* Edge Blends to Page Background */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[var(--bg-primary)] to-transparent" />
    </div>
  );
}
