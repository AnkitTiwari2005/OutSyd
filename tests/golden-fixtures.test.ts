import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { runEstimationEngine } from '../lib/engine/estimator';
import { classifyBuilding } from '../lib/engine/classifier';
import { aggregateEstimate, resolveAccuracyBandForInput } from '../lib/engine/cost-calculator';
import { DEFAULT_DATASET } from '../lib/engine/coefficients';
import { lookupRegionalIndex } from '../lib/engine/regions';
import { CATEGORY_NAMES } from '../lib/constants';
import type { FullInput } from '../lib/engine/types';

// ═══════════════════════════════════════════════════════════════════════════════
// GOLDEN REGRESSION FIXTURES (PHASE 4 & PHASE 14/15)
// ═══════════════════════════════════════════════════════════════════════════════
// Immutable canonical fixtures locking down exact mathematical and engineering
// derivations for Residential, Commercial, Institutional, and Industrial typologies.

export const GOLDEN_RESIDENTIAL: FullInput = {
  lengthFt: 50,
  breadthFt: 40,
  heightFt: 30,
  plotAreaSqft: 5000,
  numFloors: 3,
  typology: 'Residential',
  buildingUse: '3BHK',
  soilType: 'Normal',
  locationRegion: 'Ludhiana',
  qualityTier: 'Standard',
  structuralSystem: 'RCC_Frame',
  foundationType: 'Isolated',
  numLifts: 0,
  numStaircases: 1,
  parkingLevels: 0,
  unitsPerFloor: 2,
  seismicZone: 'Zone_III',
  soilBearingCapacity: 200,
  windLoadZone: 'Moderate',
  serviceFloors: 0,
  podiumLevels: 0,
  facadeType: 'Conventional',
  fireHvacScope: 'Basic',
  targetTimelineMonths: 24, // uncompressed duration -> 0 fast-track surcharge
  greenCertTarget: 'None',
  localRateOverrides: [],
};

export const GOLDEN_COMMERCIAL: FullInput = {
  lengthFt: 80,
  breadthFt: 60,
  heightFt: 55,
  plotAreaSqft: 10000,
  numFloors: 5,
  typology: 'Commercial',
  buildingUse: 'Office',
  soilType: 'Normal',
  locationRegion: 'Bengaluru',
  qualityTier: 'Standard',
  structuralSystem: 'RCC_Frame',
  foundationType: 'Isolated',
  numLifts: 2,
  numStaircases: 2,
  parkingLevels: 1,
  unitsPerFloor: 4,
  seismicZone: 'Zone_II',
  soilBearingCapacity: 250,
  windLoadZone: 'Moderate',
  serviceFloors: 0,
  podiumLevels: 0,
  facadeType: 'Conventional',
  fireHvacScope: 'Basic',
  targetTimelineMonths: 24, // compressed relative to normal 32.4 months
  greenCertTarget: 'None',
  localRateOverrides: [],
};

export const GOLDEN_INSTITUTIONAL: FullInput = {
  lengthFt: 100,
  breadthFt: 80,
  heightFt: 45,
  plotAreaSqft: 15000,
  numFloors: 4,
  typology: 'Institutional',
  buildingUse: 'School',
  soilType: 'Normal',
  locationRegion: 'Pune',
  qualityTier: 'Standard',
  structuralSystem: 'RCC_Frame',
  foundationType: 'Isolated',
  numLifts: 1,
  numStaircases: 2,
  parkingLevels: 0,
  unitsPerFloor: 1,
  seismicZone: 'Zone_III',
  soilBearingCapacity: 220,
  windLoadZone: 'Moderate',
  serviceFloors: 0,
  podiumLevels: 0,
  facadeType: 'Conventional',
  fireHvacScope: 'Basic',
  targetTimelineMonths: 24,
  greenCertTarget: 'None',
  localRateOverrides: [],
};

export const GOLDEN_INDUSTRIAL: FullInput = {
  lengthFt: 200,
  breadthFt: 150,
  heightFt: 25,
  plotAreaSqft: 40000,
  numFloors: 1,
  typology: 'Industrial',
  buildingUse: 'Warehouse',
  soilType: 'Normal',
  locationRegion: 'Ludhiana',
  qualityTier: 'Standard',
  structuralSystem: 'Steel',
  foundationType: 'Isolated',
  numLifts: 0,
  numStaircases: 1,
  parkingLevels: 0,
  unitsPerFloor: 1,
  seismicZone: 'Zone_III',
  soilBearingCapacity: 200,
  windLoadZone: 'Moderate',
  serviceFloors: 0,
  podiumLevels: 0,
  facadeType: 'Conventional',
  fireHvacScope: 'Basic',
  targetTimelineMonths: 18,
  greenCertTarget: 'None',
  localRateOverrides: [],
};

