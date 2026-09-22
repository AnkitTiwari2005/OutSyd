'use client';

import React, { useEffect, useRef } from 'react';

interface DustMote {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  drift: number;
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

    // ── Theme Detection ──────────────────────────────────────────────
    let isDark =
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    const themeObserver = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme');
      isDark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Mouse Parallax ───────────────────────────────────────────────
    let mouseX = 0;
    let targetMouseX = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 60;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // ── Resize ───────────────────────────────────────────────────────
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

    // ── Ambient Dust Motes ───────────────────────────────────────────
    const motes: DustMote[] = [];
    for (let i = 0; i < 40; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.4 + 0.5,
        alpha: Math.random() * 0.35 + 0.12,
        speed: Math.random() * 0.00025 + 0.0001,
        drift: (Math.random() - 0.5) * 0.00008,
      });
    }

    let animTime = 0;

    // ── Helpers ──────────────────────────────────────────────────────

    /** Draw a trapezoid-topped tower (tapered / setback silhouette) */
    const drawTaperedTower = (
      x: number,
      topY: number,
      w: number,
      h: number,
      taperRatio: number // 0 = rectangular, 0.3 = moderately tapered at top
    ) => {
      const inset = w * taperRatio * 0.5;
      ctx.beginPath();
      ctx.moveTo(x, topY + h);
      ctx.lineTo(x + w, topY + h);
      ctx.lineTo(x + w - inset, topY);
      ctx.lineTo(x + inset, topY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    /** Draw curtain-wall spandrel bands (horizontal floor lines) on a tower */
    const drawSpandrelBands = (
      x: number,
      topY: number,
      w: number,
      h: number,
      floorH: number
    ) => {
      const numFloors = Math.floor(h / floorH);
      ctx.lineWidth = 0.4;
      for (let f = 1; f < numFloors; f++) {
        const lineY = topY + f * floorH;
        ctx.beginPath();
        ctx.moveTo(x + 2, lineY);
        ctx.lineTo(x + w - 2, lineY);
        ctx.stroke();
      }
    };

    /** Draw vertical curtain-wall fins on a tower face */
    const drawFins = (x: number, topY: number, w: number, h: number, numFins: number) => {
      ctx.lineWidth = 0.35;
      for (let f = 1; f < numFins; f++) {
        const fx = x + (f / numFins) * w;
        ctx.beginPath();
        ctx.moveTo(fx, topY + 6);
        ctx.lineTo(fx, topY + h - 4);
        ctx.stroke();
      }
    };

    /** Draw diamond-brace lattice mast */
    const drawLattice = (
      cx: number,
      topY: number,
      mastH: number,
      mastHalfW: number,
      numCells: number
    ) => {
      const cellH = mastH / numCells;
      for (let i = 0; i < numCells; i++) {
        const y0 = topY + i * cellH;
        const y1 = topY + (i + 0.5) * cellH;
        const y2 = topY + (i + 1) * cellH;
        // Left chord side
        ctx.beginPath();
        ctx.moveTo(cx - mastHalfW, y0);
        ctx.lineTo(cx, y1);
        ctx.lineTo(cx - mastHalfW, y2);
        ctx.stroke();
        // Right chord side
        ctx.beginPath();
        ctx.moveTo(cx + mastHalfW, y0);
        ctx.lineTo(cx, y1);
        ctx.lineTo(cx + mastHalfW, y2);
        ctx.stroke();
        // Horizontal tie
        ctx.beginPath();
        ctx.moveTo(cx - mastHalfW, y1);
        ctx.lineTo(cx + mastHalfW, y1);
        ctx.stroke();
      }
    };

    // ── Main Render Loop ─────────────────────────────────────────────
    const render = () => {
      animTime += prefersReducedMotion ? 0 : 0.018;

      if (!prefersReducedMotion) {
        mouseX += (targetMouseX - mouseX) * 0.05;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const baseHorizon = height * 0.86;
      const scale = height / 600;

      // ── 1. Atmospheric Sky Gradient ──────────────────────────────
      if (isDark) {
        // Deep navy zenith → dark charcoal → near-black at horizon
        const skyGrad = ctx.createLinearGradient(0, 0, 0, baseHorizon);
        skyGrad.addColorStop(0, '#0a0f1e');   // deep navy zenith
        skyGrad.addColorStop(0.45, '#0e1629'); // mid navy
        skyGrad.addColorStop(0.75, '#121c2f'); // steel-blue charcoal
        skyGrad.addColorStop(1, '#1a2440');    // slightly lighter at horizon
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, baseHorizon);

        // Warm amber horizon glow — twilight / city glow
        const horizonGlow = ctx.createLinearGradient(0, baseHorizon - 120, 0, baseHorizon);
        horizonGlow.addColorStop(0, 'transparent');
        horizonGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.07)');
        horizonGlow.addColorStop(1, 'rgba(251, 146, 60, 0.14)');
        ctx.fillStyle = horizonGlow;
        ctx.fillRect(0, baseHorizon - 120, width, 120);
      } else {
        // Pale sky blue zenith → warm champagne → soft peach at horizon
        const skyGrad = ctx.createLinearGradient(0, 0, 0, baseHorizon);
        skyGrad.addColorStop(0, '#e8f4fd');
        skyGrad.addColorStop(0.4, '#f0f7ff');
        skyGrad.addColorStop(0.75, '#faf5ef');
        skyGrad.addColorStop(1, '#fef3e2');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, baseHorizon);

        // Soft warm horizon glow
        const horizonGlow = ctx.createLinearGradient(0, baseHorizon - 80, 0, baseHorizon);
        horizonGlow.addColorStop(0, 'transparent');
        horizonGlow.addColorStop(1, 'rgba(251, 191, 36, 0.10)');
        ctx.fillStyle = horizonGlow;
        ctx.fillRect(0, baseHorizon - 80, width, 80);
      }

      // ── 2. Volumetric Searchlights ────────────────────────────────
      const drawSearchlight = (
        originX: number,
        originY: number,
        angle: number,
        beamWidth: number
      ) => {
        const beamLen = height * 1.1;
        const tx = originX + Math.sin(angle) * beamLen;
        const ty = originY - Math.cos(angle) * beamLen;
        const grad = ctx.createRadialGradient(originX, originY, 5, tx, ty, beamLen);
        grad.addColorStop(0, isDark ? 'rgba(56,189,248,0.12)' : 'rgba(14,165,233,0.06)');
        grad.addColorStop(0.55, isDark ? 'rgba(245,158,11,0.04)' : 'rgba(217,119,6,0.02)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(tx - beamWidth, ty);
        ctx.lineTo(tx + beamWidth, ty);
        ctx.closePath();
        ctx.fill();
      };
      const beam1 = -0.35 + Math.sin(animTime * 0.32) * 0.14;
      drawSearchlight(width * 0.15 + mouseX * 0.14, baseHorizon - 100, beam1, 70);
      const beam2 = 0.30 + Math.cos(animTime * 0.28) * 0.13;
      drawSearchlight(width * 0.85 + mouseX * 0.14, baseHorizon - 100, beam2, 80);

      // ── 3. Layer 0: Distant Hills / Mountain Silhouette ───────────
      // Ultra-faint, extreme background depth — no parallax
      {
        const hillAlpha = isDark ? 0.12 : 0.06;
        ctx.fillStyle = isDark
          ? `rgba(20, 35, 65, ${hillAlpha})`
          : `rgba(180, 200, 220, ${hillAlpha})`;
        ctx.beginPath();
        ctx.moveTo(0, baseHorizon);
        // Gentle rolling hill profile across entire width
        const hillPts = [
          [0.00, 0.90], [0.08, 0.78], [0.15, 0.72], [0.22, 0.80],
          [0.30, 0.76], [0.38, 0.70], [0.45, 0.75], [0.50, 0.74],
          [0.55, 0.76], [0.62, 0.69], [0.70, 0.74], [0.78, 0.78],
          [0.85, 0.71], [0.92, 0.77], [1.00, 0.82],
        ];
        hillPts.forEach(([nx, ny]) => {
          ctx.lineTo(nx * width, ny * baseHorizon);
        });
        ctx.lineTo(width, baseHorizon);
        ctx.closePath();
        ctx.fill();
      }

      // ── 4. Layer 1: Background Skyline (Faintest, no outline) ─────
      const bgOffset = mouseX * 0.10;
      {
        const bgAlpha = isDark ? 0.22 : 0.06;
        ctx.fillStyle = isDark
          ? `rgba(18, 32, 58, ${bgAlpha})`
          : `rgba(100, 130, 180, ${bgAlpha})`;
        ctx.strokeStyle = 'transparent';

        const bgBuildings = [
          // Left flank
          { nx: -0.05, nw: 0.09, h: 270 },
          { nx: 0.04,  nw: 0.07, h: 330 },
          { nx: 0.12,  nw: 0.10, h: 375 },
          { nx: 0.22,  nw: 0.07, h: 255 },
          // Low center
          { nx: 0.31,  nw: 0.10, h: 68 },
          { nx: 0.43,  nw: 0.13, h: 52 },
          { nx: 0.57,  nw: 0.11, h: 62 },
          // Right flank
          { nx: 0.69,  nw: 0.07, h: 265 },
          { nx: 0.77,  nw: 0.10, h: 385 },
          { nx: 0.88,  nw: 0.08, h: 320 },
          { nx: 0.97,  nw: 0.09, h: 250 },
        ];

        bgBuildings.forEach(b => {
          const bx = b.nx * width + bgOffset;
          const bw = b.nw * width;
          const bh = b.h * scale;
          ctx.fillRect(bx, baseHorizon - bh, bw, bh);
          // Faint antenna on tall ones
          if (b.h > 150) {
            ctx.strokeStyle = isDark ? 'rgba(56,189,248,0.18)' : 'rgba(30,58,95,0.10)';
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(bx + bw / 2, baseHorizon - bh);
            ctx.lineTo(bx + bw / 2, baseHorizon - bh - 28 * scale);
            ctx.stroke();
          }
        });
      }

      // ── 5. Layer 2: Midground High-Rises (Detailed Architecture) ──
      const midOffset = mouseX * 0.35;

      // Building definitions: type drives silhouette treatment
      // types: 'rect' | 'tapered' | 'stepped' | 'diagrid' | 'curved' | 'twin1' | 'twin2' | 'plinth'
      const midBuildings: {
        nx: number; nw: number; h: number;
        type: string; fins?: boolean; spandrel?: boolean; taper?: number;
      }[] = [
        // Left Wing
        { nx: -0.02, nw: 0.06, h: 215, type: 'rect',    spandrel: true },
        { nx: 0.05,  nw: 0.08, h: 310, type: 'tapered',  taper: 0.18, fins: true },
        { nx: 0.14,  nw: 0.10, h: 390, type: 'diagrid',  spandrel: true },   // Landmark left
        { nx: 0.25,  nw: 0.065,h: 255, type: 'stepped' },
        // Center low clearance (keeps headline visible)
        { nx: 0.33,  nw: 0.09, h: 58,  type: 'plinth' },
        { nx: 0.43,  nw: 0.14, h: 44,  type: 'plinth' },
        { nx: 0.58,  nw: 0.10, h: 54,  type: 'plinth' },
        // Right Wing
        { nx: 0.69,  nw: 0.065,h: 240, type: 'stepped' },
        { nx: 0.76,  nw: 0.065,h: 330, type: 'twin1',   spandrel: true },
        { nx: 0.835, nw: 0.065,h: 330, type: 'twin2',   spandrel: true },
        { nx: 0.91,  nw: 0.085,h: 400, type: 'tapered',  taper: 0.22, fins: true }, // Pinnacle
        { nx: 1.00,  nw: 0.07, h: 215, type: 'rect',    spandrel: true },
      ];

      midBuildings.forEach((b, idx) => {
        const screenX = b.nx * width + midOffset;
        const bWidth = Math.max(b.nw * width, 44);
        const bHeight = b.h * scale;
        const topY = baseHorizon - bHeight;

        // ── Base fill & stroke style per theme ──
        if (isDark) {
          ctx.fillStyle = 'rgba(10, 18, 38, 0.82)';
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
          ctx.lineWidth = 1.2;
        } else {
          ctx.fillStyle = 'rgba(240, 246, 255, 0.88)';
          ctx.strokeStyle = 'rgba(30, 58, 95, 0.18)';
          ctx.lineWidth = 0.9;
        }

        // ── Draw silhouette ──
        if (b.type === 'stepped') {
          // Tiered setback — classic Art Deco form
          const t1 = bHeight * 0.44;
          const t2 = bHeight * 0.34;
          const t3 = bHeight * 0.22;
          ctx.fillRect(screenX, baseHorizon - t1, bWidth, t1);
          ctx.strokeRect(screenX, baseHorizon - t1, bWidth, t1);
          ctx.fillRect(screenX + bWidth * 0.14, baseHorizon - t1 - t2, bWidth * 0.72, t2);
          ctx.strokeRect(screenX + bWidth * 0.14, baseHorizon - t1 - t2, bWidth * 0.72, t2);
          ctx.fillRect(screenX + bWidth * 0.28, topY, bWidth * 0.44, t3);
          ctx.strokeRect(screenX + bWidth * 0.28, topY, bWidth * 0.44, t3);
        } else if (b.type === 'tapered') {
          drawTaperedTower(screenX, topY, bWidth, bHeight, b.taper ?? 0.15);
        } else if (b.type !== 'plinth') {
          // rect, diagrid, twin1, twin2 — all rectangular base
          ctx.fillRect(screenX, topY, bWidth, bHeight);
          ctx.strokeRect(screenX, topY, bWidth, bHeight);
        } else {
          // plinth — low podium, slightly wider
          ctx.fillRect(screenX - 4, topY, bWidth + 8, bHeight);
          ctx.strokeRect(screenX - 4, topY, bWidth + 8, bHeight);
        }

        // ── Diagrid structural pattern ──
        if (b.type === 'diagrid') {
          const dCol = isDark ? 'rgba(56,189,248,0.20)' : 'rgba(30,58,95,0.11)';
          ctx.strokeStyle = dCol;
          ctx.lineWidth = 0.8;
          const numDiags = 6;
          const dh = bHeight / numDiags;
          for (let d = 0; d < numDiags; d++) {
            ctx.beginPath();
            ctx.moveTo(screenX, topY + d * dh);
            ctx.lineTo(screenX + bWidth, topY + (d + 1) * dh);
            ctx.moveTo(screenX + bWidth, topY + d * dh);
            ctx.lineTo(screenX, topY + (d + 1) * dh);
            ctx.stroke();
          }
          // Restore stroke for subsequent draws
          ctx.strokeStyle = isDark ? 'rgba(56,189,248,0.28)' : 'rgba(30,58,95,0.18)';
        }

        // ── Horizontal spandrel bands (floor lines) ──
        if (b.spandrel && b.h > 100) {
          ctx.strokeStyle = isDark ? 'rgba(56,189,248,0.12)' : 'rgba(30,58,95,0.09)';
          drawSpandrelBands(screenX, topY, bWidth, bHeight, 14 * scale);
        }

        // ── Vertical curtain-wall fins ──
        if (b.fins && b.h > 150) {
          ctx.strokeStyle = isDark ? 'rgba(56,189,248,0.14)' : 'rgba(30,58,95,0.10)';
          drawFins(screenX, topY, bWidth, bHeight, 6);
        }

        // ── Sky bridge between twin towers ──
        if (b.type === 'twin1') {
          const nextB = midBuildings[idx + 1];
          if (nextB) {
            const nx2 = nextB.nx * width + midOffset;
            const bridgeY = topY + bHeight * 0.30;
            const bH2 = 13;
            ctx.fillStyle = isDark ? 'rgba(20,30,55,0.95)' : 'rgba(235,243,255,0.96)';
            ctx.strokeStyle = isDark ? 'rgba(56,189,248,0.28)' : 'rgba(30,58,95,0.18)';
            ctx.lineWidth = 1;
            ctx.fillRect(screenX + bWidth, bridgeY, nx2 - (screenX + bWidth), bH2);
            ctx.strokeRect(screenX + bWidth, bridgeY, nx2 - (screenX + bWidth), bH2);
            // Bridge cable
            ctx.strokeStyle = isDark ? 'rgba(56,189,248,0.18)' : 'rgba(30,58,95,0.13)';
            ctx.lineWidth = 0.6;
            const midBridgeX = screenX + bWidth + (nx2 - (screenX + bWidth)) * 0.5;
            ctx.beginPath();
            ctx.moveTo(screenX + bWidth, bridgeY);
            ctx.quadraticCurveTo(midBridgeX, bridgeY + 6, nx2, bridgeY);
            ctx.stroke();
          }
        }

        // ── Spire + aviation beacon ──
        if (b.type === 'tapered' || b.type === 'twin2') {
          const spireH = (b.h > 300 ? 52 : 36) * scale;
          const tipX = screenX + bWidth / 2;
          ctx.strokeStyle = isDark ? '#38BDF8' : '#0369A1';
          ctx.lineWidth = b.h > 300 ? 1.4 : 1;
          ctx.beginPath();
          ctx.moveTo(tipX, topY);
          ctx.lineTo(tipX, topY - spireH);
          ctx.stroke();
          // Aviation beacon — offset blink per tower using idx
          const blink = (Math.sin(animTime * 3.2 + idx * 2.1) + 1) * 0.5;
          ctx.fillStyle = `rgba(239,68,68,${blink * 0.92})`;
          ctx.beginPath();
          ctx.arc(tipX, topY - spireH, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // ── Antenna on rect towers ──
        if (b.type === 'rect' && b.h > 150) {
          ctx.strokeStyle = isDark ? 'rgba(56,189,248,0.35)' : 'rgba(30,58,95,0.22)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(screenX + bWidth / 2, topY);
          ctx.lineTo(screenX + bWidth / 2, topY - 28 * scale);
          ctx.stroke();
          const anBlink = (Math.sin(animTime * 4 + idx) + 1) * 0.5;
          ctx.fillStyle = `rgba(239,68,68,${anBlink * 0.85})`;
          ctx.beginPath();
          ctx.arc(screenX + bWidth / 2, topY - 28 * scale, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // ── Window glazing (only on tall buildings, never in center) ──
        if (b.h > 130 && b.type !== 'plinth') {
          const effectiveTopY = b.type === 'stepped' ? topY + bHeight * 0.22 : topY;
          const effectiveH = b.type === 'stepped' ? bHeight * 0.44 : bHeight;
          const cols = b.h > 280 ? 5 : 4;
          const winH = Math.max(4, 5 * scale);
          const floorH = 14 * scale;
          const padX = 3;
          const numRows = Math.floor((effectiveH - 20 * scale) / floorH);

          for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < cols; c++) {
              const lit = ((idx * 17 + r * 11 + c * 7) % 13) > 5;
              if (!lit) continue;
              const wx = screenX + padX + c * ((bWidth - padX * 2) / cols);
              const wy = effectiveTopY + 18 * scale + r * floorH;
              if (wy + winH > baseHorizon - 6) continue;

              if (isDark) {
                // Warm amber or cool cyan — animate a gentle flicker
                const flicker = 0.78 + Math.sin(animTime * 0.8 + idx * 3.1 + r * 0.9 + c * 1.7) * 0.18;
                const isWarm = ((idx * 3 + r + c) % 4) !== 0;
                ctx.fillStyle = isWarm
                  ? `rgba(245,158,11,${0.60 * flicker})`
                  : `rgba(56,189,248,${0.52 * flicker})`;
              } else {
                ctx.fillStyle = 'rgba(14,165,233,0.18)';
              }
              ctx.fillRect(wx, wy, (bWidth - padX * 2) / cols - 2, winH);
            }
          }
        }
      });

      // ── 6. Construction Tower Cranes (Diamond-Lattice Mast) ────────
      const fgOffset = mouseX * 0.55;
      const cranes = [
        { cx: width * 0.24 + fgOffset, mastH: 285, jibL: 115, cjibL: 36 },
        { cx: width * 0.75 + fgOffset, mastH: 308, jibL: 130, cjibL: 40 },
      ];

      cranes.forEach((crane, ci) => {
        const topMastY = baseHorizon - crane.mastH * scale;
        const mastHW = 5; // half-width of mast

        // Mast colour
        ctx.strokeStyle = isDark ? '#F59E0B' : 'rgba(30,58,95,0.48)';
        ctx.lineWidth = 1.2;

        // Outer chord lines of mast
        ctx.beginPath();
        ctx.moveTo(crane.cx - mastHW, topMastY);
        ctx.lineTo(crane.cx - mastHW, baseHorizon);
        ctx.moveTo(crane.cx + mastHW, topMastY);
        ctx.lineTo(crane.cx + mastHW, baseHorizon);
        ctx.stroke();

        // Diamond lattice inside mast
        ctx.lineWidth = 0.7;
        drawLattice(crane.cx, topMastY, crane.mastH * scale, mastHW, 18);

        // Slewing cab
        ctx.fillStyle = isDark ? '#F59E0B' : 'rgba(30,58,95,0.58)';
        ctx.fillRect(crane.cx - 7, topMastY - 9, 14, 9);

        // Peak apex
        const peakY = topMastY - 24 * scale;
        ctx.strokeStyle = isDark ? '#F59E0B' : 'rgba(30,58,95,0.48)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(crane.cx, peakY);
        ctx.lineTo(crane.cx - 5, topMastY - 9);
        ctx.moveTo(crane.cx, peakY);
        ctx.lineTo(crane.cx + 5, topMastY - 9);
        ctx.stroke();

        // Horizontal Jib & Counter-Jib
        const jibY = topMastY - 9;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(crane.cx - crane.cjibL, jibY);
        ctx.lineTo(crane.cx + crane.jibL, jibY);
        ctx.stroke();

        // Jib truss bottom chord (parallel line, slightly offset)
        ctx.lineWidth = 0.7;
        ctx.strokeStyle = isDark ? 'rgba(245,158,11,0.50)' : 'rgba(30,58,95,0.30)';
        ctx.beginPath();
        ctx.moveTo(crane.cx + 2, jibY + 6);
        ctx.lineTo(crane.cx + crane.jibL - 2, jibY + 6);
        ctx.stroke();

        // Tie cables from peak to jib ends
        ctx.strokeStyle = isDark ? 'rgba(245,158,11,0.65)' : 'rgba(30,58,95,0.40)';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(crane.cx, peakY);
        ctx.lineTo(crane.cx + crane.jibL, jibY);
        ctx.moveTo(crane.cx, peakY);
        ctx.lineTo(crane.cx - crane.cjibL, jibY);
        ctx.stroke();

        // Counter-weight block
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(30,58,95,0.28)';
        ctx.fillRect(crane.cx - crane.cjibL - 1, jibY - 3, 10, 12);

        // Trolley position — oscillates along jib
        const trolleyX = crane.cx + crane.jibL * 0.50 + Math.sin(animTime * 0.45 + ci * Math.PI) * 22;
        const cableH = (55 + Math.cos(animTime * 0.6 + ci) * 16) * scale;

        // Hoist cable
        ctx.strokeStyle = isDark ? 'rgba(56,189,248,0.65)' : 'rgba(14,165,233,0.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(trolleyX, jibY);
        ctx.lineTo(trolleyX, jibY + cableH);
        ctx.stroke();

        // Hook block
        ctx.fillStyle = isDark ? '#F59E0B' : 'rgba(30,58,95,0.58)';
        ctx.fillRect(trolleyX - 3.5, jibY + cableH, 7, 7);

        // Aviation beacon on crane peak
        const craneBlink = (Math.sin(animTime * 4.8 + ci * 1.5) + 1) * 0.5;
        ctx.fillStyle = `rgba(239,68,68,${craneBlink * 0.94})`;
        ctx.beginPath();
        ctx.arc(crane.cx, peakY, 3.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── 7. Cable-Stayed Bridge (Center, Low Profile) ──────────────
      const bridgeCX = width * 0.50 + fgOffset * 0.35;
      const pylonH = 140 * scale;
      const pylonTopY = baseHorizon - pylonH;
      const bridgeSpan = Math.min(width * 0.18, 160);

      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(30,58,95,0.20)';
      ctx.lineWidth = 1.8;
      // H-pylon legs
      ctx.beginPath();
      ctx.moveTo(bridgeCX - 12, pylonTopY);
      ctx.lineTo(bridgeCX - 22, baseHorizon);
      ctx.moveTo(bridgeCX + 12, pylonTopY);
      ctx.lineTo(bridgeCX + 22, baseHorizon);
      // Cross-bar
      ctx.moveTo(bridgeCX - 14, baseHorizon - 55 * scale);
      ctx.lineTo(bridgeCX + 14, baseHorizon - 55 * scale);
      ctx.stroke();

      // Stay cables
      ctx.strokeStyle = isDark ? 'rgba(56,189,248,0.18)' : 'rgba(14,165,233,0.15)';
      ctx.lineWidth = 0.75;
      const numCables = 7;
      for (let c = 1; c <= numCables; c++) {
        const anchorDist = (c / numCables) * bridgeSpan;
        const cTop = pylonTopY + c * (pylonH / (numCables + 1));
        ctx.beginPath();
        ctx.moveTo(bridgeCX, cTop);
        ctx.lineTo(bridgeCX - anchorDist, baseHorizon - 8);
        ctx.moveTo(bridgeCX, cTop);
        ctx.lineTo(bridgeCX + anchorDist, baseHorizon - 8);
        ctx.stroke();
      }

      // ── 8. Reflective Ground Plane ─────────────────────────────────
      if (isDark) {
        // Dark shimmering river / reflecting pool
        const riverGrad = ctx.createLinearGradient(0, baseHorizon, 0, height);
        riverGrad.addColorStop(0, 'rgba(10,18,38,0.95)');
        riverGrad.addColorStop(0.3, 'rgba(15,25,50,0.88)');
        riverGrad.addColorStop(1, '#050a12');
        ctx.fillStyle = riverGrad;
        ctx.fillRect(0, baseHorizon, width, height - baseHorizon);

        // Reflection shimmer lines
        const numReflections = 8;
        for (let r = 0; r < numReflections; r++) {
          const ry = baseHorizon + 10 + r * ((height - baseHorizon - 20) / numReflections);
          const shimmer = 0.04 + Math.sin(animTime * 0.9 + r * 1.3) * 0.025;
          ctx.strokeStyle = `rgba(56,189,248,${shimmer})`;
          ctx.lineWidth = 0.5 + r * 0.05;
          const lineW = width * (0.6 - r * 0.05);
          ctx.beginPath();
          ctx.moveTo((width - lineW) / 2, ry);
          ctx.lineTo((width + lineW) / 2, ry);
          ctx.stroke();
        }

        // Amber reflection blobs (window glow in water)
        for (let ab = 0; ab < 6; ab++) {
          const abx = width * (0.08 + ab * 0.15) + Math.sin(animTime * 0.4 + ab) * 5;
          const aby = baseHorizon + 15 + ab * 8;
          const abAlpha = 0.04 + Math.sin(animTime * 0.7 + ab * 2) * 0.02;
          ctx.fillStyle = `rgba(245,158,11,${abAlpha})`;
          ctx.beginPath();
          ctx.ellipse(abx, aby, 12, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Light stone promenade / waterfront esplanade
        const stoneGrad = ctx.createLinearGradient(0, baseHorizon, 0, height);
        stoneGrad.addColorStop(0, 'rgba(226,232,240,0.90)');
        stoneGrad.addColorStop(0.4, 'rgba(241,245,249,0.80)');
        stoneGrad.addColorStop(1, 'rgba(248,250,252,0.70)');
        ctx.fillStyle = stoneGrad;
        ctx.fillRect(0, baseHorizon, width, height - baseHorizon);

        // Stone paving joints (horizontal)
        for (let s = 0; s < 5; s++) {
          const sy = baseHorizon + 12 + s * 14;
          ctx.strokeStyle = 'rgba(148,163,184,0.20)';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(0, sy);
          ctx.lineTo(width, sy);
          ctx.stroke();
        }
      }

      // Horizon demarcation line
      ctx.strokeStyle = isDark ? 'rgba(56,189,248,0.22)' : 'rgba(30,58,95,0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, baseHorizon);
      ctx.lineTo(width, baseHorizon);
      ctx.stroke();

      // ── 9. Ambient Dust Motes ──────────────────────────────────────
      motes.forEach(m => {
        m.y -= m.speed;
        m.x += m.drift;
        if (m.y < 0) { m.y = 1; m.x = Math.random(); }
        if (m.x < 0 || m.x > 1) m.drift *= -1;

        const mx = m.x * width + mouseX * 0.08;
        const my = m.y * height;
        const ma = m.alpha * (0.55 + Math.sin(animTime * 0.9 + m.x * 8) * 0.35);

        ctx.fillStyle = isDark
          ? `rgba(56,189,248,${ma * 0.50})`
          : `rgba(14,165,233,${ma * 0.30})`;
        ctx.beginPath();
        ctx.arc(mx, my, m.size, 0, Math.PI * 2);
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
      {/* ── Atmospheric Ambient Sky Glow ─────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-30 dark:opacity-50 transition-opacity duration-700"
        style={{
          background:
            'radial-gradient(ellipse at 50% 20%, rgba(56,189,248,0.07) 0%, rgba(245,158,11,0.03) 55%, transparent 80%)',
        }}
      />

      {/* ── Architectural Skyline Canvas ─────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-90 dark:opacity-95 transition-opacity duration-300"
      />

      {/* ── Multi-Stop Text Isolation Mask (center clearance zone) ─────
          Uses 4 stops for ultra-smooth feathering — no hard edge visible.
          Dark: obsidian centre. Light: pure white centre.                */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          background: `
            radial-gradient(ellipse 62% 55% at 50% 36%,
              var(--bg-primary) 0%,
              var(--bg-primary) 22%,
              color-mix(in srgb, var(--bg-primary) 70%, transparent) 46%,
              color-mix(in srgb, var(--bg-primary) 20%, transparent) 64%,
              transparent 80%
            )
          `,
          opacity: 0.92,
        }}
      />

      {/* ── Edge Blends ─────────────────────────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[var(--bg-primary)] to-transparent" />
    </div>
  );
}
