// lib/engine/classifier.ts
// FR-2: Deterministic Building Classification Engine
// Pure function — no side effects, no DB calls

import type { ClassificationResult, ClassificationTier, BuildingCategory } from './types';

interface ClassifierInput {
  numFloors       : number;
  typology        : string;
  structuralSystem: string;
  seismicZone     : string;
}

/**
 * Classifies a building into a tier (1/2/3) and category.
 * BR-1: numFloors > 3 OR non-residential → Tier 2
 * BR-2: numFloors > 7 OR Steel/Shear_Wall OR Zone IV/V → Tier 3
 */
export function classifyBuilding(input: ClassifierInput): ClassificationResult {
  const reasons: string[] = [];
  let tier: ClassificationTier = 1;
  let category: BuildingCategory = 'Small_Residential';

  const isNonResidential = ['Commercial', 'Institutional', 'Industrial'].includes(input.typology);

  // ── BR-1: Tier 2 triggers ─────────────────────────────────────────────────
  const isTier2 = input.numFloors > 3 || isNonResidential;
  if (isTier2) {
    tier = 2;
    if (input.typology === 'Commercial') {
      category = 'Mid_Rise_Commercial';
    } else if (input.typology === 'Institutional') {
      category = 'Institutional_Facility';
    } else if (input.typology === 'Industrial') {
      category = 'Industrial_Facility';
    } else {
      category = 'Small_Residential';
    }
    if (input.numFloors > 3)  reasons.push(`${input.numFloors} floors exceeds 3-floor Tier 1 threshold`);
    if (isNonResidential)     reasons.push(`Non-residential typology: ${input.typology}`);
  }

  // ── BR-2: Tier 3 triggers ─────────────────────────────────────────────────
  const isSteelOrShearWall = ['Steel', 'Shear_Wall'].includes(input.structuralSystem);
  const isHighSeismic       = ['Zone_IV', 'Zone_V'].includes(input.seismicZone);
  const isTier3 = input.numFloors > 7 || isSteelOrShearWall || isHighSeismic;

  if (isTier3) {
    tier = 3;
    if (input.numFloors > 7)  { category = 'High_Rise'; reasons.push(`${input.numFloors} floors exceeds 7-floor Tier 2 threshold`); }
    if (isSteelOrShearWall)   reasons.push(`Structural system requires specialist detailing: ${input.structuralSystem}`);
    if (isHighSeismic)        reasons.push(`High seismic zone requires ductile detailing: ${input.seismicZone}`);
  }

  // ── Complex Specialized override ─────────────────────────────────────────
  if (['Institutional', 'Industrial'].includes(input.typology) && input.numFloors > 5) {
    category = 'Complex_Specialized';
    reasons.push('Multi-storey Institutional/Industrial → Complex Specialized');
  }

  return { tier, category, reasons };
}

/**
 * Determines which form tiers should be revealed in the UI.
 * Used by EstimateFormShell.tsx to conditionally show Tier 2/3 fields.
 */
export function getRequiredTiers(input: Partial<ClassifierInput>): {
  showTier2: boolean;
  showTier3: boolean;
} {
  const showTier2 = (input.numFloors ?? 0) > 3
    || ['Commercial', 'Institutional', 'Industrial'].includes(input.typology ?? '');

  const showTier3 = (input.numFloors ?? 0) > 7
    || ['Steel', 'Shear_Wall'].includes(input.structuralSystem ?? '')
    || ['Zone_IV', 'Zone_V'].includes(input.seismicZone ?? '');

  return { showTier2, showTier3 };
}
