'use client';

import React, { useEffect, useRef } from 'react';

interface StarParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
}

export function HeroSkylineBackground() {
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

    // Mouse parallax tracking
    let mouseX = 0;
    let targetMouseX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 60;
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

    // Floating ambient particles
    const particles: StarParticle[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.5 + 0.8,
        alpha: Math.random() * 0.5 + 0.2,
        speed: Math.random() * 0.0004 + 0.0002,
      });
    }

    let animTime = 0;

    // ── Main Render Loop ───────────────────────────────────────────
    const render = () => {
      animTime += 0.02;

      if (!prefersReducedMotion) {
        mouseX += (targetMouseX - mouseX) * 0.05;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const baseHorizon = height * 0.82;

      // ── 1. Volumetric Architectural Sky Searchlights ─────────────
      const lightBeam1Angle = Math.sin(animTime * 0.4) * 0.18 - 0.35;
      const lightBeam2Angle = Math.cos(animTime * 0.35) * 0.15 + 0.25;

      const drawSearchlight = (originX: number, originY: number, angle: number, beamWidth: number) => {
        const beamLen = height * 0.95;
        const targetX = originX + Math.sin(angle) * beamLen;
        const targetY = originY - Math.cos(angle) * beamLen;

        const grad = ctx.createRadialGradient(originX, originY, 10, targetX, targetY, beamLen);
        const colStart = isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(14, 165, 233, 0.08)';
        grad.addColorStop(0, colStart);
        grad.addColorStop(0.6, isDark ? 'rgba(245, 158, 11, 0.04)' : 'rgba(217, 119, 6, 0.03)');
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(targetX - beamWidth, targetY);
        ctx.lineTo(targetX + beamWidth, targetY);
        ctx.closePath();
        ctx.fill();
      };

      drawSearchlight(width * 0.3 + mouseX * 0.2, baseHorizon - 80, lightBeam1Angle, 85);
      drawSearchlight(width * 0.7 + mouseX * 0.2, baseHorizon - 100, lightBeam2Angle, 95);

      // ── 2. Layer 1: Distant Background Skyline Silhouette ─────────
      const bgOffset = mouseX * 0.15;
      ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.25)' : 'rgba(203, 213, 225, 0.35)';

      const bgBuildings = [
        { x: -50, w: 90, h: 220 },
        { x: 50, w: 75, h: 260 },
        { x: 140, w: 110, h: 320 },
        { x: 270, w: 85, h: 280 },
        { x: 375, w: 130, h: 360 }, // Supertall
        { x: 520, w: 90, h: 250 },
        { x: 630, w: 120, h: 310 },
        { x: 770, w: 80, h: 270 },
        { x: 870, w: 140, h: 350 },
        { x: 1030, w: 100, h: 290 },
        { x: 1150, w: 120, h: 240 },
        { x: 1290, w: 95, h: 270 },
        { x: 1400, w: 110, h: 330 },
      ];

      bgBuildings.forEach(b => {
        const screenX = (b.x / 1400) * width + bgOffset;
        const bWidth = (b.w / 1400) * width;
        const bHeight = b.h * (height / 600);
        ctx.fillRect(screenX, baseHorizon - bHeight, bWidth, bHeight);

        // Antenna Spire
        ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.20)' : 'rgba(30, 58, 95, 0.20)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX + bWidth / 2, baseHorizon - bHeight);
        ctx.lineTo(screenX + bWidth / 2, baseHorizon - bHeight - 35);
        ctx.stroke();
      });

      // ── 3. Layer 2: Mid-ground Detailed High-Rises with Windows ────
      const midOffset = mouseX * 0.4;
      const midBuildings = [
        { x: -30, w: 70, h: 180, type: 'block' },
        { x: 50, w: 85, h: 290, type: 'spire' },
        { x: 150, w: 110, h: 240, type: 'stepped' },
        { x: 280, w: 90, h: 340, type: 'diagrid' }, // Diagrid tower
        { x: 390, w: 75, h: 280, type: 'twin1' },  // Twin Tower 1
        { x: 480, w: 75, h: 280, type: 'twin2' },  // Twin Tower 2 (Connected by skybridge)
        { x: 575, w: 105, h: 260, type: 'block' },
        { x: 700, w: 90, h: 360, type: 'spire' },  // Iconic Pinnacle
        { x: 810, w: 120, h: 220, type: 'stepped' },
        { x: 950, w: 85, h: 300, type: 'diagrid' },
        { x: 1055, w: 95, h: 270, type: 'block' },
        { x: 1170, w: 80, h: 320, type: 'spire' },
        { x: 1270, w: 110, h: 230, type: 'block' },
      ];

      midBuildings.forEach((b, idx) => {
        const screenX = (b.x / 1300) * width + midOffset;
        const bWidth = Math.max((b.w / 1300) * width, 55);
        const bHeight = b.h * (height / 580);
        const topY = baseHorizon - bHeight;

        // Building Massing Body
        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(226, 232, 240, 0.85)';
        ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(30, 58, 95, 0.30)';
        ctx.lineWidth = 1.25;

        if (b.type === 'stepped') {
          // 3-tier stepped setback
          const t1H = bHeight * 0.45;
          const t2H = bHeight * 0.35;
          const t3H = bHeight * 0.20;
          ctx.fillRect(screenX, baseHorizon - t1H, bWidth, t1H);
          ctx.strokeRect(screenX, baseHorizon - t1H, bWidth, t1H);

          ctx.fillRect(screenX + bWidth * 0.15, baseHorizon - t1H - t2H, bWidth * 0.7, t2H);
          ctx.strokeRect(screenX + bWidth * 0.15, baseHorizon - t1H - t2H, bWidth * 0.7, t2H);

          ctx.fillRect(screenX + bWidth * 0.3, topY, bWidth * 0.4, t3H);
          ctx.strokeRect(screenX + bWidth * 0.3, topY, bWidth * 0.4, t3H);
        } else {
          ctx.fillRect(screenX, topY, bWidth, bHeight);
          ctx.strokeRect(screenX, topY, bWidth, bHeight);

          // Diagrid bracing lines if type is diagrid
          if (b.type === 'diagrid') {
            ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.20)' : 'rgba(30, 58, 95, 0.18)';
            ctx.lineWidth = 1;
            const numDiags = 4;
            const dh = bHeight / numDiags;
            for (let d = 0; d < numDiags; d++) {
              ctx.beginPath();
              ctx.moveTo(screenX, topY + d * dh);
              ctx.lineTo(screenX + bWidth, topY + (d + 1) * dh);
              ctx.moveTo(screenX + bWidth, topY + d * dh);
              ctx.lineTo(screenX, topY + (d + 1) * dh);
              ctx.stroke();
            }
          }
        }

        // Skybridge between Twin Towers
        if (b.type === 'twin1') {
          const nextB = midBuildings[idx + 1];
          if (nextB) {
            const nextX = (nextB.x / 1300) * width + midOffset;
            const bridgeY = topY + bHeight * 0.35;
            const bridgeH = 14;
            ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.90)' : 'rgba(203, 213, 225, 0.95)';
            ctx.fillRect(screenX + bWidth, bridgeY, nextX - (screenX + bWidth), bridgeH);
            ctx.strokeRect(screenX + bWidth, bridgeY, nextX - (screenX + bWidth), bridgeH);
          }
        }

        // Antenna Spire & Aviation Light
        if (b.type === 'spire') {
          const spireH = 40;
          ctx.strokeStyle = isDark ? '#38BDF8' : '#0284C7';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(screenX + bWidth / 2, topY);
          ctx.lineTo(screenX + bWidth / 2, topY - spireH);
          ctx.stroke();

          // Blinking Red Beacon
          const beaconBlink = (Math.sin(animTime * 3.5 + idx) + 1) * 0.5;
          ctx.fillStyle = `rgba(239, 68, 68, ${beaconBlink * 0.9})`;
          ctx.beginPath();
          ctx.arc(screenX + bWidth / 2, topY - spireH, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Lit Windows Grid
        const cols = 4;
        const rows = 12;
        const winW = (bWidth - 12) / cols;
        const winH = 4;
        const padX = 3;
        const padY = 8;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            // Seed-like deterministic window lighting
            const lit = ((idx * 17 + r * 7 + c * 13) % 10) > 4;
            if (lit) {
              const wx = screenX + padX + c * (winW + padX);
              const wy = topY + 20 + r * (winH + padY);
              if (wy < baseHorizon - 10) {
                const isWarm = ((idx + r + c) % 3) === 0;
                ctx.fillStyle = isWarm
                  ? (isDark ? 'rgba(245, 158, 11, 0.65)' : 'rgba(217, 119, 6, 0.55)')
                  : (isDark ? 'rgba(56, 189, 248, 0.55)' : 'rgba(14, 165, 233, 0.45)');
                ctx.fillRect(wx, wy, winW, winH);
              }
            }
          }
        }
      });

      // ── 4. Layer 3: Construction Tower Cranes ─────────────────────
      const fgOffset = mouseX * 0.65;
      const cranes = [
        { x: width * 0.22 + fgOffset, baseY: baseHorizon, mastH: 260, jibL: 110, counterJibL: 35 },
        { x: width * 0.78 + fgOffset, baseY: baseHorizon, mastH: 290, jibL: 130, counterJibL: 40 },
      ];

      cranes.forEach(crane => {
        const topMastY = crane.baseY - crane.mastH;
        ctx.strokeStyle = isDark ? '#F59E0B' : '#D97706';
        ctx.lineWidth = 1.25;

        // Vertical Lattice Mast
        const mastW = 7;
        ctx.strokeRect(crane.x - mastW / 2, topMastY, mastW, crane.mastH);
        // Mast X-braces
        const numBraces = 14;
        const bh = crane.mastH / numBraces;
        for (let b = 0; b < numBraces; b++) {
          ctx.beginPath();
          ctx.moveTo(crane.x - mastW / 2, topMastY + b * bh);
          ctx.lineTo(crane.x + mastW / 2, topMastY + (b + 1) * bh);
          ctx.moveTo(crane.x + mastW / 2, topMastY + b * bh);
          ctx.lineTo(crane.x - mastW / 2, topMastY + (b + 1) * bh);
          ctx.stroke();
        }

        // Slewing Unit / Cab
        ctx.fillStyle = isDark ? '#F59E0B' : '#D97706';
        ctx.fillRect(crane.x - 6, topMastY - 8, 12, 8);

        // Apex Tower Peak
        const peakY = topMastY - 24;
        ctx.beginPath();
        ctx.moveTo(crane.x, peakY);
        ctx.lineTo(crane.x - 5, topMastY - 8);
        ctx.moveTo(crane.x, peakY);
        ctx.lineTo(crane.x + 5, topMastY - 8);
        ctx.stroke();

        // Horizontal Jib & Counter-Jib
        const jibY = topMastY - 8;
        ctx.beginPath();
        ctx.moveTo(crane.x - crane.counterJibL, jibY);
        ctx.lineTo(crane.x + crane.jibL, jibY);
        // Tie cables from peak
        ctx.moveTo(crane.x, peakY);
        ctx.lineTo(crane.x + crane.jibL * 0.75, jibY);
        ctx.moveTo(crane.x, peakY);
        ctx.lineTo(crane.x - crane.counterJibL * 0.85, jibY);
        ctx.stroke();

        // Counter-weight
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(30, 58, 95, 0.4)';
        ctx.fillRect(crane.x - crane.counterJibL, jibY - 2, 8, 10);

        // Trolley & Hoist Cable (Slowly oscillating)
        const trolleyX = crane.x + crane.jibL * 0.55 + Math.sin(animTime * 0.5) * 20;
        const cableH = 65 + Math.cos(animTime * 0.7) * 15;
        ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.6)' : 'rgba(14, 165, 233, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(trolleyX, jibY);
        ctx.lineTo(trolleyX, jibY + cableH);
        ctx.stroke();

        // Hook Block
        ctx.fillStyle = isDark ? '#F59E0B' : '#D97706';
        ctx.fillRect(trolleyX - 3, jibY + cableH, 6, 6);

        // Crane Peak Blinking Beacon
        const craneBlink = (Math.sin(animTime * 5) + 1) * 0.5;
        ctx.fillStyle = `rgba(239, 68, 68, ${craneBlink * 0.9})`;
        ctx.beginPath();
        ctx.arc(crane.x, peakY, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── 5. Layer 4: Architectural Cable-Stayed Bridge Spanning Horizon ──
      const bridgePylonX = width * 0.5 + fgOffset * 0.5;
      const pylonH = 180;
      const pylonTopY = baseHorizon - pylonH;

      // Inverted-Y Bridge Pylon Tower
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(30, 58, 95, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bridgePylonX, pylonTopY);
      ctx.lineTo(bridgePylonX - 28, baseHorizon);
      ctx.moveTo(bridgePylonX, pylonTopY);
      ctx.lineTo(bridgePylonX + 28, baseHorizon);
      // Cross strut
      ctx.moveTo(bridgePylonX - 16, baseHorizon - 70);
      ctx.lineTo(bridgePylonX + 16, baseHorizon - 70);
      ctx.stroke();

      // Radiating Stay Cables
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.20)' : 'rgba(14, 165, 233, 0.18)';
      ctx.lineWidth = 0.85;
      const numCables = 7;
      for (let c = 1; c <= numCables; c++) {
        const anchorDist = c * 38;
        const cableTop = pylonTopY + c * 10;
        ctx.beginPath();
        // Left fan
        ctx.moveTo(bridgePylonX, cableTop);
        ctx.lineTo(bridgePylonX - anchorDist, baseHorizon - 10);
        // Right fan
        ctx.moveTo(bridgePylonX, cableTop);
        ctx.lineTo(bridgePylonX + anchorDist, baseHorizon - 10);
        ctx.stroke();
      }

      // Horizontal Bridge Deck
      ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(226, 232, 240, 0.90)';
      ctx.fillRect(0, baseHorizon - 10, width, 12);
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(30, 58, 95, 0.30)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, baseHorizon - 10, width, 12);

      // ── 6. Ambient Floating Dust / Light Motes ─────────────────────
      particles.forEach(p => {
        p.y -= p.speed;
        if (p.y < 0) p.y = 1;

        const px = p.x * width + mouseX * 0.1;
        const py = p.y * height;
        const pAlpha = p.alpha * (0.6 + Math.sin(animTime + p.x * 10) * 0.4);

        ctx.fillStyle = isDark
          ? `rgba(56, 189, 248, ${pAlpha * 0.6})`
          : `rgba(14, 165, 233, ${pAlpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

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
      {/* ── Atmospheric Sky Glow ─────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-40 dark:opacity-60 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.08) 0%, rgba(245, 158, 11, 0.04) 50%, transparent 75%)',
        }}
      />

      {/* ── Skyline Panorama Canvas ──────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-75 dark:opacity-85 transition-opacity duration-300"
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
