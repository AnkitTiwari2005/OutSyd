'use client';

import React from 'react';
import { Compass, Box, Building2, Film } from 'lucide-react';
import { HeroVideoBackground } from './hero-backgrounds/HeroVideoBackground';
import { HeroBlueprintBackground } from './hero-backgrounds/HeroBlueprintBackground';
import { HeroSolidBuildingBackground } from './hero-backgrounds/HeroSolidBuildingBackground';
import { HeroSkylineBackground } from './hero-backgrounds/HeroSkylineBackground';

export type ArchitecturalHeroStyle = 'blueprint' | 'building3d' | 'skyline' | 'video';

interface HeroArchitecturalCanvasProps {
  activeStyle: ArchitecturalHeroStyle;
}

export function HeroArchitecturalCanvas({ activeStyle }: HeroArchitecturalCanvasProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-0">
      {/* Style 1: CAD Blueprint Floor Plan */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
          activeStyle === 'blueprint' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        {activeStyle === 'blueprint' && <HeroBlueprintBackground />}
      </div>

      {/* Style 2: 3D Solid Architectural Building Model */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
          activeStyle === 'building3d' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        {activeStyle === 'building3d' && <HeroSolidBuildingBackground />}
      </div>

      {/* Style 3: Parametric City Skyline Vista */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
          activeStyle === 'skyline' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        {activeStyle === 'skyline' && <HeroSkylineBackground />}
      </div>

      {/* Style 4: Cinematic Video Loop */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
          activeStyle === 'video' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        {activeStyle === 'video' && <HeroVideoBackground />}
      </div>
    </div>
  );
}

// ── Floating Interactive Style Switcher ──────────────────────────────
interface HeroStyleSwitcherProps {
  activeStyle: ArchitecturalHeroStyle;
  onStyleChange: (style: ArchitecturalHeroStyle) => void;
}

export function HeroStyleSwitcher({ activeStyle, onStyleChange }: HeroStyleSwitcherProps) {
  const styles: { id: ArchitecturalHeroStyle; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'blueprint',
      label: 'CAD Blueprint',
      icon: <Compass size={14} className="text-sky-500" />,
      desc: 'IS 1200 2D CAD floor plan with columns & dimension strings',
    },
    {
      id: 'building3d',
      label: '3D Solid Model',
      icon: <Box size={14} className="text-amber-500" />,
      desc: 'Solid extruded floor slabs, glass facades & twilight illumination',
    },
    {
      id: 'skyline',
      label: 'Skyline Vista',
      icon: <Building2 size={14} className="text-indigo-400" />,
      desc: 'Layered architectural city skyline with tower cranes & searchlights',
    },
    {
      id: 'video',
      label: 'Cinematic Reel',
      icon: <Film size={14} className="text-emerald-500" />,
      desc: '4K architectural timelapse loop with technical engineering HUD',
    },
  ];

  return (
    <div className="inline-flex flex-col items-center">
      <div className="inline-flex items-center gap-1 p-1 bg-[var(--bg-secondary)]/90 dark:bg-[#0f131c]/90 backdrop-blur-md border border-[var(--border-color)] rounded-full shadow-sm">
        <span className="text-[11px] font-semibold text-[var(--text-muted)] px-2.5 hidden md:inline tracking-tight">
          Architecture Mode:
        </span>

        {styles.map(s => {
          const isActive = activeStyle === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onStyleChange(s.id)}
              title={s.desc}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-[#1a2234] text-[var(--accent-navy)] shadow-sm font-semibold border border-[var(--border-color)] scale-[1.02]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]/50'
              }`}
              aria-pressed={isActive}
            >
              {s.icon}
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
