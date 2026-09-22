'use client';

import React, { useEffect, useRef } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Polygon3D {
  points: Point3D[];
  type: 'slab-top' | 'slab-front' | 'slab-side' | 'glass' | 'wall' | 'pergola' | 'column';
  colorDark: string;
  colorLight: string;
  strokeDark: string;
  strokeLight: string;
  avgZ?: number;
}

export function HeroSolidBuildingBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Theme state
    let isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const themeObserver = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      isDark = currentTheme === 'dark' || (!currentTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Build 3D Architectural Massing Geometry ────────────────────
    const polygons: Polygon3D[] = [];

    // Helper to generate a solid extruded floor slab box
    const addSlab = (
      minX: number, maxX: number,
      minY: number, maxY: number,
      bottomZ: number, topZ: number,
      accent = false
    ) => {
      // Top face
      polygons.push({
        points: [
          { x: minX, y: minY, z: topZ },
          { x: maxX, y: minY, z: topZ },
          { x: maxX, y: maxY, z: topZ },
          { x: minX, y: maxY, z: topZ },
        ],
        type: 'slab-top',
        colorDark: accent ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.70)',
        colorLight: accent ? 'rgba(14, 165, 233, 0.18)' : 'rgba(241, 245, 249, 0.85)',
        strokeDark: 'rgba(56, 189, 248, 0.40)',
        strokeLight: 'rgba(30, 58, 95, 0.30)',
      });

      // Front face (facing positive Y)
      polygons.push({
        points: [
          { x: minX, y: maxY, z: bottomZ },
          { x: maxX, y: maxY, z: bottomZ },
          { x: maxX, y: maxY, z: topZ },
          { x: minX, y: maxY, z: topZ },
        ],
        type: 'slab-front',
        colorDark: 'rgba(15, 23, 42, 0.85)',
        colorLight: 'rgba(226, 232, 240, 0.90)',
        strokeDark: 'rgba(56, 189, 248, 0.35)',
        strokeLight: 'rgba(30, 58, 95, 0.25)',
      });

      // Side face (facing positive X)
      polygons.push({
        points: [
          { x: maxX, y: minY, z: bottomZ },
          { x: maxX, y: maxY, z: bottomZ },
          { x: maxX, y: maxY, z: topZ },
          { x: maxX, y: minY, z: topZ },
        ],
        type: 'slab-side',
        colorDark: 'rgba(30, 41, 59, 0.80)',
        colorLight: 'rgba(203, 213, 225, 0.90)',
        strokeDark: 'rgba(56, 189, 248, 0.35)',
        strokeLight: 'rgba(30, 58, 95, 0.25)',
      });
    };

    // Helper for Glass Facade Curtain Walls with horizontal mullions
    const addGlassFacade = (
      p1: Point3D, p2: Point3D, p3: Point3D, p4: Point3D
    ) => {
      polygons.push({
        points: [p1, p2, p3, p4],
        type: 'glass',
        colorDark: 'rgba(56, 189, 248, 0.12)',
        colorLight: 'rgba(14, 165, 233, 0.09)',
        strokeDark: 'rgba(56, 189, 248, 0.25)',
        strokeLight: 'rgba(14, 165, 233, 0.20)',
      });
    };

    // ── Generate Multi-Tier Stepped Building Architecture ─────────
    const storyH = 1.4;
    const slabThickness = 0.18;

    // Floor 0: Ground Foundation Plinth (Extra wide)
    addSlab(-4.0, 4.0, -3.2, 3.2, -0.25, 0.0);

    // Floor 1 (Ground Story Slabs & Facades)
    addSlab(-3.6, 3.6, -2.8, 2.8, storyH - slabThickness, storyH);
    // Ground Glass Facade
    addGlassFacade(
      { x: -3.5, y: 2.7, z: 0.0 }, { x: 3.5, y: 2.7, z: 0.0 },
      { x: 3.5, y: 2.7, z: storyH - slabThickness }, { x: -3.5, y: 2.7, z: storyH - slabThickness }
    );
    addGlassFacade(
      { x: 3.5, y: -2.7, z: 0.0 }, { x: 3.5, y: 2.7, z: 0.0 },
      { x: 3.5, y: 2.7, z: storyH - slabThickness }, { x: 3.5, y: -2.7, z: storyH - slabThickness }
    );

    // Floor 2 (Level 1 with Dramatic Cantilevered Balcony toward front)
    const f2Bottom = storyH * 2 - slabThickness;
    const f2Top = storyH * 2;
    // Main slab with cantilever extension to y = 3.6
    addSlab(-3.6, 3.6, -2.8, 3.6, f2Bottom, f2Top, true);
    // Glass Balustrade on cantilevered balcony
    addGlassFacade(
      { x: -3.6, y: 3.6, z: f2Top }, { x: 3.6, y: 3.6, z: f2Top },
      { x: 3.6, y: 3.6, z: f2Top + 0.45 }, { x: -3.6, y: 3.6, z: f2Top + 0.45 }
    );
    // Level 1 Glass Facades
    addGlassFacade(
      { x: -3.5, y: 2.5, z: storyH }, { x: 3.5, y: 2.5, z: storyH },
      { x: 3.5, y: 2.5, z: f2Bottom }, { x: -3.5, y: 2.5, z: f2Bottom }
    );
    addGlassFacade(
      { x: 3.5, y: -2.7, z: storyH }, { x: 3.5, y: 2.5, z: storyH },
      { x: 3.5, y: 2.5, z: f2Bottom }, { x: 3.5, y: -2.7, z: f2Bottom }
    );

    // Floor 3 (Level 2 with Stepped Architectural Setback)
    const f3Bottom = storyH * 3 - slabThickness;
    const f3Top = storyH * 3;
    // Setback on X and Y creates an open terrace
    addSlab(-2.6, 2.6, -2.8, 1.8, f3Bottom, f3Top);
    addGlassFacade(
      { x: -2.5, y: 1.7, z: f2Top }, { x: 2.5, y: 1.7, z: f2Top },
      { x: 2.5, y: 1.7, z: f3Bottom }, { x: -2.5, y: 1.7, z: f3Bottom }
    );
    addGlassFacade(
      { x: 2.5, y: -2.7, z: f2Top }, { x: 2.5, y: 1.7, z: f2Top },
      { x: 2.5, y: 1.7, z: f3Bottom }, { x: 2.5, y: -2.7, z: f3Bottom }
    );

    // Floor 4 (Rooftop Terrace & Mechanical Penthouse)
    const f4Bottom = storyH * 4 - slabThickness;
    const f4Top = storyH * 4;
    // Penthouse Core
    addSlab(-1.5, 1.5, -2.0, 0.8, f4Bottom, f4Top, true);
    addGlassFacade(
      { x: -1.4, y: 0.7, z: f3Top }, { x: 1.4, y: 0.7, z: f3Top },
      { x: 1.4, y: 0.7, z: f4Bottom }, { x: -1.4, y: 0.7, z: f4Bottom }
    );

    // Rooftop Pergola Trellis Slats (Architectural Louvers)
    for (let lx = -2.4; lx <= 2.4; lx += 0.6) {
      polygons.push({
        points: [
          { x: lx, y: 0.9, z: f4Top + 0.3 },
          { x: lx + 0.15, y: 0.9, z: f4Top + 0.3 },
          { x: lx + 0.15, y: 1.9, z: f4Top + 0.3 },
          { x: lx, y: 1.9, z: f4Top + 0.3 },
        ],
        type: 'pergola',
        colorDark: 'rgba(245, 158, 11, 0.40)',
        colorLight: 'rgba(217, 119, 6, 0.40)',
        strokeDark: 'rgba(245, 158, 11, 0.60)',
        strokeLight: 'rgba(217, 119, 6, 0.55)',
      });
    }

    // Glowing Twilight Windows: 12 illuminated window panels
    interface WindowLight {
      p1: Point3D;
      p2: Point3D;
      p3: Point3D;
      p4: Point3D;
      pulseOffset: number;
    }

    const warmWindows: WindowLight[] = [
      // Ground floor windows
      { p1: { x: -3.0, y: 2.71, z: 0.3 }, p2: { x: -2.0, y: 2.71, z: 0.3 }, p3: { x: -2.0, y: 2.71, z: 1.0 }, p4: { x: -3.0, y: 2.71, z: 1.0 }, pulseOffset: 0.2 },
      { p1: { x: 0.5, y: 2.71, z: 0.3 }, p2: { x: 1.8, y: 2.71, z: 0.3 }, p3: { x: 1.8, y: 2.71, z: 1.0 }, p4: { x: 0.5, y: 2.71, z: 1.0 }, pulseOffset: 1.1 },
      // Level 1 windows
      { p1: { x: -3.0, y: 2.51, z: storyH + 0.3 }, p2: { x: -1.6, y: 2.51, z: storyH + 0.3 }, p3: { x: -1.6, y: 2.51, z: storyH + 1.0 }, p4: { x: -3.0, y: 2.51, z: storyH + 1.0 }, pulseOffset: 0.7 },
      { p1: { x: 1.2, y: 2.51, z: storyH + 0.3 }, p2: { x: 2.8, y: 2.51, z: storyH + 0.3 }, p3: { x: 2.8, y: 2.51, z: storyH + 1.0 }, p4: { x: 1.2, y: 2.51, z: storyH + 1.0 }, pulseOffset: 2.4 },
      // Level 2 setback windows
      { p1: { x: -2.0, y: 1.71, z: storyH * 2 + 0.3 }, p2: { x: -0.6, y: 1.71, z: storyH * 2 + 0.3 }, p3: { x: -0.6, y: 1.71, z: storyH * 2 + 1.0 }, p4: { x: -2.0, y: 1.71, z: storyH * 2 + 1.0 }, pulseOffset: 1.8 },
      { p1: { x: 0.4, y: 1.71, z: storyH * 2 + 0.3 }, p2: { x: 1.8, y: 1.71, z: storyH * 2 + 0.3 }, p3: { x: 1.8, y: 1.71, z: storyH * 2 + 1.0 }, p4: { x: 0.4, y: 1.71, z: storyH * 2 + 1.0 }, pulseOffset: 0.5 },
      // Side elevation windows
      { p1: { x: 3.51, y: -1.8, z: 0.3 }, p2: { x: 3.51, y: -0.6, z: 0.3 }, p3: { x: 3.51, y: -0.6, z: 1.0 }, p4: { x: 3.51, y: -1.8, z: 1.0 }, pulseOffset: 3.1 },
      { p1: { x: 3.51, y: 0.4, z: 0.3 }, p2: { x: 3.51, y: 1.6, z: 0.3 }, p3: { x: 3.51, y: 1.6, z: 1.0 }, p4: { x: 3.51, y: 0.4, z: 1.0 }, pulseOffset: 1.5 },
      { p1: { x: 3.51, y: -1.8, z: storyH + 0.3 }, p2: { x: 3.51, y: -0.6, z: storyH + 0.3 }, p3: { x: 3.51, y: -0.6, z: storyH + 1.0 }, p4: { x: 3.51, y: -1.8, z: storyH + 1.0 }, pulseOffset: 2.0 },
    ];

    // ── Mouse & Camera Orbit ───────────────────────────────────────
    let angleY = 0.82; // Isometric azimuth (~47 deg)
    let angleX = 0.42; // Isometric elevation pitch (~24 deg)
    let targetAngleY = angleY;
    let targetAngleX = angleX;
    let animTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseRelX = (e.clientX - rect.left) / rect.width - 0.5;
      const mouseRelY = (e.clientY - rect.top) / rect.height - 0.5;

      targetAngleY = 0.82 + mouseRelX * 0.40;
      targetAngleX = 0.42 - mouseRelY * 0.20;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    // ── Projection Math ───────────────────────────────────────────
    const project = (
      p: Point3D,
      cosY: number, sinY: number,
      cosX: number, sinX: number,
      scale: number, cx: number, cy: number
    ) => {
      // Rotate around Z axis (azimuth)
      const rx = p.x * cosY - p.y * sinY;
      const ry = p.x * sinY + p.y * cosY;
      const rz = p.z;

      // Rotate around horizontal axis (elevation pitch)
      const screenX = cx + rx * scale;
      const screenY = cy - (rz * cosX - ry * sinX) * scale;
      const depth = ry * cosX + rz * sinX;

      return { x: screenX, y: screenY, depth };
    };

    // ── Render Loop ────────────────────────────────────────────────
    const render = () => {
      animTime += 0.02;

      if (!prefersReducedMotion) {
        angleY += (targetAngleY - angleY) * 0.05;
        angleX += (targetAngleX - angleX) * 0.05;
        targetAngleY += 0.0007; // Slow graceful ambient orbit
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const scale = Math.min(width, height) * 0.088;
      const cx = width * 0.5;
      const cy = height * 0.54;

      // ── 1. Ground Plaza Datum Grid ───────────────────────────────
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.04)' : 'rgba(30, 58, 95, 0.04)';
      ctx.lineWidth = 1;
      const gSpan = 7.0;
      const gStep = 1.4;
      ctx.beginPath();
      for (let gx = -gSpan; gx <= gSpan; gx += gStep) {
        const p1 = project({ x: gx, y: -gSpan, z: -0.25 }, cosY, sinY, cosX, sinX, scale, cx, cy);
        const p2 = project({ x: gx, y: gSpan, z: -0.25 }, cosY, sinY, cosX, sinX, scale, cx, cy);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      for (let gy = -gSpan; gy <= gSpan; gy += gStep) {
        const p1 = project({ x: -gSpan, y: gy, z: -0.25 }, cosY, sinY, cosX, sinX, scale, cx, cy);
        const p2 = project({ x: gSpan, y: gy, z: -0.25 }, cosY, sinY, cosX, sinX, scale, cx, cy);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();

      // ── 2. Sort Solid Polygons (Painter's Algorithm) ──────────────
      const projectedPolys = polygons.map(poly => {
        const projPoints = poly.points.map(p =>
          project(p, cosY, sinY, cosX, sinX, scale, cx, cy)
        );
        const avgDepth = projPoints.reduce((sum, pt) => sum + pt.depth, 0) / projPoints.length;
        return {
          ...poly,
          projPoints,
          avgDepth,
        };
      });

      // Sort from back to front
      projectedPolys.sort((a, b) => a.avgDepth - b.avgDepth);

      // Render Polygons
      projectedPolys.forEach(poly => {
        ctx.beginPath();
        ctx.moveTo(poly.projPoints[0].x, poly.projPoints[0].y);
        for (let i = 1; i < poly.projPoints.length; i++) {
          ctx.lineTo(poly.projPoints[i].x, poly.projPoints[i].y);
        }
        ctx.closePath();

        ctx.fillStyle = isDark ? poly.colorDark : poly.colorLight;
        ctx.fill();

        ctx.strokeStyle = isDark ? poly.strokeDark : poly.strokeLight;
        ctx.lineWidth = poly.type === 'glass' ? 0.75 : 1.25;
        ctx.stroke();
      });

      // ── 3. Render Glowing Twilight Windows ────────────────────────
      warmWindows.forEach(win => {
        const p1 = project(win.p1, cosY, sinY, cosX, sinX, scale, cx, cy);
        const p2 = project(win.p2, cosY, sinY, cosX, sinX, scale, cx, cy);
        const p3 = project(win.p3, cosY, sinY, cosX, sinX, scale, cx, cy);
        const p4 = project(win.p4, cosY, sinY, cosX, sinX, scale, cx, cy);

        // Check surface orientation facing camera
        const area = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
        if (area > 0) {
          const glowAlpha = 0.55 + Math.sin(animTime * 1.5 + win.pulseOffset) * 0.15;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.closePath();

          ctx.fillStyle = isDark
            ? `rgba(245, 158, 11, ${glowAlpha * 0.7})`
            : `rgba(217, 119, 6, ${glowAlpha * 0.5})`;
          ctx.fill();

          ctx.strokeStyle = isDark ? '#F59E0B' : '#D97706';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // ── 4. Rooftop Aviation Warning Beacon ────────────────────────
      const beaconPt = project({ x: 0, y: -0.6, z: f4Top + 0.6 }, cosY, sinY, cosX, sinX, scale, cx, cy);
      const beaconBlink = (Math.sin(animTime * 4) + 1) * 0.5;
      ctx.fillStyle = `rgba(239, 68, 68, ${beaconBlink * 0.9})`;
      ctx.beginPath();
      ctx.arc(beaconPt.x, beaconPt.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Subtle beacon halo
      ctx.fillStyle = `rgba(239, 68, 68, ${beaconBlink * 0.25})`;
      ctx.beginPath();
      ctx.arc(beaconPt.x, beaconPt.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // ── 5. Architectural Level Annotations ────────────────────────
      if (width > 700) {
        ctx.font = '9px monospace';
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.30)' : 'rgba(30, 58, 95, 0.40)';
        ctx.textAlign = 'right';

        const datums = [
          { label: 'PENTHOUSE +12.4m', z: f4Top },
          { label: 'TERRACE +8.8m', z: f3Top },
          { label: 'CANTILEVER +5.6m', z: f2Top },
          { label: 'GROUND PLINTH +0.0m', z: 0.0 },
        ];

        datums.forEach(d => {
          const pt = project({ x: -4.2, y: 0, z: d.z }, cosY, sinY, cosX, sinX, scale, cx, cy);
          ctx.fillText(d.label, pt.x - 15, pt.y + 3);
          ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.20)' : 'rgba(30, 58, 95, 0.25)';
          ctx.beginPath();
          ctx.moveTo(pt.x - 10, pt.y);
          ctx.lineTo(pt.x + 10, pt.y);
          ctx.stroke();
        });
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* ── Ambient Radial Lighting ──────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-40 dark:opacity-60 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(245, 158, 11, 0.07) 0%, rgba(56, 189, 248, 0.05) 45%, transparent 75%)',
        }}
      />

      {/* ── 3D Solid Model Canvas ────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-80 dark:opacity-90 transition-opacity duration-300"
      />

      {/* ── High-Contrast Radial Vignette Mask ───────────────────── */}
      {/* Ensures center headline, subtitle, and CTA remain 100% razor sharp */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, transparent 20%, var(--bg-primary) 85%)',
        }}
      />
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[var(--bg-primary)]/80 to-transparent" />
    </div>
  );
}
