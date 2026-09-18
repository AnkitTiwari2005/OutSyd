// lib/engine/index.ts
// Public API for the OUTSYD estimation engine

export { classifyBuilding, getRequiredTiers } from './classifier';
export { runEstimationEngine, deriveDimensions } from './estimator';
export { aggregateEstimate, computeAccuracyBand, BAND_DISPLAY, BAND_COLOR, CATEGORY_NAMES } from './cost-calculator';
export { DEFAULT_DATASET, REGIONAL_RATE_INDEX, SEISMIC_ZONE_LOOKUP, lookupRegionalIndex, lookupSeismicZone } from './coefficients';
export type {
  FullInput, ClassificationResult, CoefficientDataset, EstimateResult,
  EstimateLineItem, CategoryTotal, AccuracyBand, QualityTier, ClassificationTier,
  BuildingCategory, DerivedDimensions, RoomCounts,
} from './types';
