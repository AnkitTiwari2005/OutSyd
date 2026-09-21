'use client';

import React, { useEffect, useRef } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Edge {
  p1: number;
  p2: number;
  type: 'column' | 'beam' | 'brace' | 'footing' | 'grid';
}

export function HeroCadBackground() {
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

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Generate 3D Architectural Structural Model ───────────────────
    // Multi-tier building with setbacks (Ground + 3 Floors + Rooftop Parapet)
    const nodes: Point3D[] = [];
    const edges: Edge[] = [];

    // Bay dimensions (meters normalized)
    const bayX = 2.4;
    const bayY = 2.0;
    const storyH = 1.6;
    const numStories = 4;

    // Grid coordinates: 4x3 bays at ground level, tapering slightly at top
    // Floor levels: Z = 0 (footings), 1, 2, 3, 4 (terrace)
    const floorConfigs = [
      { colsX: 4, colsY: 3, offsetX: 0, offsetY: 0 },    // Ground (Z = 0)
      { colsX: 4, colsY: 3, offsetX: 0, offsetY: 0 },    // Level 1 (Z = 1)
      { colsX: 4, colsY: 3, offsetX: 0, offsetY: 0 },    // Level 2 (Z = 2)
      { colsX: 3, colsY: 3, offsetX: 0.5, offsetY: 0 },  // Level 3 (Z = 3 setback)
      { colsX: 2, colsY: 2, offsetX: 1.0, offsetY: 0.5 } // Roof terrace pergola (Z = 4)
    ];

    const floorNodeIndices: number[][] = [];

    floorConfigs.forEach((cfg, floorIdx) => {
      const currentFloorNodes: number[] = [];
      const z = floorIdx * storyH;

      for (let ix = 0; ix < cfg.colsX; ix++) {
        for (let iy = 0; iy < cfg.colsY; iy++) {
          const x = (ix - (cfg.colsX - 1) / 2 + cfg.offsetX) * bayX;
          const y = (iy - (cfg.colsY - 1) / 2 + cfg.offsetY) * bayY;
          const idx = nodes.length;
          nodes.push({ x, y, z });
          currentFloorNodes.push(idx);

          // Horizontal Beams along X
          if (ix > 0) {
            const prevXIdx = idx - cfg.colsY;
            edges.push({ p1: prevXIdx, p2: idx, type: 'beam' });
          }

          // Horizontal Beams along Y
          if (iy > 0) {
            const prevYIdx = idx - 1;
            edges.push({ p1: prevYIdx, p2: idx, type: 'beam' });
          }

          // Pad Footings at Ground Level (Z = 0)
          if (floorIdx === 0) {
            const padSize = 0.35;
            const f1 = nodes.length;
            const f2 = f1 + 1;
            const f3 = f1 + 2;
            const f4 = f1 + 3;
            nodes.push({ x: x - padSize, y: y - padSize, z: -0.2 });
            nodes.push({ x: x + padSize, y: y - padSize, z: -0.2 });
            nodes.push({ x: x + padSize, y: y + padSize, z: -0.2 });
            nodes.push({ x: x - padSize, y: y + padSize, z: -0.2 });
            edges.push({ p1: f1, p2: f2, type: 'footing' });
            edges.push({ p1: f2, p2: f3, type: 'footing' });
            edges.push({ p1: f3, p2: f4, type: 'footing' });
            edges.push({ p1: f4, p2: f1, type: 'footing' });
            // Connect column to footing center
            edges.push({ p1: idx, p2: f1, type: 'footing' });
          }
        }
      }
      floorNodeIndices.push(currentFloorNodes);
    });

    // Vertical Columns connecting floors
    for (let f = 0; f < numStories; f++) {
      const lowerFloor = floorNodeIndices[f];
      const upperFloor = floorNodeIndices[f + 1];

      // Connect lower nodes to nearest upper nodes if distance is small
      for (const lIdx of lowerFloor) {
        const lNode = nodes[lIdx];
        let bestDist = 1.2;
        let bestUpperIdx = -1;

        for (const uIdx of upperFloor) {
          const uNode = nodes[uIdx];
          const dx = lNode.x - uNode.x;
          const dy = lNode.y - uNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bestDist) {
            bestDist = dist;
            bestUpperIdx = uIdx;
          }
        }

        if (bestUpperIdx !== -1) {
          edges.push({ p1: lIdx, p2: bestUpperIdx, type: 'column' });
        }
      }
    }

    // Elevator / Shear Core diagonal cross-braces in central bay
    const corePairs = [
      [0, 1], [1, 2], [2, 3]
    ];
    corePairs.forEach(([fLow, fHigh]) => {
      const low = floorNodeIndices[fLow];
      const high = floorNodeIndices[fHigh];
      if (low.length >= 6 && high.length >= 6) {
        // Cross brace across central core bay
        edges.push({ p1: low[1], p2: high[2], type: 'brace' });
        edges.push({ p1: low[2], p2: high[1], type: 'brace' });
      }
    });

    // Ground plane architectural datum grid lines
    const gridSpan = 7.5;
    const gridStep = 1.5;
    const groundGridNodesStart = nodes.length;
    for (let gx = -gridSpan; gx <= gridSpan; gx += gridStep) {
      const idx1 = nodes.length;
      nodes.push({ x: gx, y: -gridSpan, z: 0 });
      const idx2 = nodes.length;
      nodes.push({ x: gx, y: gridSpan, z: 0 });
      edges.push({ p1: idx1, p2: idx2, type: 'grid' });
    }
    for (let gy = -gridSpan; gy <= gridSpan; gy += gridStep) {
      const idx1 = nodes.length;
      nodes.push({ x: -gridSpan, y: gy, z: 0 });
      const idx2 = nodes.length;
      nodes.push({ x: gridSpan, y: gy, z: 0 });
      edges.push({ p1: idx1, p2: idx2, type: 'grid' });
    }

    // ── Rotation & Mouse Interaction ────────────────────────────────
    let angleY = 0.75; // Initial isometric azimuth
    let angleX = 0.48; // Initial isometric elevation pitch (~28 deg)
    let targetAngleY = angleY;
    let targetAngleX = angleX;
    let scanZ = 0;
    let scanDirection = 1;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseRelX = (e.clientX - rect.left) / rect.width - 0.5;
      const mouseRelY = (e.clientY - rect.top) / rect.height - 0.5;

      // Restrained tilt angle: ±15 degrees max
      targetAngleY = 0.75 + mouseRelX * 0.45;
      targetAngleX = 0.48 - mouseRelY * 0.25;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Resize handler
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

    // ── Main Render Loop ────────────────────────────────────────────
    const maxZ = storyH * numStories;

    const render = () => {
      if (!prefersReducedMotion) {
        // Smooth interpolation (lerp)
        angleY += (targetAngleY - angleY) * 0.04;
        angleX += (targetAngleX - angleX) * 0.04;

        // Subtle ambient continuous drift
        targetAngleY += 0.0006;

        // Elevation scan laser sweep
        scanZ += 0.035 * scanDirection;
        if (scanZ > maxZ + 0.5) {
          scanDirection = -1;
        } else if (scanZ < -0.4) {
          scanDirection = 1;
        }
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Colors based on theme
      const colLineNormal = isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(30, 58, 95, 0.09)';
      const colLineColumns = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(30, 58, 95, 0.15)';
      const colLineBrace = isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(14, 165, 233, 0.18)';
      const colGrid = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(30, 58, 95, 0.04)';
      const colNode = isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(30, 58, 95, 0.35)';
      const colLaser = isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(217, 119, 6, 0.30)';

      // 3D Projection parameters
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // Dynamic scale based on viewport: larger on wide screens, responsive on mobile
      const scale = Math.min(width, height) * 0.085;
      const centerX = width * 0.5;
      const centerY = height * 0.52;

      // Project 3D points to 2D
      const projected: { x: number; y: number; zWorld: number }[] = new Array(nodes.length);

      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        // Rotate around vertical Z axis (yaw)
        const rx = p.x * cosY - p.y * sinY;
        const ry = p.x * sinY + p.y * cosY;
        const rz = p.z;

        // Pitch tilt
        const screenX = centerX + rx * scale;
        const screenY = centerY - (rz * cosX - ry * sinX) * scale;
        projected[i] = { x: screenX, y: screenY, zWorld: p.z };
      }

      // Draw Datum Grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = colGrid;
      ctx.beginPath();
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        if (edge.type === 'grid') {
          const p1 = projected[edge.p1];
          const p2 = projected[edge.p2];
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        }
      }
      ctx.stroke();

      // Draw Structural Edges (Beams, Columns, Bracing, Footings)
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        if (edge.type === 'grid') continue;

        const p1 = projected[edge.p1];
        const p2 = projected[edge.p2];

        // Check if edge is near laser scan elevation
        const midZ = (p1.zWorld + p2.zWorld) * 0.5;
        const distToScan = Math.abs(midZ - scanZ);
        const isNearScan = distToScan < 0.6;

        ctx.beginPath();
        if (edge.type === 'column') {
          ctx.lineWidth = isNearScan ? 1.75 : 1.25;
          ctx.strokeStyle = isNearScan ? colLaser : colLineColumns;
        } else if (edge.type === 'brace') {
          ctx.lineWidth = 1;
          ctx.strokeStyle = colLineBrace;
        } else if (edge.type === 'footing') {
          ctx.lineWidth = 1;
          ctx.strokeStyle = colLineNormal;
        } else {
          ctx.lineWidth = isNearScan ? 1.5 : 1;
          ctx.strokeStyle = isNearScan ? colLaser : colLineNormal;
        }

        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Draw Structural Nodes / Joints (Only for the building, excluding ground grid)
      const buildingNodeCount = groundGridNodesStart;
      for (let i = 0; i < buildingNodeCount; i++) {
        const p = projected[i];
        const distToScan = Math.abs(p.zWorld - scanZ);
        const isNearScan = distToScan < 0.45;

        ctx.fillStyle = isNearScan ? (isDark ? '#F59E0B' : '#D97706') : colNode;
        const radius = isNearScan ? 2.5 : 1.5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Subtle Engineering Height Datums on the Left Edge
      ctx.font = '10px monospace';
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(30, 58, 95, 0.35)';
      ctx.textAlign = 'right';

      const datums = [
        { label: 'ROOF +9.90m', z: 4 * storyH },
        { label: 'FLR3 +6.60m', z: 3 * storyH },
        { label: 'FLR2 +4.80m', z: 2 * storyH },
        { label: 'FLR1 +3.30m', z: 1 * storyH },
        { label: 'PLINTH +0.00m', z: 0 },
      ];

      // Anchor datums relative to the leftmost front column
      const anchorNode = projected[0];
      if (anchorNode && width > 640) {
        datums.forEach(d => {
          const sy = centerY - (d.z * cosX - 0) * scale;
          const sx = anchorNode.x - 45;
          ctx.fillText(d.label, sx, sy + 3);

          // Small datum tick mark
          ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(30, 58, 95, 0.2)';
          ctx.beginPath();
          ctx.moveTo(sx + 6, sy);
          ctx.lineTo(sx + 20, sy);
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
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-0">
      {/* ── Ambient Radial Lighting Layer ───────────────────────── */}
      <div
        className="absolute inset-0 opacity-40 dark:opacity-60 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle at 50% 35%, rgba(245, 158, 11, 0.08) 0%, rgba(56, 189, 248, 0.04) 40%, transparent 70%)',
        }}
      />

      {/* ── Procedural CAD 3D Canvas ────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-70 dark:opacity-85 transition-opacity duration-300"
      />

      {/* ── Radial Center Vignette & Bottom Edge Blend ─────────── */}
      {/* Keeps center text, CTAs, and preview card 100% razor-sharp */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, transparent 20%, var(--bg-primary) 85%)',
        }}
      />
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
    </div>
  );
}
