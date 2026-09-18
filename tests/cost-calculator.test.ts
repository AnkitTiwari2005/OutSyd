import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeAccuracyBand, isLabourInclusive, aggregateEstimate } from '../lib/engine/cost-calculator';
import { DEFAULT_DATASET } from '../lib/engine/coefficients';
import { classifyBuilding } from '../lib/engine/classifier';
import type { FullInput, EstimateLineItem } from '../lib/engine/types';

describe('Accuracy Band Computation (computeAccuracyBand)', () => {
  it('assigns Preliminary_15_20 for Tier 1 inputs', () => {
    const band = computeAccuracyBand(1, true, true, false, false);
    assert.equal(band, 'Preliminary_15_20');
  });

  it('assigns Preliminary_15_20 if Tier 2 is incomplete', () => {
    const band = computeAccuracyBand(2, false, false, false, false);
    assert.equal(band, 'Preliminary_15_20');
  });

  it('assigns Preliminary_15_20 for Tier 2 if any field is "Not_sure"', () => {
    const band = computeAccuracyBand(2, true, false, true, false);
    assert.equal(band, 'Preliminary_15_20');
  });

  it('assigns Standard_10_15 for Tier 2 when complete without "Not_sure"', () => {
    const band = computeAccuracyBand(2, true, false, false, false);
    assert.equal(band, 'Standard_10_15');
  });

  it('caps Tier 3 at Standard_10_15 when complete without parsed drawing (N-3)', () => {
    const band = computeAccuracyBand(3, true, true, false, false);
    assert.equal(band, 'Standard_10_15');
  });

  it('caps Tier 3 at Standard_10_15 when unparsed structural drawing URL is provided (N-3)', () => {
    const band = computeAccuracyBand(3, true, false, true, true, false);
    assert.equal(band, 'Standard_10_15');
  });

  it('assigns Advanced_5_10 only when structural drawing is verified/parsed (N-3)', () => {
    const band = computeAccuracyBand(3, true, true, false, true, true);
    assert.equal(band, 'Advanced_5_10');
  });
});

describe('Labour Inclusivity Guard (isLabourInclusive)', () => {
  it('classifies finished / turnkey / subcontract items as labour-inclusive', () => {
    assert.equal(isLabourInclusive('MAT_PLAST_INT_CEMENT'), true);
    assert.equal(isLabourInclusive('MAT_FLOOR_VITRIFIED'), true);
    assert.equal(isLabourInclusive('MAT_DOOR_FLUSH'), true);
    assert.equal(isLabourInclusive('MAT_WIN_UPVC'), true);
    assert.equal(isLabourInclusive('MAT_WP_TOILET'), true);
    assert.equal(isLabourInclusive('MAT_ELEC_POINT'), true);
    assert.equal(isLabourInclusive('MAT_LIFT_8P'), true);
    assert.equal(isLabourInclusive('MAT_HVAC_VRF'), true);
    assert.equal(isLabourInclusive('MAT_SOLAR_PANEL_ROO'), true);
  });

  it('classifies pure commodities as non-labour-inclusive (receiving +30% site labour)', () => {
    assert.equal(isLabourInclusive('MAT_RCC_CEMENT'), false);
    assert.equal(isLabourInclusive('MAT_RCC_STEEL'), false);
    assert.equal(isLabourInclusive('MAT_RCC_SAND'), false);
    assert.equal(isLabourInclusive('MAT_RCC_AGGREGATE_20MM'), false);
    assert.equal(isLabourInclusive('MAT_MASON_BLOCK'), false);
    assert.equal(isLabourInclusive('MAT_MASON_BRICK'), false);
    assert.equal(isLabourInclusive('MAT_FOUND_STEEL'), false);
    assert.equal(isLabourInclusive('MAT_STEEL_STRUCT'), false);
  });
});

describe('Estimate Aggregator (aggregateEstimate)', () => {
  const dummyInput: FullInput = {
    lengthFt: 40, breadthFt: 30, heightFt: 22, plotAreaSqft: 2400, numFloors: 2,
    typology: 'Residential', buildingUse: 'Villa', soilType: 'Normal',
    locationRegion: 'Bengaluru', qualityTier: 'Standard',
  };
  const cls = classifyBuilding(dummyInput);

  const sampleItems: EstimateLineItem[] = [
    {
      materialItemCode: 'MAT_RCC_STEEL',
      name: 'TMT Reinforcement Steel (Fe 500D)',
      categoryCode: 'CAT_02',
      quantity: 1000,
      unit: 'kg',
      recommendedGrade: 'Fe 500D',
      unitRate: 70,
      lineCost: 70000,
      isApproximate: false,
    },
    {
      materialItemCode: 'MAT_FLOOR_VITRIFIED',
      name: 'Vitrified Floor Tiles',
      categoryCode: 'CAT_09',
      quantity: 500,
      unit: 'sqft',
      recommendedGrade: 'Premium GVT',
      unitRate: 120,
      lineCost: 60000,
      isApproximate: false,
    },
  ];

  it('adds CAT_18 Preliminaries & Contingency at 3.5%', () => {
    const res = aggregateEstimate(sampleItems, dummyInput, cls, DEFAULT_DATASET, 1.0);
    const cat18 = res.categoryTotals.find(c => c.categoryCode === 'CAT_18');
    assert.ok(cat18);
    assert.equal(cat18.subtotal, Math.round((70000 + 60000) * 0.035 * 100) / 100);
  });

  it('verifies categoryTotals sum matches grandTotalMaterialCost exactly', () => {
    const res = aggregateEstimate(sampleItems, dummyInput, cls, DEFAULT_DATASET, 1.0);
    const sum = res.categoryTotals.reduce((a, b) => a + b.subtotal, 0);
    assert.equal(Math.round(sum * 100) / 100, res.grandTotalMaterialCost);
  });

  it('computes site labour strictly on non-labour-inclusive items', () => {
    const res = aggregateEstimate(sampleItems, dummyInput, cls, DEFAULT_DATASET, 1.0);
    // Only MAT_RCC_STEEL (70,000) is raw material; MAT_FLOOR_VITRIFIED is turnkey installed
    const expectedLabour = Math.round(70000 * 0.30 * 100) / 100;
    assert.equal(res.grandTotalWithLabor, Math.round((res.grandTotalMaterialCost + expectedLabour) * 100) / 100);
  });

  it('produces 18 categories in consistent sequence', () => {
    const res = aggregateEstimate(sampleItems, dummyInput, cls, DEFAULT_DATASET, 1.0);
    assert.equal(res.categoryTotals.length, 18);
    assert.equal(res.categoryTotals[0].categoryCode, 'CAT_01');
    assert.equal(res.categoryTotals[17].categoryCode, 'CAT_18');
  });
});
