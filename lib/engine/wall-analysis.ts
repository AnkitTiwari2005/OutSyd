// lib/engine/wall-analysis.ts
// Comparative quantity surveying for building walls:
// 1. Long Wall - Short Wall Method (Separate Wall Method / Out-to-Out & In-to-In)
// 2. Center Line Method (Continuous Centerline with Corner/Junction Deductions)
// Strictly follows IS 1200 (Part IV: Masonry) and CPWD DSR standard estimation methodology.

export interface WallMethodDetail {
  methodName: string;
  description: string;
  wallThicknessFt: number;
  wallThicknessMm: number;
  longWallLengthFt: number;
  shortWallLengthFt: number;
  effectivePerimeterPerFloorFt: number;
  totalRunningLengthFt: number;
  // Single wall per-floor costs
  costPerLongWallMat: number;
  costPerLongWallTurnkey: number;
  costPerShortWallMat: number;
  costPerShortWallTurnkey: number;
  // All walls combined across all floors
  totalLongWallsCostMat: number;
  totalShortWallsCostMat: number;
  totalCostMat: number;
  totalCostTurnkey: number;
}

export interface WallAnalysisResult {
  inputs: {
    outerLengthFt: number;
    outerBreadthFt: number;
    heightFt: number;
    numFloors: number;
    floorHeightFt: number;
    wallThicknessFt: number;
    wallThicknessMm: number;
  };
  centerToCenter: {
    lengthCcFt: number;
    breadthCcFt: number;
    totalCenterLinePerFloorFt: number;
    totalCenterLineAllFloorsFt: number;
  };
  longShortWallMethod: WallMethodDetail;
  centerLineMethod: WallMethodDetail;
  rates: {
    materialCostPerRft: number;
    turnkeyCostPerRft: number;
    materialCostPerSqftWall: number;
    turnkeyCostPerSqftWall: number;
  };
  totalWallMaterialCost: number;
  totalWallTurnkeyCost: number;
  reconciliation: {
    methodsMatch: boolean;
    difference: number;
    totalWallAreaSqft: number;
  };
  bestApproachRecommendation: {
    recommendedMethod: 'Center Line Method' | 'Long Wall - Short Wall Method';
    verdictTitle: string;
    primaryReason: string;
    rationaleDetails: string[];
    whenToUseAlternative: string;
  };
}

/**
 * Calculates per-wall dimensional takeoff and costing comparing:
 * 1. Long Wall - Short Wall Method
 * 2. Center Line Method
 *
 * @param bi Building dimensions (outer length, breadth, total height, num floors, typology)
 * @param masonryMaterialCost Total direct material cost for masonry & plaster (CAT_03)
 * @param wallThicknessInches Standard main envelope wall thickness (default 9 inches / 230mm)
 */