describe('PHASE 4: Golden Regression Fixtures & Determinism Certification', () => {
  it('certifies GOLDEN_RESIDENTIAL fixture metrics and calculation invariants', () => {
    const input = GOLDEN_RESIDENTIAL;
    const cls = classifyBuilding(input);
    const band = resolveAccuracyBandForInput(input);
    const { index: ri } = lookupRegionalIndex(input.locationRegion);

    assert.equal(cls.category, 'Small_Residential');
    assert.equal(cls.tier, 1);
    assert.equal(band, 'Preliminary_15_20');

    const items = runEstimationEngine(input, cls, DEFAULT_DATASET, ri);
    const res = aggregateEstimate(items, input, cls, DEFAULT_DATASET, ri);

    // Verify line item count and exact totals
    assert.equal(res.lineItems.length, 90);
    assert.equal(res.grandTotalMaterialCost, 11442787.87);
    assert.equal(res.grandTotalWithLabor, 12859642.3);

    // CAT_18 Base preliminaries exact 3.5% invariant
    const cat01to17Sum = res.categoryTotals
      .filter((c) => c.categoryCode !== 'CAT_18')
      .reduce((s, c) => s + c.subtotal, 0);
    const expectedCat18Base = Math.round(cat01to17Sum * DEFAULT_DATASET.miscPct * 100) / 100;
    const baseItem = res.lineItems.find((i) => i.materialItemCode === 'MAT_MISC_TOTAL');
    assert.ok(baseItem);
    assert.equal(baseItem.lineCost, 386954.18);
    assert.equal(baseItem.lineCost, expectedCat18Base);

    // Fast-track surcharge should be 0 because 24 months is not compressed for 6000 sqft residential
    const accelItem = res.lineItems.find((i) => i.materialItemCode === 'MAT_PRELIM_ACCEL');
    assert.equal(accelItem, undefined);

    // Composite deliverable key uniqueness
    const deliverableKeys = res.lineItems.map(
      (i) => `${i.materialItemCode}::${i.name}::${i.recommendedGrade}`
    );
    assert.equal(new Set(deliverableKeys).size, deliverableKeys.length);

    // Hash stability
    const hash = crypto.createHash('md5').update(JSON.stringify(res.lineItems)).digest('hex');
    assert.equal(hash, 'ef9bc9f7d6322a1d40720ac9f00ac528');
  });

  it('certifies GOLDEN_COMMERCIAL fixture metrics and calculation invariants', () => {
    const input = GOLDEN_COMMERCIAL;
    const cls = classifyBuilding(input);
    const band = resolveAccuracyBandForInput(input);
    const { index: ri } = lookupRegionalIndex(input.locationRegion);

    assert.equal(cls.category, 'Mid_Rise_Commercial');
    assert.equal(cls.tier, 2);
    assert.equal(band, 'Standard_10_15');

    const items = runEstimationEngine(input, cls, DEFAULT_DATASET, ri);
    const res = aggregateEstimate(items, input, cls, DEFAULT_DATASET, ri);

    assert.equal(res.lineItems.length, 92);
    assert.equal(res.grandTotalMaterialCost, 62997608.09);
    assert.equal(res.grandTotalWithLabor, 70949658.27);

    // Base CAT_18 vs fast-track acceleration surcharge breakdown
    const cat01to17Sum = res.categoryTotals
      .filter((c) => c.categoryCode !== 'CAT_18')
      .reduce((s, c) => s + c.subtotal, 0);
    const expectedCat18Base = Math.round(cat01to17Sum * DEFAULT_DATASET.miscPct * 100) / 100;
    const baseItem = res.lineItems.find((i) => i.materialItemCode === 'MAT_MISC_TOTAL');
    const accelItem = res.lineItems.find((i) => i.materialItemCode === 'MAT_PRELIM_ACCEL');

    assert.ok(baseItem && accelItem);
    assert.equal(baseItem.lineCost, expectedCat18Base);
    assert.equal(baseItem.lineCost, 1860688.85);
    assert.equal(accelItem.lineCost, 7974380.77);

    // CAT_18 total must equal base + surcharge exactly
    const cat18Total = res.categoryTotals.find((c) => c.categoryCode === 'CAT_18')?.subtotal;
    assert.equal(cat18Total, Math.round((baseItem.lineCost + accelItem.lineCost) * 100) / 100);

    const deliverableKeys = res.lineItems.map(
      (i) => `${i.materialItemCode}::${i.name}::${i.recommendedGrade}`
    );
    assert.equal(new Set(deliverableKeys).size, deliverableKeys.length);

    const hash = crypto.createHash('md5').update(JSON.stringify(res.lineItems)).digest('hex');
    assert.equal(hash, 'f7965da7b6fd322599006956dd397b52');
  });

  it('certifies GOLDEN_INSTITUTIONAL fixture metrics and calculation invariants', () => {
    const input = GOLDEN_INSTITUTIONAL;
    const cls = classifyBuilding(input);
    const band = resolveAccuracyBandForInput(input);
    const { index: ri } = lookupRegionalIndex(input.locationRegion);

    assert.equal(cls.category, 'Institutional_Facility');
    assert.equal(cls.tier, 2);
    assert.equal(band, 'Standard_10_15');

    const items = runEstimationEngine(input, cls, DEFAULT_DATASET, ri);
    const res = aggregateEstimate(items, input, cls, DEFAULT_DATASET, ri);

    assert.equal(res.lineItems.length, 93);
    assert.equal(res.grandTotalMaterialCost, 67025197.99);
    assert.equal(res.grandTotalWithLabor, 76376899.88);

    const cat01to17Sum = res.categoryTotals
      .filter((c) => c.categoryCode !== 'CAT_18')
      .reduce((s, c) => s + c.subtotal, 0);
    const expectedCat18Base = Math.round(cat01to17Sum * DEFAULT_DATASET.miscPct * 100) / 100;
    const baseItem = res.lineItems.find((i) => i.materialItemCode === 'MAT_MISC_TOTAL');
    const accelItem = res.lineItems.find((i) => i.materialItemCode === 'MAT_PRELIM_ACCEL');

    assert.ok(baseItem && accelItem);
    assert.equal(baseItem.lineCost, expectedCat18Base);
    assert.equal(baseItem.lineCost, 1979647.2);
    assert.equal(accelItem.lineCost, 8484202.28);

    const deliverableKeys = res.lineItems.map(
      (i) => `${i.materialItemCode}::${i.name}::${i.recommendedGrade}`
    );
    assert.equal(new Set(deliverableKeys).size, deliverableKeys.length);

    const hash = crypto.createHash('md5').update(JSON.stringify(res.lineItems)).digest('hex');
    assert.equal(hash, '377e44d0f700c166f2bf448ee46d9bf7');
  });

  it('certifies GOLDEN_INDUSTRIAL fixture metrics and calculation invariants', () => {
    const input = GOLDEN_INDUSTRIAL;
    const cls = classifyBuilding(input);
    const band = resolveAccuracyBandForInput(input);
    const { index: ri } = lookupRegionalIndex(input.locationRegion);

    assert.equal(cls.category, 'Industrial_Facility');
    assert.equal(cls.tier, 3); // Steel structural system triggers Tier 3
    assert.equal(band, 'Standard_10_15');

    const items = runEstimationEngine(input, cls, DEFAULT_DATASET, ri);
    const res = aggregateEstimate(items, input, cls, DEFAULT_DATASET, ri);

    assert.equal(res.lineItems.length, 62);
    assert.equal(res.grandTotalMaterialCost, 41940504.26);
    assert.equal(res.grandTotalWithLabor, 50492210.01);

    const cat01to17Sum = res.categoryTotals
      .filter((c) => c.categoryCode !== 'CAT_18')
      .reduce((s, c) => s + c.subtotal, 0);
    const expectedCat18Base = Math.round(cat01to17Sum * DEFAULT_DATASET.miscPct * 100) / 100;
    const baseItem = res.lineItems.find((i) => i.materialItemCode === 'MAT_MISC_TOTAL');
    const accelItem = res.lineItems.find((i) => i.materialItemCode === 'MAT_PRELIM_ACCEL');

    assert.ok(baseItem && accelItem);
    assert.equal(baseItem.lineCost, expectedCat18Base);
    assert.equal(baseItem.lineCost, 1238749.07);
    assert.equal(accelItem.lineCost, 5308924.59);

    // Verify legitimate dual use of MAT_FLOOR_IPS for both interior Trimix and loading dock apron
    const ipsItems = res.lineItems.filter((i) => i.materialItemCode === 'MAT_FLOOR_IPS');
    assert.equal(ipsItems.length, 2);
    assert.equal(ipsItems[0].name, 'Heavy-duty Trimix / VDF Concrete Floor');
    assert.equal(ipsItems[1].name, 'External Loading Bay & Dock Apron Concrete');

    // Deliverable keys are completely distinct
    const deliverableKeys = res.lineItems.map(
      (i) => `${i.materialItemCode}::${i.name}::${i.recommendedGrade}`
    );
    assert.equal(new Set(deliverableKeys).size, deliverableKeys.length);

    const hash = crypto.createHash('md5').update(JSON.stringify(res.lineItems)).digest('hex');
    assert.equal(hash, '015764a157a9b94e7cf45954af09610c');
  });

  it('validates presence of all 18 categories across all four golden fixtures', () => {
    const fixtures = [GOLDEN_RESIDENTIAL, GOLDEN_COMMERCIAL, GOLDEN_INSTITUTIONAL, GOLDEN_INDUSTRIAL];
    const expectedCategories = Object.keys(CATEGORY_NAMES).sort();

    for (const fixture of fixtures) {
      const cls = classifyBuilding(fixture);
      const { index: ri } = lookupRegionalIndex(fixture.locationRegion);
      const items = runEstimationEngine(fixture, cls, DEFAULT_DATASET, ri);
      const res = aggregateEstimate(items, fixture, cls, DEFAULT_DATASET, ri);

      const actualCategories = res.categoryTotals.map((c) => c.categoryCode).sort();
      assert.deepEqual(actualCategories, expectedCategories);

      // Verify category totals sum equals grand total material cost exactly
      const sum = Math.round(res.categoryTotals.reduce((s, c) => s + c.subtotal, 0) * 100) / 100;
      assert.equal(sum, res.grandTotalMaterialCost);
    }
  });
});
