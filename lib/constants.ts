// lib/constants.ts — Engineering/Finance Design System Constants

// Colorblind-safe qualitative palette for 18 categories (ColorBrewer Set2 / Tableau Safe)
// Strictly avoids #D97706 (CTA amber) and #16A34A (Success green)
export const QUALITATIVE_CHART_COLORS = [
  '#1E3A5F', // Deep Navy (Primary chart)
  '#4E79A7', // Slate Blue
  '#499894', // Teal
  '#86BCB6', // Soft Aqua
  '#E15759', // Muted Coral
  '#B07AA1', // Dusty Plum
  '#9C755F', // Warm Taupe
  '#BAB0AC', // Stone Gray
  '#59A14F', // Muted Olive (distinct from #16A34A)
  '#79706E', // Charcoal Tint
  '#8898AA', // Steel Blue
  '#D4A6C8', // Lavender
  '#8F99FB', // Periwinkle
  '#6388B4', // Soft Cobalt
  '#55B396', // Pale Spruce
  '#E29D80', // Terracotta
  '#9D7660', // Umber
  '#A0B1BA', // Slate Mist
];

export const CATEGORY_COLORS: Record<string, string> = {
  CAT_01: '#1E3A5F', // Substructure — Deep Navy
  CAT_02: '#4E79A7', // RCC Superstructure — Slate Blue
  CAT_03: '#499894', // Masonry — Teal
  CAT_04: '#86BCB6', // Waterproofing — Soft Aqua
  CAT_05: '#79706E', // Roofing — Charcoal Tint
  CAT_06: '#B07AA1', // Doors & Windows — Dusty Plum
  CAT_07: '#E15759', // Electrical — Muted Coral
  CAT_08: '#6388B4', // Plumbing & STP — Soft Cobalt
  CAT_09: '#59A14F', // Flooring — Muted Olive
  CAT_10: '#9C755F', // Painting — Warm Taupe
  CAT_11: '#D4A6C8', // Kitchen & Woodwork — Lavender
  CAT_12: '#8F99FB', // Exterior — Periwinkle
  CAT_13: '#8898AA', // Staircase & Lifts — Steel Blue
  CAT_14: '#E29D80', // HVAC & Fire — Terracotta
  CAT_15: '#55B396', // Parking & Basement — Pale Spruce
  CAT_16: '#9D7660', // Pool & Recreation — Umber
  CAT_17: '#A0B1BA', // Solar & Green — Slate Mist
  CAT_18: '#BAB0AC', // Preliminaries — Stone Gray
};

export const CATEGORY_COLOR_DEFAULT = '#94A3B8';

export function getCategoryColor(code: string): string {
  return CATEGORY_COLORS[code] ?? CATEGORY_COLOR_DEFAULT;
}

// Timeline phase colors — restrained muted progression
export const PHASE_COLORS = [
  '#1E3A5F', // Foundations
  '#4E79A7', // Superstructure
  '#499894', // Masonry & MEP
  '#B07AA1', // Finishes
  '#79706E', // Handover & External
];

// Accuracy band configuration per semantic rules
export const BAND_CONFIG: Record<string, {
  icon: 'Gauge' | 'Info' | 'CheckCircle2';
  label: string;
  cls: string;
  iconCls: string;
}> = {
  Preliminary_15_20: {
    icon: 'Gauge',
    label: '±15–20% Preliminary Estimate',
    cls: 'bg-[#FEF3C7] border-[#FDE68A] text-[#B45309]',
    iconCls: 'text-[#B45309]',
  },
  Standard_10_15: {
    icon: 'Info',
    label: '±10–15% Standard Estimate',
    cls: 'bg-[#EFF4FA] border-[#CBD5E1] text-[#1E3A5F]',
    iconCls: 'text-[#1E3A5F]',
  },
  Advanced_5_10: {
    icon: 'CheckCircle2',
    label: '±5–10% Advanced Estimate',
    cls: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]',
    iconCls: 'text-[#16A34A]',
  },
};

// Design system primary palette tokens
export const DESIGN_TOKENS = {
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F7F8FA',
  bgCard: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textMuted: '#64748B',
  accentNavy: '#1E3A5F',
  ctaAmber: '#D97706',
  successGreen: '#16A34A',
  warningAmber: '#B45309',
} as const;
