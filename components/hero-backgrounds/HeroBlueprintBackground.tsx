'use client';

import React, { useEffect, useRef } from 'react';

export function HeroBlueprintBackground() {
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

    // Interactive mouse CAD crosshairs
    let mouseX = -1000;
    let mouseY = -1000;
    let pulseT = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

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

    // ── CAD Rendering Engine ───────────────────────────────────────
    const render = () => {
      pulseT += 0.018;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Color Palette based on Theme
      const gridMinor = isDark ? 'rgba(56, 189, 248, 0.035)' : 'rgba(30, 58, 95, 0.04)';
      const gridMajor = isDark ? 'rgba(56, 189, 248, 0.09)' : 'rgba(30, 58, 95, 0.08)';
      const wallOuter = isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(20, 35, 60, 0.35)';
      const wallInner = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(30, 58, 95, 0.22)';
      const wallHatch = isDark ? 'rgba(56, 189, 248, 0.06)' : 'rgba(30, 58, 95, 0.06)';
      const columnFill = isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(30, 58, 95, 0.25)';
      const columnStroke = isDark ? 'rgba(56, 189, 248, 0.55)' : 'rgba(30, 58, 95, 0.50)';
      const dimLine = isDark ? 'rgba(245, 158, 11, 0.40)' : 'rgba(217, 119, 6, 0.40)';
      const dimText = isDark ? 'rgba(245, 158, 11, 0.65)' : 'rgba(180, 83, 9, 0.70)';
      const roomTag = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(30, 58, 95, 0.55)';
      const roomSub = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.45)';
      const arcColor = isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(14, 165, 233, 0.35)';
      const crosshairCol = isDark ? 'rgba(56, 189, 248, 0.30)' : 'rgba(30, 58, 95, 0.25)';

      // ── 1. Drafting Grid ──────────────────────────────────────────
      const gridSize = 40;
      const subGrid = 10;

      // Fine sub-grid
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = gridMinor;
      ctx.beginPath();
      for (let x = 0; x <= width; x += subGrid) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += subGrid) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Major structural grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = gridMajor;
      ctx.beginPath();
      for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Grid intersection tick marks (+)
      ctx.lineWidth = 1;
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 58, 95, 0.15)';
      for (let x = gridSize; x < width; x += gridSize * 2) {
        for (let y = gridSize; y < height; y += gridSize * 2) {
          ctx.beginPath();
          ctx.moveTo(x - 3, y);
          ctx.lineTo(x + 3, y);
          ctx.moveTo(x, y - 3);
          ctx.lineTo(x, y + 3);
          ctx.stroke();
        }
      }

      // ── 2. CAD Floor Plan Layout ──────────────────────────────────
      // Dynamic center and scale responsive to container
      const planScale = Math.min(width / 950, height / 580, 1.15) * Math.max(0.75, Math.min(width / 700, 1.05));
      const cx = width * 0.5;
      const cy = height * 0.52;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(planScale, planScale);

      // Floor plan normalized bounds: Width = 720, Height = 420
      const pw = 720;
      const ph = 420;
      const ox = -pw / 2;
      const oy = -ph / 2;

      // Helper function to draw double-line walls with cross-hatch
      const drawWall = (x: number, y: number, w: number, h: number, isExterior = true) => {
        ctx.fillStyle = wallHatch;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = isExterior ? wallOuter : wallInner;
        ctx.lineWidth = isExterior ? 1.75 : 1.25;
        ctx.strokeRect(x, y, w, h);

        // Diagonal hatch pattern
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.strokeStyle = wallHatch;
        ctx.lineWidth = 0.75;
        const step = 8;
        for (let l = -h; l < w + h; l += step) {
          ctx.moveTo(x + l, y);
          ctx.lineTo(x + l + h, y + h);
        }
        ctx.stroke();
        ctx.restore();
      };

      // Outer Perimeters (Double Walls, 14px thick)
      const wt = 14; // outer wall thickness
      const it = 10; // inner partition wall thickness

      // Outer bounding walls with openings
      drawWall(ox, oy, pw, wt, true); // North Wall
      drawWall(ox, oy, wt, ph, true); // West Wall
      drawWall(ox + pw - wt, oy, wt, ph, true); // East Wall
      drawWall(ox, oy + ph - wt, pw, wt, true); // South Wall

      // Internal Room Divisions
      // Great Room: Left (ox + wt to ox + 380), Top (oy + wt to oy + 250)
      const splitX1 = ox + 360;
      const splitX2 = ox + 540;
      const splitY1 = oy + 240;

      // Master Bedroom & Ensuite (Top Right)
      drawWall(splitX1, oy, it, splitY1 - oy, false); // Vertical dividing Great Room & Suites
      drawWall(splitX1, splitY1, pw - (splitX1 - ox), it, false); // Horizontal divider

      // Foyer & Entry Partition (Bottom Left)
      drawWall(ox + 180, splitY1, it, ph - (splitY1 - oy) - wt, false);

      // Kitchen & Utility Partition (Bottom Center)
      drawWall(splitX1, splitY1, it, ph - (splitY1 - oy) - wt, false);
      drawWall(splitX2, oy, it, splitY1 - oy, false); // Master suite and bath divider

      // Balcony / Terrace (Cantilevered overhang on East)
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(14, 165, 233, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.strokeRect(ox + pw, oy + 40, 70, 160);
      ctx.setLineDash([]);
      // Railing line
      ctx.strokeStyle = wallOuter;
      ctx.lineWidth = 1.25;
      ctx.strokeRect(ox + pw + 68, oy + 40, 2, 160);

      // ── 3. Structural RCC Columns (C1 to C12) ──────────────────────
      const colW = 20;
      const colH = 20;
      const columnPositions = [
        // Top row
        { x: ox, y: oy, tag: 'C1' },
        { x: ox + 180 - colW / 2, y: oy, tag: 'C2' },
        { x: splitX1 - colW / 2, y: oy, tag: 'C3' },
        { x: splitX2 - colW / 2, y: oy, tag: 'C4' },
        { x: ox + pw - colW, y: oy, tag: 'C5' },
        // Middle row
        { x: ox, y: splitY1 - colH / 2, tag: 'C6' },
        { x: splitX1 - colW / 2, y: splitY1 - colH / 2, tag: 'C7' },
        { x: splitX2 - colW / 2, y: splitY1 - colH / 2, tag: 'C8' },
        { x: ox + pw - colW, y: splitY1 - colH / 2, tag: 'C9' },
        // Bottom row
        { x: ox, y: oy + ph - colH, tag: 'C10' },
        { x: ox + 180 - colW / 2, y: oy + ph - colH, tag: 'C11' },
        { x: splitX1 - colW / 2, y: oy + ph - colH, tag: 'C12' },
        { x: ox + pw - colW, y: oy + ph - colH, tag: 'C13' },
      ];

      columnPositions.forEach(col => {
        ctx.fillStyle = columnFill;
        ctx.strokeStyle = columnStroke;
        ctx.lineWidth = 1.5;
        ctx.fillRect(col.x, col.y, colW, colH);
        ctx.strokeRect(col.x, col.y, colW, colH);

        // Internal rebar cross (+)
        ctx.beginPath();
        ctx.moveTo(col.x + 4, col.y + 4);
        ctx.lineTo(col.x + colW - 4, col.y + colH - 4);
        ctx.moveTo(col.x + colW - 4, col.y + 4);
        ctx.lineTo(col.x + 4, col.y + colH - 4);
        ctx.stroke();

        // Column Tag
        ctx.font = '8px monospace';
        ctx.fillStyle = dimText;
        ctx.textAlign = 'center';
        ctx.fillText(col.tag, col.x + colW / 2, col.y - 4);
      });

      // ── 4. Staircase Core & Lift Shaft ────────────────────────────
      // Located in Great Room top corner (ox + 220 to ox + 350, oy + wt)
      const sx = ox + 230;
      const sy = oy + wt + 10;
      const sw = 110;
      const sh = 140;

      // Stair treads
      ctx.strokeStyle = wallInner;
      ctx.lineWidth = 1;
      const numTreads = 11;
      const stepH = sh / numTreads;
      for (let i = 0; i <= numTreads; i++) {
        ctx.beginPath();
        ctx.moveTo(sx, sy + i * stepH);
        ctx.lineTo(sx + sw, sy + i * stepH);
        ctx.stroke();
      }
      // Central division stringer
      ctx.beginPath();
      ctx.moveTo(sx + sw / 2, sy);
      ctx.lineTo(sx + sw / 2, sy + sh);
      ctx.stroke();

      // Stair Direction Arrow
      ctx.strokeStyle = isDark ? '#38BDF8' : '#0284C7';
      ctx.fillStyle = isDark ? '#38BDF8' : '#0284C7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sx + sw * 0.25, sy + sh - 15, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx + sw * 0.25, sy + sh - 15);
      ctx.lineTo(sx + sw * 0.25, sy + 15);
      ctx.lineTo(sx + sw * 0.25 - 4, sy + 22);
      ctx.moveTo(sx + sw * 0.25, sy + 15);
      ctx.lineTo(sx + sw * 0.25 + 4, sy + 22);
      ctx.stroke();

      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('UP 18 RISERS', sx + sw / 2, sy + sh + 12);

      // Lift Shaft (Adjacent)
      const lx = sx - 60;
      const ly = sy;
      const lw = 50;
      const lh = 50;
      ctx.strokeStyle = columnStroke;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(lx, ly, lw, lh);
      // Diagonal CAD Cross 'X'
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + lw, ly + lh);
      ctx.moveTo(lx + lw, ly);
      ctx.lineTo(lx, ly + lh);
      ctx.stroke();
      ctx.font = '8px monospace';
      ctx.fillStyle = dimText;
      ctx.fillText('LIFT', lx + lw / 2, ly + lh / 2 + 3);

      // ── 5. Door Swings ────────────────────────────────────────────
      const drawDoor = (dx: number, dy: number, radius: number, startAngle: number, endAngle: number, tag: string) => {
        ctx.strokeStyle = arcColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(dx, dy, radius, startAngle, endAngle);
        ctx.stroke();

        // Door leaf line
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx + Math.cos(startAngle) * radius, dy + Math.sin(startAngle) * radius);
        ctx.stroke();

        ctx.font = '7px monospace';
        ctx.fillStyle = roomSub;
        ctx.fillText(tag, dx + radius * 0.5, dy - 4);
      };

      // Entry Door (South Wall Foyer)
      drawDoor(ox + 100, oy + ph - wt, 32, -Math.PI / 2, 0, 'D1');
      // Master Suite Door
      drawDoor(splitX1 + wt, splitY1 - 40, 28, 0, Math.PI / 2, 'D2');
      // Kitchen Door
      drawDoor(splitX1 - 35, splitY1 + wt, 28, Math.PI, Math.PI * 1.5, 'D3');

      // ── 6. Room Names & Technical Annotations ──────────────────────
      const rooms = [
        { name: 'GRAND LIVING & LOUNGE', dims: '7.20m × 4.80m', x: ox + 140, y: oy + 120, lvl: '+0.15m' },
        { name: 'FOYER & ENTRY', dims: '3.60m × 2.40m', x: ox + 90, y: oy + ph - 80, lvl: '±0.00m' },
        { name: 'MODULAR KITCHEN & PANTRY', dims: '3.60m × 3.00m', x: splitX1 - 90, y: oy + ph - 80, lvl: '+0.15m' },
        { name: 'MASTER SUITE', dims: '5.10m × 4.20m', x: splitX1 + 90, y: oy + 100, lvl: '+0.15m' },
        { name: 'WALK-IN & ENSUITE', dims: '2.80m × 2.10m', x: splitX2 + 80, y: oy + 80, lvl: '+0.10m' },
        { name: 'GUEST BEDROOM / STUDY', dims: '3.90m × 3.60m', x: splitX1 + 100, y: oy + ph - 80, lvl: '+0.15m' },
        { name: 'BALCONY DECK', dims: '6.00m × 1.80m', x: ox + pw + 35, y: oy + 120, lvl: '+0.10m' },
      ];

      rooms.forEach(r => {
        ctx.textAlign = 'center';
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = roomTag;
        ctx.fillText(r.name, r.x, r.y);
        ctx.font = '8px monospace';
        ctx.fillStyle = roomSub;
        ctx.fillText(r.dims, r.x, r.y + 12);
        ctx.fillText(`LVL: ${r.lvl}`, r.x, r.y + 22);
      });

      // ── 7. Outer Dimension Strings with Animated Pulse ─────────────
      const dimOffset = 30;
      ctx.lineWidth = 0.85;
      ctx.strokeStyle = dimLine;

      // Top Dimension Chain (ox to splitX1 to pw)
      const topDimY = oy - dimOffset;
      // Extension lines
      ctx.beginPath();
      ctx.moveTo(ox, oy); ctx.lineTo(ox, topDimY - 8);
      ctx.moveTo(splitX1, oy); ctx.lineTo(splitX1, topDimY - 8);
      ctx.moveTo(ox + pw, oy); ctx.lineTo(ox + pw, topDimY - 8);
      ctx.stroke();

      // Dimension Lines with 45 deg tick slashes
      ctx.beginPath();
      ctx.moveTo(ox, topDimY); ctx.lineTo(ox + pw, topDimY);
      // Ticks
      ctx.moveTo(ox - 4, topDimY + 4); ctx.lineTo(ox + 4, topDimY - 4);
      ctx.moveTo(splitX1 - 4, topDimY + 4); ctx.lineTo(splitX1 + 4, topDimY - 4);
      ctx.moveTo(ox + pw - 4, topDimY + 4); ctx.lineTo(ox + pw + 4, topDimY - 4);
      ctx.stroke();

      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = dimText;
      ctx.textAlign = 'center';
      ctx.fillText('7,200 mm', (ox + splitX1) / 2, topDimY - 4);
      ctx.fillText('7,200 mm', (splitX1 + ox + pw) / 2, topDimY - 4);

      // Left Dimension Chain
      const leftDimX = ox - dimOffset;
      ctx.beginPath();
      ctx.moveTo(ox, oy); ctx.lineTo(leftDimX - 8, oy);
      ctx.moveTo(ox, splitY1); ctx.lineTo(leftDimX - 8, splitY1);
      ctx.moveTo(ox, oy + ph); ctx.lineTo(leftDimX - 8, oy + ph);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(leftDimX, oy); ctx.lineTo(leftDimX, oy + ph);
      // Ticks
      ctx.moveTo(leftDimX - 4, oy + 4); ctx.lineTo(leftDimX + 4, oy - 4);
      ctx.moveTo(leftDimX - 4, splitY1 + 4); ctx.lineTo(leftDimX + 4, splitY1 - 4);
      ctx.moveTo(leftDimX - 4, oy + ph + 4); ctx.lineTo(leftDimX + 4, oy + ph - 4);
      ctx.stroke();

      ctx.save();
      ctx.translate(leftDimX - 6, (oy + splitY1) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('4,800 mm', 0, 0);
      ctx.restore();

      ctx.save();
      ctx.translate(leftDimX - 6, (splitY1 + oy + ph) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('3,600 mm', 0, 0);
      ctx.restore();

      // Animated Measurement Pulse Light traveling along top dimension line
      const pulseX = ox + ((Math.sin(pulseT) + 1) * 0.5) * pw;
      ctx.fillStyle = isDark ? '#38BDF8' : '#0284C7';
      ctx.beginPath();
      ctx.arc(pulseX, topDimY, 3, 0, Math.PI * 2);
      ctx.fill();

      // ── 8. North Arrow Symbol (Top Right) ─────────────────────────
      const nax = ox + pw - 20;
      const nay = oy - 55;
      ctx.strokeStyle = isDark ? '#F59E0B' : '#D97706';
      ctx.fillStyle = isDark ? '#F59E0B' : '#D97706';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.arc(nax, nay, 14, 0, Math.PI * 2);
      ctx.stroke();
      // Compass needle
      ctx.beginPath();
      ctx.moveTo(nax, nay - 12);
      ctx.lineTo(nax + 4, nay + 10);
      ctx.lineTo(nax, nay + 5);
      ctx.lineTo(nax - 4, nay + 10);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('N', nax, nay - 16);

      // ── 9. Professional Title Block (Bottom Right) ─────────────────
      const tbx = ox + pw - 240;
      const tby = oy + ph + 24;
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(30, 58, 95, 0.4)';
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.fillRect(tbx, tby, 240, 48);
      ctx.strokeRect(tbx, tby, 240, 48);

      ctx.textAlign = 'left';
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = isDark ? '#38BDF8' : '#0284C7';
      ctx.fillText('OUTSYD ARCHITECTURAL ENGINEERING', tbx + 8, tby + 14);

      ctx.font = '7px monospace';
      ctx.fillStyle = roomSub;
      ctx.fillText('DWG: A-101 | TYPICAL RESIDENTIAL FLOOR PLAN', tbx + 8, tby + 26);
      ctx.fillText('SCALE: 1:100 @ A1 | IS 1200 / CPWD 2024 COMPLIANT', tbx + 8, tby + 38);

      ctx.restore();

      // ── 10. Interactive CAD Cursor Crosshair ───────────────────────
      if (mouseX > 0 && mouseY > 0) {
        ctx.strokeStyle = crosshairCol;
        ctx.lineWidth = 0.75;
        ctx.setLineDash([6, 6]);

        // Full-screen horizontal & vertical hairline
        ctx.beginPath();
        ctx.moveTo(0, mouseY);
        ctx.lineTo(width, mouseY);
        ctx.moveTo(mouseX, 0);
        ctx.lineTo(mouseX, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Center reticle
        ctx.strokeStyle = isDark ? '#38BDF8' : '#0284C7';
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 8, 0, Math.PI * 2);
        ctx.stroke();

        // Coordinates badge
        ctx.font = '9px monospace';
        ctx.fillStyle = isDark ? '#38BDF8' : '#0284C7';
        ctx.textAlign = 'left';
        const cadX = ((mouseX - cx) / planScale * 25).toFixed(0);
        const cadY = ((mouseY - cy) / planScale * 25).toFixed(0);
        ctx.fillText(`X: ${cadX} mm | Y: ${cadY} mm`, mouseX + 12, mouseY - 8);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* ── Blueprint Vellum Ambient Glow ────────────────────────── */}
      <div
        className="absolute inset-0 opacity-40 dark:opacity-60 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(56, 189, 248, 0.08) 0%, rgba(14, 165, 233, 0.03) 50%, transparent 80%)',
        }}
      />

      {/* ── CAD Blueprint 2D Canvas ──────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-75 dark:opacity-85 transition-opacity duration-300"
      />

      {/* ── High-Contrast Radial Vignette Mask ───────────────────── */}
      {/* Ensures center headline, subtitle, and CTA remain 100% razor sharp */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, transparent 22%, var(--bg-primary) 85%)',
        }}
      />
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[var(--bg-primary)]/80 to-transparent" />
    </div>
  );
}
