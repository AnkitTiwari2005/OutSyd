// lib/engine/cost-calculator.ts
// Category aggregation, accuracy band, plinth/cubic estimates
// 18-category world-class engine — Sep 2026

import type {
  EstimateLineItem, CategoryTotal, EstimateResult,
  FullInput, CoefficientDataset, ClassificationResult, AccuracyBand,
} from './types';
import { deriveDimensions } from './estimator';

export const CATEGORY_NAMES: Record<string, string> = {
  CAT_01: 'Substructure & Excavation',
  CAT_02: 'RCC Superstructure',
  CAT_03: 'Masonry, Plaster & Internal Finishes',
  CAT_04: 'Waterproofing & Chemical Treatment',
  CAT_05: 'Roofing & False Ceiling',
  CAT_06: 'Doors, Windows & Glazing',
  CAT_07: 'Electrical & Low-Voltage Systems',
  CAT_08: 'Plumbing, Sanitary & STP',
  CAT_09: 'Flooring & Tiling',
  CAT_10: 'Wall Finishing & Painting',
  CAT_11: 'Modular Kitchen, Joinery & Woodwork',
  CAT_12: 'Exterior Finishing & Cladding',
  CAT_13: 'Staircase, Railings & Lifts',
  CAT_14: 'HVAC, Fire Protection & MEP',
  CAT_15: 'Parking & Basement',
  CAT_16: 'Swimming Pool & Recreation',
  CAT_17: 'Solar & Green Building',
  CAT_18: 'Preliminaries, Site & Contingency',
};

export const BAND_DISPLAY: Record<AccuracyBand, string> = {
  Preliminary_15_20: '± 15–20% (Preliminary Estimate)',
  Standard_10_15   : '± 10–15% (Standard Estimate)',
  Advanced_5_10    : '± 5–10% (Advanced Estimate)',
};

export const BAND_COLOR: Record<AccuracyBand, 'amber' | 'blue' | 'green'> = {
  Preliminary_15_20: 'amber',
  Standard_10_15   : 'blue',
  Advanced_5_10    : 'green',
};

const DISCLAIMER =
  'This estimate is for planning purposes only (accuracy band as stated). ' +
  'It is NOT a substitute for a detailed Bill of Quantities prepared by a ' +
  'licensed structural engineer or certified quantity surveyor. ' +
  'OUTSYD does not guarantee construction outcomes. ' +
  'Engage qualified professionals before committing to construction. ' +
  'Rates based on CPWD DSR 2024 & market surveys (Sep 2026).';

// ─── Accuracy Band ────────────────────────────────────────────────────────────
export function computeAccuracyBand(
  classificationTier: 1 | 2 | 3,
  tier2Complete: boolean, tier3Complete: boolean,
  hasNotSureFieldsFlag: boolean, hasDrawingUpload: boolean,
): AccuracyBand {
  if (classificationTier === 1 || !tier2Complete) return 'Preliminary_15_20';
  if (classificationTier === 3) {
    if ((tier3Complete && !hasNotSureFieldsFlag) || hasDrawingUpload) return 'Advanced_5_10';
    return 'Standard_10_15';
  }
  if (hasNotSureFieldsFlag) return 'Preliminary_15_20';
  return 'Standard_10_15';
}

function checkTier2Complete(bi: FullInput): boolean {
  return !!(bi.structuralSystem && bi.foundationType && bi.seismicZone);
}
function checkTier3Complete(bi: FullInput): boolean {
  return !!(bi.windLoadZone && bi.facadeType && bi.fireHvacScope);
}
function checkHasNotSureFields(bi: FullInput): boolean {
  return [bi.structuralSystem, bi.foundationType, bi.seismicZone,
          bi.windLoadZone, bi.facadeType, bi.fireHvacScope]
    .some(f => f === 'Not_sure');
}

// ─── Main Aggregator ──────────────────────────────────────────────────────────
export function aggregateEstimate(
  lineItems: EstimateLineItem[], bi: FullInput,
  cls: ClassificationResult, ds: CoefficientDataset, ri: number,
): EstimateResult {
  const dim = deriveDimensions(bi);

  // Category subtotals
  const catMap: Record<string, number> = {};
  for (const item of lineItems) {
    catMap[item.categoryCode] = (catMap[item.categoryCode] ?? 0) + item.lineCost;
  }

  // CAT_18: Preliminaries & Contingency (3.5% of all other)
  const subTotal    = Object.values(catMap).reduce((a, b) => a + b, 0);
  const miscTotal   = Math.round(subTotal * ds.miscPct * 100) / 100;
  catMap['CAT_18']  = miscTotal;

  const miscLineItem: EstimateLineItem = {
    materialItemCode : 'MAT_MISC_TOTAL',
    name             : `Preliminaries, Site & Contingency (${(ds.miscPct * 100).toFixed(1)}%)`,
    categoryCode     : 'CAT_18',
    quantity         : 1,
    unit             : 'lump sum',
    recommendedGrade : '—',
    unitRate         : miscTotal,
    lineCost         : miscTotal,
    isApproximate    : true,
    approximateNote  : `${(ds.miscPct * 100).toFixed(1)}% of total material cost — standard industry practice`,
  };

  const allLineItems = [...lineItems, miscLineItem];
  const grandTotal   = Math.round((subTotal + miscTotal) * 100) / 100;

  // Category totals (only non-zero)
  const categoryTotals: CategoryTotal[] = Object.entries(CATEGORY_NAMES)
    .filter(([code]) => (catMap[code] ?? 0) > 0)
    .map(([code, name]) => ({
      categoryCode: code,
      name,
      subtotal: Math.round((catMap[code] ?? 0) * 100) / 100,
    }));

  // Plinth Area Rate (₹/sqft, Sep 2026 validated)
  const parRates: Record<string, Record<string, number>> = {
    Economy : { Residential: 1700, Commercial: 2300, Institutional: 2500, Industrial: 1500 },
    Standard: { Residential: 2300, Commercial: 3200, Institutional: 3400, Industrial: 2000 },
    Premium : { Residential: 3200, Commercial: 4500, Institutional: 5000, Industrial: 2800 },
  };
  const par = ((parRates[bi.qualityTier] ?? parRates.Standard)[bi.typology] ?? 2300) * ri;
  const plinthAreaEstimate   = Math.round(dim.totalBuaSqft * par * 100) / 100;
  const cubicContentEstimate = Math.round(dim.totalBuaSqft * (bi.heightFt / bi.numFloors) * (par / 10) * 100) / 100;

  const accuracyBand = computeAccuracyBand(
    cls.tier,
    checkTier2Complete(bi),
    checkTier3Complete(bi),
    checkHasNotSureFields(bi),
    !!bi.structuralDrawingUrl,
  );

  return {
    lineItems             : allLineItems,
    categoryTotals,
    grandTotalMaterialCost: grandTotal,
    grandTotalWithLabor   : Math.round(grandTotal * 1.30 * 100) / 100,
    plinthAreaEstimate,
    cubicContentEstimate,
    accuracyBand,
    accuracyBandDisplay   : BAND_DISPLAY[accuracyBand],
    accuracyBandColor     : BAND_COLOR[accuracyBand],
    classification        : cls,
    regionalIndexApplied  : ri,
    coefficientDatasetVersion: ds.version,
    disclaimer            : DISCLAIMER,
    derivedDimensions     : dim,
  };
}
