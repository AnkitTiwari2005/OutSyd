// lib/utils.ts — shared utility helpers
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind class merger */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format INR currency */
export function formatINR(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000)    return `₹${(amount / 100_000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/** Full INR with commas */
export function formatINRFull(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/** Timeline estimate based on BUA and typology */
export function estimateTimeline(buaSqft: number, numFloors: number, typology: string): {
  totalMonths: [number, number];
  phases: Array<{ name: string; months: [number, number]; pct: number }>;
} {
  const base = buaSqft < 2000 ? 12 : buaSqft < 5000 ? 18 : buaSqft < 15000 ? 24 : 36;
  const floorExtra = Math.max(0, numFloors - 3) * 1.5;
  const typologyFactor = typology === 'Industrial' ? 0.8 : typology === 'Commercial' ? 1.2 : 1.0;
  const total = Math.round((base + floorExtra) * typologyFactor);
  const lo = Math.max(6, total - 3);
  const hi = total + 4;

  return {
    totalMonths: [lo, hi],
    phases: [
      { name: 'Site Prep & Foundation',  months: [1, Math.round(total * 0.18)],  pct: 18 },
      { name: 'RCC Structure',           months: [Math.round(total * 0.18), Math.round(total * 0.45)], pct: 27 },
      { name: 'Masonry & MEP',           months: [Math.round(total * 0.45), Math.round(total * 0.65)], pct: 20 },
      { name: 'Finishes & Fit-out',      months: [Math.round(total * 0.65), Math.round(total * 0.88)], pct: 23 },
      { name: 'Handover & Snag Fixes',   months: [Math.round(total * 0.88), total],                    pct: 12 },
    ],
  };
}

/** Labour breakdown by trade (% of site labour pool) */
export function computeLabourBreakdown(totalLabourAmount: number): Array<{
  trade: string; pct: number; amount: number;
}> {
  const trades = [
    { trade: 'RCC & Formwork Labour',    pct: 28 },
    { trade: 'Masonry Labour',           pct: 18 },
    { trade: 'Plastering Labour',        pct: 10 },
    { trade: 'Flooring Labour',          pct:  9 },
    { trade: 'Painting Labour',          pct:  8 },
    { trade: 'Electrical Labour',        pct:  8 },
    { trade: 'Plumbing Labour',          pct:  7 },
    { trade: 'Carpentry Labour',         pct:  6 },
    { trade: 'Waterproofing Labour',     pct:  4 },
    { trade: 'Steel Fixing Labour',      pct:  2 },
  ];
  const labourPool = totalLabourAmount;
  return trades.map(t => ({
    ...t,
    amount: Math.round(labourPool * t.pct / 100),
  }));
}

/** Material alternative savings */
export function computeAlternatives(
  grandTotal: number,
  qualityTier: string,
): Array<{ from: string; to: string; saving: number; savingPct: number }> {
  if (qualityTier === 'Premium') return [
    { from: 'Italian Marble',      to: 'Engineered Stone',      saving: Math.round(grandTotal * 0.025), savingPct: 2.5 },
    { from: 'UPVC Thermally Broken', to: 'Standard UPVC',        saving: Math.round(grandTotal * 0.018), savingPct: 1.8 },
    { from: 'Crystalline WP',      to: 'Liquid PU Membrane',    saving: Math.round(grandTotal * 0.009), savingPct: 0.9 },
  ];
  if (qualityTier === 'Standard') return [
    { from: 'Vitrified Tiles',     to: 'Ceramic Tiles',         saving: Math.round(grandTotal * 0.022), savingPct: 2.2 },
    { from: 'UPVC Windows',        to: 'Aluminium Windows',     saving: Math.round(grandTotal * 0.015), savingPct: 1.5 },
    { from: 'AAC Blocks',          to: 'Fly Ash Bricks',        saving: Math.round(grandTotal * 0.011), savingPct: 1.1 },
  ];
  return []; // Economy — already at minimum
}
