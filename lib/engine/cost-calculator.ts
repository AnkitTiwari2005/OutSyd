// lib/engine/cost-calculator.ts
// Category aggregation, accuracy band, plinth/cubic estimates
// 18-category world-class engine — Sep 2026

import type {
  EstimateLineItem, CategoryTotal, EstimateResult,
  FullInput, CoefficientDataset, ClassificationResult, AccuracyBand,
} from './types';
import { deriveDimensions } from './estimator';
import { classifyBuilding } from './classifier';
import { CATEGORY_NAMES, ACCURACY_BANDS } from '../constants';

export { CATEGORY_NAMES };

export const BAND_DISPLAY: Record<AccuracyBand, string> = {
  Preliminary_15_20: ACCURACY_BANDS.Preliminary_15_20.fullDisplay,
  Standard_10_15   : ACCURACY_BANDS.Standard_10_15.fullDisplay,
  Advanced_5_10    : ACCURACY_BANDS.Advanced_5_10.fullDisplay,
};

export const BAND_COLOR: Record<AccuracyBand, 'amber' | 'blue' | 'green'> = {
  Preliminary_15_20: ACCURACY_BANDS.Preliminary_15_20.color,
  Standard_10_15   : ACCURACY_BANDS.Standard_10_15.color,
  Advanced_5_10    : ACCURACY_BANDS.Advanced_5_10.color,
};

/**
 * C-5: Determines whether a line item rate already includes installation/subcontract labour.
 * Turnkey subcontract and installed rates are not subjected to the +30% site labour markup.
 * Pure material supply lines (cement, sand, aggregate, TMT steel, structural steel, bricks, blocks, paint materials)
 * receive the +30% site labour uplift.
 */
export function isLabourInclusive(code: string): boolean {
  if (code.startsWith('MAT_PLAST_') || code === 'MAT_EXT_PLAST') return true;
  if (code.startsWith('MAT_CEIL_')) return true;
  if (code.startsWith('MAT_FLOOR_') && code !== 'MAT_FLOOR_MORTAR') return true;
  if (code.startsWith('MAT_WP_')) return true;
  if (code.startsWith('MAT_DOOR_') || code.startsWith('MAT_WIN_') || code === 'MAT_GRILLE' || code === 'MAT_VENT') return true;
  if (code.startsWith('MAT_ELEC_') && (
    code === 'MAT_ELEC_POINT' || code === 'MAT_ELEC_GENSET' || code.includes('SOLAR') ||
    code === 'MAT_ELEC_DB_MAIN' || code === 'MAT_ELEC_DB_FLOOR' || code === 'MAT_ELEC_CCTV' ||
    code === 'MAT_ELEC_FIRE_ALARM' || code === 'MAT_ELEC_ACCESS_CTRL' || code === 'MAT_ELEC_INTERCOM' ||
    code === 'MAT_ELEC_EV_CHARGER' || code === 'MAT_ELEC_BUSDUCT'
  )) return true;
  if (code.startsWith('MAT_SOLAR_') || code.startsWith('MAT_GREEN_')) return true;
  if (code.startsWith('MAT_PLUMB_') && !code.includes('PIPE')) return true;
  if (code.startsWith('MAT_WOOD_')) return true;
  if (
    code.startsWith('MAT_EXT_CLADDING_') || code.startsWith('MAT_EXT_CURTWALL') ||
    code === 'MAT_EXT_PAINT' || code.startsWith('MAT_EXT_BOUNDARY_WALL') ||
    code.startsWith('MAT_EXT_GATE') || code.startsWith('MAT_EXT_PAVING') ||
    code.startsWith('MAT_EXT_ROAD_') || code.startsWith('MAT_EXT_LANDSCAPE') ||
    code.startsWith('MAT_EXT_STONE_CLADDING')
  ) return true;
  if (code.startsWith('MAT_LIFT_') || code.startsWith('MAT_STAIR_RAILING_') || code.startsWith('MAT_STAIR_MARBLE') || code.startsWith('MAT_STAIR_GRANITE')) return true;
  if (code.startsWith('MAT_HVAC_') || code.startsWith('MAT_FIRE_') || code === 'MAT_EXHAUST_FAN') return true;
  if (code.startsWith('MAT_POOL_') || code.startsWith('MAT_GYM_') || code.startsWith('MAT_CLUB_')) return true;
  if (code === 'MAT_MISC_TOTAL' || code === 'MAT_MISC_SCAFFOLD') return true;
  return false;
}

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
  tier2Complete: boolean,
  tier3Complete: boolean,
  hasNotSureFieldsFlag: boolean,
  hasDrawingUpload: boolean,
  hasDrawingParsed = false,
): AccuracyBand {
  if (classificationTier === 1 || !tier2Complete) return 'Preliminary_15_20';
  if (classificationTier === 3) {
    // N-3: Gated behind an actually parsed structural drawing.
    // Unparsed drawings or manual Tier 3 inputs are capped at Standard_10_15.
    if (hasDrawingParsed) return 'Advanced_5_10';
    if (hasNotSureFieldsFlag && !tier3Complete && !hasDrawingUpload) return 'Preliminary_15_20';
    return 'Standard_10_15';
  }
  if (hasNotSureFieldsFlag) return 'Preliminary_15_20';
  return 'Standard_10_15';
}

export function checkTier2Complete(bi: Partial<FullInput>): boolean {
  return !!(bi.structuralSystem && bi.foundationType && bi.seismicZone);
}
export function checkTier3Complete(bi: Partial<FullInput>): boolean {
  return !!(bi.windLoadZone && bi.facadeType && bi.fireHvacScope);
}
export function checkHasNotSureFields(bi: Partial<FullInput>): boolean {
  return [bi.structuralSystem, bi.foundationType, bi.seismicZone,
          bi.windLoadZone, bi.facadeType, bi.fireHvacScope]
    .some(f => f === 'Not_sure');
}

export function resolveAccuracyBandForInput(bi: Partial<FullInput>, hasDrawingParsed = false): AccuracyBand {
  const cls = classifyBuilding({
    numFloors: Number(bi.numFloors) || 1,
    typology: bi.typology ?? 'Residential',
    structuralSystem: bi.structuralSystem,
    seismicZone: bi.seismicZone,
  });
  return computeAccuracyBand(
    cls.tier,
    checkTier2Complete(bi),
    checkTier3Complete(bi),
    checkHasNotSureFields(bi),
    Boolean(bi.structuralDrawingUrl),
    hasDrawingParsed,
  );
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

  // Category totals for all 18 standard categories in consistent sequence
  const categoryTotals: CategoryTotal[] = Object.entries(CATEGORY_NAMES)
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
  const plinthAreaEstimate = Math.round(dim.totalBuaSqft * par * 100) / 100;

  const accuracyBand = resolveAccuracyBandForInput(bi);

  // C-5: Site labour pool computed strictly on raw/pure material supply lines
  let matOnlyCost = 0;
  for (const item of allLineItems) {
    if (!isLabourInclusive(item.materialItemCode)) {
      matOnlyCost += item.lineCost;
    }
  }
  const siteLabour = Math.round(matOnlyCost * 0.30 * 100) / 100;
  const grandTotalWithLabor = Math.round((grandTotal + siteLabour) * 100) / 100;
  const cubicContentEstimate = Math.round(dim.buaPerFloor * bi.heightFt * 100) / 100;

  return {
    lineItems             : allLineItems,
    categoryTotals,
    grandTotalMaterialCost: grandTotal,
    grandTotalWithLabor,
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
