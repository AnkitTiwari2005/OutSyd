// lib/engine/types.ts
// Core TypeScript types for the OUTSYD Estimation Engine

export type Typology = 'Residential' | 'Commercial' | 'Institutional' | 'Industrial';
export type QualityTier = 'Economy' | 'Standard' | 'Premium';
export type SoilType = 'Normal' | 'Rocky' | 'Filled-up' | 'Waterlogged-prone';
export type StructuralSystem = 'RCC_Frame' | 'Load_bearing' | 'Steel' | 'Shear_Wall' | 'Not_sure';
export type FoundationType = 'Isolated' | 'Raft' | 'Pile' | 'Not_sure';
export type SeismicZone = 'Zone_II' | 'Zone_III' | 'Zone_IV' | 'Zone_V' | 'Not_sure';
export type WindZone = 'Low' | 'Moderate' | 'High' | 'Cyclone_prone' | 'Not_sure';
export type FacadeType = 'Curtain_Wall' | 'ACP_Cladding' | 'Conventional' | 'Not_sure';
export type HvacScope = 'Basic' | 'Full_Central' | 'Not_sure';
export type AccuracyBand = 'Preliminary_15_20' | 'Standard_10_15' | 'Advanced_5_10';
export type ClassificationTier = 1 | 2 | 3;
export type BuildingCategory =
  | 'Small_Residential'
  | 'Mid_Rise_Residential'
  | 'Mid_Rise_Commercial'
  | 'Institutional_Facility'
  | 'Industrial_Facility'
  | 'High_Rise'
  | 'Complex_Specialized';
export type FloorTier = 'G1_G3' | 'G4_G7' | 'G8_G15' | 'G16_PLUS';

// ─── Input ─────────────────────────────────────────────────────────────────
export interface FullInput {
  // Tier 1 (always required)
  lengthFt        : number;
  breadthFt       : number;
  heightFt        : number;
  plotAreaSqft    : number;
  numFloors       : number;
  typology        : Typology;
  buildingUse     : string;
  soilType        : SoilType;
  locationRegion  : string;
  qualityTier     : QualityTier;

  // Tier 2 (conditional)
  structuralSystem?  : StructuralSystem;
  foundationType?    : FoundationType;
  numLifts?          : number;
  numStaircases?     : number;
  parkingLevels?     : number;
  unitsPerFloor?     : number;
  seismicZone?       : SeismicZone;

  // Tier 3 (conditional)
  soilBearingCapacity?: number;
  windLoadZone?       : WindZone;
  serviceFloors?      : number;
  podiumLevels?       : number;
  facadeType?         : FacadeType;
  fireHvacScope?      : HvacScope;
  structuralDrawingUrl?: string;

  // Optional extras
  targetTimelineMonths?: number;
  greenCertTarget?     : 'None' | 'IGBC' | 'GRIHA';
  localRateOverrides?  : Array<{ materialItemCode: string; rate: number }>;
}

// ─── Classification ─────────────────────────────────────────────────────────
export interface ClassificationResult {
  tier    : ClassificationTier;
  category: BuildingCategory;
  reasons : string[];
}

// ─── Coefficient Dataset ────────────────────────────────────────────────────
export interface CoefficientDataset {
  version : string;
  rates   : Record<string, number>;  // materialItemCode → base rate (INR)
  labourInclusive: Record<string, boolean>; // materialItemCode → boolean (true = turnkey/installed, false = raw material needing +30% site labour)
  grades  : Record<QualityTier, Record<string, string>>; // tier → code → grade label
  seismicMultipliers: Record<SeismicZone, number>;
  qualityMultipliers: Record<QualityTier, number>;
  structMultipliers : Record<StructuralSystem, { cm: number; sm: number; mm: number }>;
  floorCementCoeff  : Record<FloorTier, number>;
  floorSteelCoeff   : Record<FloorTier, number>;
  miscPct           : number;  // CAT_14 as decimal, e.g. 0.033
}

// ─── Estimation Output ──────────────────────────────────────────────────────
export interface EstimateLineItem {
  materialItemCode : string;
  name             : string;
  categoryCode     : string;
  quantity         : number;
  unit             : string;
  recommendedGrade : string;
  unitRate         : number;
  lineCost         : number;
  isApproximate    : boolean;
  approximateNote? : string;
}

export interface CategoryTotal {
  categoryCode: string;
  name        : string;
  subtotal    : number;
}

export interface EstimateResult {
  lineItems             : EstimateLineItem[];
  categoryTotals        : CategoryTotal[];
  grandTotalMaterialCost: number;
  grandTotalWithLabor   : number;  // +30% labor markup
  plinthAreaEstimate    : number;
  cubicContentEstimate? : number;
  accuracyBand          : AccuracyBand;
  accuracyBandDisplay   : string;
  accuracyBandColor     : 'amber' | 'blue' | 'green';
  classification        : ClassificationResult;
  regionalIndexApplied  : number;
  coefficientDatasetVersion: string;
  disclaimer            : string;
  derivedDimensions     : DerivedDimensions;
}

export interface DerivedDimensions {
  buaPerFloor   : number;
  totalBuaSqft  : number;
  totalBuaSqm   : number;
  perimeterFt   : number;
  facadeAreaSqft: number;
  wallAreaSqft  : number;
  terraceArea   : number;
  floorTier     : FloorTier;
  roomCounts    : RoomCounts;
}

export interface RoomCounts {
  doors    : number;
  windows  : number;
  bathrooms: number;
  kitchens : number;
  units    : number;
}
