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
      targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 50;
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

    // Floating ambient dust motes
    const particles: StarParticle[] = [];
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.5 + 0.8,
        alpha: Math.random() * 0.4 + 0.15,
        speed: Math.random() * 0.0003 + 0.00015,
      });
    }

    let animTime = 0;

    // ΓöÇΓöÇ Main Render Loop ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    const render = () => {
      animTime += 0.02;

      if (!prefersReducedMotion) {
        mouseX += (targetMouseX - mouseX) * 0.05;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const baseHorizon = height * 0.86;

      // ΓöÇΓöÇ 1. Volumetric Searchlights (Flanked to Left & Right Wings) ΓöÇ
      // Sweeping from behind the flank towers, angled outwards away from center text!
      const drawSearchlight = (originX: number, originY: number, angle: number, beamWidth: number) => {
        const beamLen = height * 0.95;
        const targetX = originX + Math.sin(angle) * beamLen;
        const targetY = originY - Math.cos(angle) * beamLen;

        const grad = ctx.createRadialGradient(originX, originY, 10, targetX, targetY, beamLen);
        const colStart = isDark ? 'rgba(56, 189, 248, 0.10)' : 'rgba(14, 165, 233, 0.05)';
        grad.addColorStop(0, colStart);
        grad.addColorStop(0.6, isDark ? 'rgba(245, 158, 11, 0.03)' : 'rgba(217, 119, 6, 0.02)');
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(targetX - beamWidth, targetY);
        ctx.lineTo(targetX + beamWidth, targetY);
        ctx.closePath();
        ctx.fill();
      };

      // Searchlight 1: on Left Wing sweeping outward
      const beam1 = -0.32 + Math.sin(animTime * 0.35) * 0.12;
      drawSearchlight(width * 0.16 + mouseX * 0.15, baseHorizon - 90, beam1, 75);

      // Searchlight 2: on Right Wing sweeping outward
      const beam2 = 0.28 + Math.cos(animTime * 0.3) * 0.12;
      drawSearchlight(width * 0.84 + mouseX * 0.15, baseHorizon - 90, beam2, 85);

      // ΓöÇΓöÇ 2. Layer 1: Background Skyline (Golden Canyon Composition) ΓöÇ
      // Notice: Tallest buildings are placed on Left Flank (0-28%) and Right Flank (72-100%).
      // Center (30%-70%) has very low baseline massing to leave headline completely clear!
      const bgOffset = mouseX * 0.12;
      ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.25)' : 'rgba(30, 58, 95, 0.05)';

      const bgBuildings = [
        // Left Flank (Tall Towers)
        { normX: -0.04, normW: 0.08, h: 260 },
        { normX: 0.05, normW: 0.07, h: 320 },
        { normX: 0.13, normW: 0.09, h: 360 }, // Supertall left
        { normX: 0.23, normW: 0.06, h: 250 },
        // Center Clearance Gap (Low baseline only, <= 80px)
        { normX: 0.32, normW: 0.11, h: 65 },
        { normX: 0.44, normW: 0.12, h: 55 },
        { normX: 0.57, normW: 0.12, h: 70 },
        // Right Flank (Tall Towers)
        { normX: 0.70, normW: 0.07, h: 260 },
        { normX: 0.78, normW: 0.09, h: 370 }, // Supertall right
        { normX: 0.88, normW: 0.08, h: 310 },
        { normX: 0.97, normW: 0.08, h: 240 },
      ];

      bgBuildings.forEach(b => {
        const screenX = b.normX * width + bgOffset;
        const bWidth = b.normW * width;
        const bHeight = b.h * (height / 600);
        ctx.fillRect(screenX, baseHorizon - bHeight, bWidth, bHeight);

        // Antenna Spire on flank towers
        if (b.h > 150) {
          ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 58, 95, 0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(screenX + bWidth / 2, baseHorizon - bHeight);
          ctx.lineTo(screenX + bWidth / 2, baseHorizon - bHeight - 32);
          ctx.stroke();
        }
      });

      // ΓöÇΓöÇ 3. Layer 2: Midground High-Rises (Detailed Architecture) ΓöÇΓöÇΓöÇΓöÇ
      const midOffset = mouseX * 0.35;
      const midBuildings = [
        // Left Wing Towers
        { normX: -0.02, normW: 0.07, h: 220, type: 'block' },
        { normX: 0.06, normW: 0.08, h: 310, type: 'spire' },
        { normX: 0.15, normW: 0.09, h: 380, type: 'diagrid' }, // Diagrid landmark
        { normX: 0.25, normW: 0.06, h: 240, type: 'stepped' },
        // Center Open Plaza / Low Riverwalk (Keeps text completely unobstructed)
        { normX: 0.33, normW: 0.09, h: 60, type: 'plinth' },
        { normX: 0.43, normW: 0.14, h: 45, type: 'plinth' },
        { normX: 0.58, normW: 0.10, h: 55, type: 'plinth' },
        // Right Wing Towers
        { normX: 0.69, normW: 0.06, h: 230, type: 'stepped' },
        { normX: 0.76, normW: 0.065, h: 320, type: 'twin1' }, // Twin Tower 1
        { normX: 0.835, normW: 0.065, h: 320, type: 'twin2' }, // Twin Tower 2
        { normX: 0.91, normW: 0.08, h: 390, type: 'spire' }, // Pinnacle
        { normX: 1.00, normW: 0.07, h: 210, type: 'block' },
      ];

      midBuildings.forEach((b, idx) => {
        const screenX = b.normX * width + midOffset;
        const bWidth = Math.max(b.normW * width, 45);
        const bHeight = b.h * (height / 580);
        const topY = baseHorizon - bHeight;

        // Visual treatment:
        // In Dark mode: obsidian slate body + cyan rim lighting
        // In Light mode: ultra-clean architectural ink sketch (whisper-thin lines, subtle tint)
        if (isDark) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
          ctx.lineWidth = 1.25;
        } else {
          ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
          ctx.strokeStyle = 'rgba(30, 58, 95, 0.20)';
          ctx.lineWidth = 1;
        }

        if (b.type === 'stepped') {
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

          // Diagrid trusses on landmark tower
          if (b.type === 'diagrid') {
            ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(30, 58, 95, 0.12)';
            ctx.lineWidth = 0.85;
            const numDiags = 5;
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
            const nextX = nextB.normX * width + midOffset;
            const bridgeY = topY + bHeight * 0.32;
            const bridgeH = 14;
            ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.92)' : 'rgba(241, 245, 249, 0.95)';
            ctx.fillRect(screenX + bWidth, bridgeY, nextX - (screenX + bWidth), bridgeH);
            ctx.strokeRect(screenX + bWidth, bridgeY, nextX - (screenX + bWidth), bridgeH);
          }
        }

        // Spire & Blinking Aviation Beacon
        if (b.type === 'spire') {
          const spireH = 42;
          ctx.strokeStyle = isDark ? '#38BDF8' : '#0284C7';
          ctx.lineWidth = 1.25;
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

        // Windows (Rendered only on tall flank buildings, NOT in center!)
        if (b.h > 150) {
          const cols = 4;
          const rows = 12;
          const winW = (bWidth - 14) / cols;
          const winH = 3.5;
          const padX = 3;
          const padY = 8;

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const lit = ((idx * 13 + r * 7 + c * 11) % 10) > 4;
              if (lit) {
                const wx = screenX + padX + c * (winW + padX);
                const wy = topY + 22 + r * (winH + padY);
                if (wy < baseHorizon - 10) {
                  if (isDark) {
                    const isWarm = ((idx + r + c) % 3) === 0;
                    ctx.fillStyle = isWarm ? 'rgba(245, 158, 11, 0.65)' : 'rgba(56, 189, 248, 0.55)';
                  } else {
                    // Refined architectural ink & light cyan glazing in light mode
                    ctx.fillStyle = 'rgba(14, 165, 233, 0.20)';
                  }
                  ctx.fillRect(wx, wy, winW, winH);
                }
              }
            }
          }
        }
      });

      // ΓöÇΓöÇ 4. Layer 3: Construction Tower Cranes (Stationed on Flanks) ΓöÇΓöÇ
      const fgOffset = mouseX * 0.55;
      // Crane 1 on Left Flank; Crane 2 on Right Flank (Zero obstruction in center!)
      const cranes = [
        { x: width * 0.24 + fgOffset, baseY: baseHorizon, mastH: 280, jibL: 110, counterJibL: 35 },
        { x: width * 0.74 + fgOffset, baseY: baseHorizon, mastH: 300, jibL: 125, counterJibL: 38 },
      ];

      cranes.forEach(crane => {
        const topMastY = crane.baseY - crane.mastH;
        ctx.strokeStyle = isDark ? '#F59E0B' : 'rgba(30, 58, 95, 0.45)';
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

        // Slewing Cab
        ctx.fillStyle = isDark ? '#F59E0B' : 'rgba(30, 58, 95, 0.55)';
        ctx.fillRect(crane.x - 6, topMastY - 8, 12, 8);

        // Apex Tower Peak
        const peakY = topMastY - 22;
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
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(30, 58, 95, 0.3)';
        ctx.fillRect(crane.x - crane.counterJibL, jibY - 2, 8, 10);

        // Oscillating Trolley & Hoist Cable
        const trolleyX = crane.x + crane.jibL * 0.55 + Math.sin(animTime * 0.5) * 18;
        const cableH = 60 + Math.cos(animTime * 0.7) * 14;
        ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.6)' : 'rgba(14, 165, 233, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(trolleyX, jibY);
        ctx.lineTo(trolleyX, jibY + cableH);
        ctx.stroke();

        // Hook Block
        ctx.fillStyle = isDark ? '#F59E0B' : 'rgba(30, 58, 95, 0.55)';
        ctx.fillRect(trolleyX - 3, jibY + cableH, 6, 6);

        // Blinking Crane Peak Beacon
        const craneBlink = (Math.sin(animTime * 5) + 1) * 0.5;
        ctx.fillStyle = `rgba(239, 68, 68, ${craneBlink * 0.9})`;
        ctx.beginPath();
        ctx.arc(crane.x, peakY, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // ΓöÇΓöÇ 5. Layer 4: Cable-Stayed Suspension Bridge ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
      const bridgePylonX = width * 0.5 + fgOffset * 0.4;
      const pylonH = 150;
      const pylonTopY = baseHorizon - pylonH;

      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.30)' : 'rgba(30, 58, 95, 0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bridgePylonX, pylonTopY);
      ctx.lineTo(bridgePylonX - 25, baseHorizon);
      ctx.moveTo(bridgePylonX, pylonTopY);
      ctx.lineTo(bridgePylonX + 25, baseHorizon);
      ctx.moveTo(bridgePylonX - 14, baseHorizon - 60);
      ctx.lineTo(bridgePylonX + 14, baseHorizon - 60);
      ctx.stroke();

      // Radiating Stay Cables
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(14, 165, 233, 0.14)';
      ctx.lineWidth = 0.8;
      const numCables = 6;
      for (let c = 1; c <= numCables; c++) {
        const anchorDist = c * 35;
        const cableTop = pylonTopY + c * 10;
        ctx.beginPath();
        ctx.moveTo(bridgePylonX, cableTop);
        ctx.lineTo(bridgePylonX - anchorDist, baseHorizon - 8);
        ctx.moveTo(bridgePylonX, cableTop);
        ctx.lineTo(bridgePylonX + anchorDist, baseHorizon - 8);
        ctx.stroke();
      }

      // Base Promenade Deck
      ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(241, 245, 249, 0.90)';
      ctx.fillRect(0, baseHorizon - 8, width, 12);
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.30)' : 'rgba(30, 58, 95, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, baseHorizon - 8, width, 12);

      // ΓöÇΓöÇ 6. Ambient Light Particles ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
      particles.forEach(p => {
        p.y -= p.speed;
        if (p.y < 0) p.y = 1;

        const px = p.x * width + mouseX * 0.1;
        const py = p.y * height;
        const pAlpha = p.alpha * (0.6 + Math.sin(animTime + p.x * 10) * 0.4);

        ctx.fillStyle = isDark
          ? `rgba(56, 189, 248, ${pAlpha * 0.55})`
          : `rgba(14, 165, 233, ${pAlpha * 0.35})`;
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
      {/* ΓöÇΓöÇ Atmospheric Ambient Sky Glow ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <div
        className="absolute inset-0 opacity-40 dark:opacity-60 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle at 50% 25%, rgba(56, 189, 248, 0.08) 0%, rgba(245, 158, 11, 0.03) 50%, transparent 75%)',
        }}
      />

      {/* ΓöÇΓöÇ Flanked Architectural Skyline Canvas ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-85 dark:opacity-90 transition-opacity duration-300"
      />

      {/* ΓöÇΓöÇ High-Clarity Center Text Isolation & Vignette Mask ΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      {/* Dark Mode: Pure obsidian center backdrop ensures white text is 100% sharp */}
      {/* Light Mode: Pure luminous white center backdrop eliminates all clutter/murkiness */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          background: `
            radial-gradient(ellipse at 50% 38%,
              var(--bg-primary) 0%,
              var(--bg-primary) 32%,
              transparent 75%
            )
          `,
          opacity: 0.88,
        }}
      />

      {/* Edge Blends */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[var(--bg-primary)] to-transparent" />
    </div>
  );
}
