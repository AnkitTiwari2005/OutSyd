'use client';

import React from 'react';
import { Building2, Film } from 'lucide-react';
import { HeroVideoBackground } from './hero-backgrounds/HeroVideoBackground';
import { HeroSkylineBackground } from './hero-backgrounds/HeroSkylineBackground';

export type ArchitecturalHeroStyle = 'skyline' | 'video';

interface HeroArchitecturalCanvasProps {
  activeStyle: ArchitecturalHeroStyle;
}

export function HeroArchitecturalCanvas({ activeStyle }: HeroArchitecturalCanvasProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-0">
      {/* Style 1: Parametric Skyline Vista (Default) */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
          activeStyle === 'skyline' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        {activeStyle === 'skyline' && <HeroSkylineBackground />}
      </div>

      {/* Style 2: Engineering Construction Reel */}
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

// ── Floating Interactive 2-Way Switcher ──────────────────────────────
interface HeroStyleSwitcherProps {
  activeStyle: ArchitecturalHeroStyle;
  onStyleChange: (style: ArchitecturalHeroStyle) => void;
}

export function HeroStyleSwitcher({ activeStyle, onStyleChange }: HeroStyleSwitcherProps) {
  const styles: { id: ArchitecturalHeroStyle; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'skyline',
      label: 'Skyline Vista',
      icon: <Building2 size={14} className="text-indigo-500 dark:text-indigo-400" />,
      desc: 'Layered architectural city skyline with tower cranes & searchlights',
    },
    {
      id: 'video',
      label: 'Engineering Reel',
      icon: <Film size={14} className="text-emerald-600 dark:text-emerald-400" />,
      desc: 'Structural steel erection & crane timelapse with technical engineering HUD',
    },
  ];

  return (
    <div className="inline-flex flex-col items-center">
      <div className="inline-flex items-center gap-1 p-1 bg-[var(--bg-secondary)]/90 dark:bg-[#0f131c]/90 backdrop-blur-md border border-[var(--border-color)] rounded-full shadow-sm">
        <span className="text-[11px] font-semibold text-[var(--text-muted)] px-2.5 hidden sm:inline tracking-tight">
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
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
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