export function calculateWallAnalysis(
  bi: {
    lengthFt: number;
    breadthFt: number;
    heightFt: number;
    numFloors: number;
    typology?: string;
  },
  masonryMaterialCost: number,
  wallThicknessInches = 9,
): WallAnalysisResult {
  const outerLength = Math.max(bi.lengthFt, bi.breadthFt);
  const outerBreadth = Math.min(bi.lengthFt, bi.breadthFt);
  const numFloors = Math.max(1, bi.numFloors);
  const floorHeightFt = Math.round((bi.heightFt / numFloors) * 100) / 100;
  const wallThicknessFt = Math.round((wallThicknessInches / 12) * 1000) / 1000; // 0.75 ft
  const wallThicknessMm = Math.round(wallThicknessFt * 304.8); // 229 -> ~230 mm

  // ── Center-to-Center Dimensions ──────────────────────────────────────────
  // c/c length = Out-to-out length - 2 * (T / 2) = L - T
  const lengthCcFt = Math.round((outerLength - wallThicknessFt) * 100) / 100;
  // c/c breadth = Out-to-out breadth - 2 * (T / 2) = B - T
  const breadthCcFt = Math.round((outerBreadth - wallThicknessFt) * 100) / 100;

  // Centerline perimeter per floor = 2 * (L_cc + B_cc)
  const totalCenterLinePerFloorFt = Math.round(2 * (lengthCcFt + breadthCcFt) * 100) / 100;
  const totalCenterLineAllFloorsFt = Math.round(totalCenterLinePerFloorFt * numFloors * 100) / 100;

  // Total superficial wall face area across all floors = Total RFT * Floor Height
  const totalWallAreaSqft = Math.round(totalCenterLineAllFloorsFt * floorHeightFt * 100) / 100;

  // Total wall material cost and turnkey cost (+30% site labour)
  const totalWallMaterialCost = Math.max(0, Math.round(masonryMaterialCost * 100) / 100);
  const totalWallTurnkeyCost = Math.round(totalWallMaterialCost * 1.30 * 100) / 100;

  // Linear rates per Running Foot (RFT)
  const materialCostPerRft = totalCenterLineAllFloorsFt > 0
    ? Math.round((totalWallMaterialCost / totalCenterLineAllFloorsFt) * 100) / 100
    : 0;
  const turnkeyCostPerRft = totalCenterLineAllFloorsFt > 0
    ? Math.round((totalWallTurnkeyCost / totalCenterLineAllFloorsFt) * 100) / 100
    : 0;

  // Area rates per sqft of wall face
  const materialCostPerSqftWall = totalWallAreaSqft > 0
    ? Math.round((totalWallMaterialCost / totalWallAreaSqft) * 100) / 100
    : 0;
  const turnkeyCostPerSqftWall = totalWallAreaSqft > 0
    ? Math.round((totalWallTurnkeyCost / totalWallAreaSqft) * 100) / 100
    : 0;

  // ── Method 1: Long Wall - Short Wall Method (Separate Wall Method) ─────────
  // Long Wall Length (out-to-out) = c/c length + 2 * (T / 2) = lengthCcFt + T = outerLength
  const longWallLengthFt = Math.round((lengthCcFt + wallThicknessFt) * 100) / 100;
  // Short Wall Length (in-to-in) = c/c breadth - 2 * (T / 2) = breadthCcFt - T = outerBreadth - 2*T
  const shortWallLengthFt = Math.round((breadthCcFt - wallThicknessFt) * 100) / 100;

  // Effective perimeter per floor = 2 * LongWall + 2 * ShortWall
  const lwEffectivePerimeterPerFloorFt = Math.round((2 * longWallLengthFt + 2 * shortWallLengthFt) * 100) / 100;
  const lwTotalRunningLengthFt = Math.round(lwEffectivePerimeterPerFloorFt * numFloors * 100) / 100;

  // Cost per single long wall (per floor)
  const lwCostPerLongWallMat = Math.round(longWallLengthFt * materialCostPerRft * 100) / 100;
  const lwCostPerLongWallTurnkey = Math.round(longWallLengthFt * turnkeyCostPerRft * 100) / 100;

  // Cost per single short wall (per floor)
  const lwCostPerShortWallMat = Math.round(shortWallLengthFt * materialCostPerRft * 100) / 100;
  const lwCostPerShortWallTurnkey = Math.round(shortWallLengthFt * turnkeyCostPerRft * 100) / 100;

  // Total for all long walls and short walls
  const totalLongWallsCostMat = Math.round(2 * numFloors * lwCostPerLongWallMat * 100) / 100;
  const totalShortWallsCostMat = Math.round(2 * numFloors * lwCostPerShortWallMat * 100) / 100;
  const lwTotalCostMat = Math.round((totalLongWallsCostMat + totalShortWallsCostMat) * 100) / 100;
  const lwTotalCostTurnkey = Math.round(lwTotalCostMat * 1.30 * 100) / 100;

  const longShortWallMethod: WallMethodDetail = {
    methodName: 'Long Wall - Short Wall Method',
    description: 'Separate wall method (Out-to-out for long walls, In-to-in for short walls). Corners are inherently deducted by shortening cross walls.',
    wallThicknessFt,
    wallThicknessMm,
    longWallLengthFt,
    shortWallLengthFt,
    effectivePerimeterPerFloorFt: lwEffectivePerimeterPerFloorFt,
    totalRunningLengthFt: lwTotalRunningLengthFt,
    costPerLongWallMat: lwCostPerLongWallMat,
    costPerLongWallTurnkey: lwCostPerLongWallTurnkey,
    costPerShortWallMat: lwCostPerShortWallMat,
    costPerShortWallTurnkey: lwCostPerShortWallTurnkey,
    totalLongWallsCostMat,
    totalShortWallsCostMat,
    totalCostMat: lwTotalCostMat,
    totalCostTurnkey: lwTotalCostTurnkey,
  };

  // ── Method 2: Center Line Method ─────────────────────────────────────────
  // Total center line length = 2 * (lengthCc + breadthCc).
  // For standard rectangular perimeter with 4 corners, overlap balances deduction: Net deduction = 0.
  const clEffectivePerimeterPerFloorFt = totalCenterLinePerFloorFt;
  const clTotalRunningLengthFt = totalCenterLineAllFloorsFt;

  // Centerline mean cost attributed per wall
  const clCostPerLongWallMat = Math.round(lengthCcFt * materialCostPerRft * 100) / 100;
  const clCostPerLongWallTurnkey = Math.round(lengthCcFt * turnkeyCostPerRft * 100) / 100;

  const clCostPerShortWallMat = Math.round(breadthCcFt * materialCostPerRft * 100) / 100;
  const clCostPerShortWallTurnkey = Math.round(breadthCcFt * turnkeyCostPerRft * 100) / 100;

  const clTotalLongWallsCostMat = Math.round(2 * numFloors * clCostPerLongWallMat * 100) / 100;
  const clTotalShortWallsCostMat = Math.round(2 * numFloors * clCostPerShortWallMat * 100) / 100;
  const clTotalCostMat = totalWallMaterialCost;
  const clTotalCostTurnkey = totalWallTurnkeyCost;

  const centerLineMethod: WallMethodDetail = {
    methodName: 'Center Line Method',
    description: 'Continuous centerline takeoff. Highly rapid and accurate for structures with symmetrical plans and uniform wall thickness.',
    wallThicknessFt,
    wallThicknessMm,
    longWallLengthFt: lengthCcFt,
    shortWallLengthFt: breadthCcFt,
    effectivePerimeterPerFloorFt: clEffectivePerimeterPerFloorFt,
    totalRunningLengthFt: clTotalRunningLengthFt,
    costPerLongWallMat: clCostPerLongWallMat,
    costPerLongWallTurnkey: clCostPerLongWallTurnkey,
    costPerShortWallMat: clCostPerShortWallMat,
    costPerShortWallTurnkey: clCostPerShortWallTurnkey,
    totalLongWallsCostMat: clTotalLongWallsCostMat,
    totalShortWallsCostMat: clTotalShortWallsCostMat,
    totalCostMat: clTotalCostMat,
    totalCostTurnkey: clTotalCostTurnkey,
  };

  // ── Reconciliation ───────────────────────────────────────────────────────
  const diff = Math.abs(lwTotalCostMat - clTotalCostMat);
  const methodsMatch = diff <= 2; // within small integer rounding tolerance

  // ── Best Approach Recommendation ─────────────────────────────────────────
  const isFramedOrCommercial = bi.typology === 'Commercial' || bi.typology === 'Institutional' || numFloors > 2;

  const bestApproachRecommendation = {
    recommendedMethod: 'Center Line Method' as const,
    verdictTitle: 'Center Line Method is the Recommended Best Approach',
    primaryReason: isFramedOrCommercial
      ? 'Optimal for RCC framed & multi-storey structures where wall thickness is uniform and corners are continuous.'
      : 'Fastest, mathematically exact, and minimizes corner deduction errors for standard rectangular and villa layouts.',
    rationaleDetails: [
      'Zero Discrepancy: Both methods converge to the exact same total physical masonry volume (effective perimeter = ' + totalCenterLinePerFloorFt + ' ft/floor).',
      'Execution Speed: Centerline method requires a single continuous linear measurement rather than alternating out-to-out and in-to-in offsets.',
      'Contractor Billing Alignment: Running foot (RFT) and square foot rates map directly to standard Indian civil subcontract billing schedules (IS 1200 / CPWD DSR).',
      'Lower Error Probability: Eliminates inadvertent arithmetic sign errors when transitioning between foundation footing widths and superstructure masonry courses.',
    ],
    whenToUseAlternative: 'Use the Long Wall - Short Wall Method primarily for traditional load-bearing brick masonry structures featuring stepped foundation footings of varying widths (e.g. 90cm PCC -> 70cm -> 50cm -> 40cm -> 23cm plinth wall), where each step requires a discrete offset calculation.',
  };

  return {
    inputs: {
      outerLengthFt: outerLength,
      outerBreadthFt: outerBreadth,
      heightFt: bi.heightFt,
      numFloors,
      floorHeightFt,
      wallThicknessFt,
      wallThicknessMm,
    },
    centerToCenter: {
      lengthCcFt,
      breadthCcFt,
      totalCenterLinePerFloorFt,
      totalCenterLineAllFloorsFt,
    },
    longShortWallMethod,
    centerLineMethod,
    rates: {
      materialCostPerRft,
      turnkeyCostPerRft,
      materialCostPerSqftWall,
      turnkeyCostPerSqftWall,
    },
    totalWallMaterialCost,
    totalWallTurnkeyCost,
    reconciliation: {
      methodsMatch,
      difference: diff,
      totalWallAreaSqft,
    },
    bestApproachRecommendation,
  };
}
