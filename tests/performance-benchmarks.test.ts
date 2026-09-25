import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runEstimationEngine } from '../lib/engine/estimator';
import { classifyBuilding } from '../lib/engine/classifier';
import { aggregateEstimate } from '../lib/engine/cost-calculator';
import { DEFAULT_DATASET } from '../lib/engine/coefficients';
import { REGIONAL_RATE_INDEX, lookupRegionalIndex } from '../lib/engine/regions';
import type { FullInput } from '../lib/engine/types';

describe('PHASE 18: Performance & Computational Stress Benchmarking', () => {
  const benchmarkScales: Array<{ label: string; buaSqft: number; input: FullInput }> = [
    {
      label: 'Small Footprint (300 sqft)',
      buaSqft: 300,
      input: {
        lengthFt: 20, breadthFt: 15, heightFt: 10, plotAreaSqft: 500, numFloors: 1,
        typology: 'Residential', buildingUse: 'Studio', soilType: 'Normal', locationRegion: 'Delhi',
        qualityTier: 'Economy', structuralSystem: 'RCC_Frame', foundationType: 'Isolated',
        numLifts: 0, numStaircases: 1, parkingLevels: 0, unitsPerFloor: 1, seismicZone: 'Zone_IV',
        soilBearingCapacity: 200, windLoadZone: 'Moderate', serviceFloors: 0, podiumLevels: 0,
        facadeType: 'Conventional', fireHvacScope: 'Basic', targetTimelineMonths: 12, greenCertTarget: 'None',
        localRateOverrides: [],
      },
    },
    {
      label: 'Medium Footprint (5,000 sqft)',
      buaSqft: 5000,
      input: {
        lengthFt: 50, breadthFt: 50, heightFt: 24, plotAreaSqft: 4000, numFloors: 2,
        typology: 'Residential', buildingUse: 'Villa', soilType: 'Normal', locationRegion: 'Bengaluru',
        qualityTier: 'Standard', structuralSystem: 'RCC_Frame', foundationType: 'Isolated',
        numLifts: 0, numStaircases: 1, parkingLevels: 0, unitsPerFloor: 1, seismicZone: 'Zone_II',
        soilBearingCapacity: 200, windLoadZone: 'Moderate', serviceFloors: 0, podiumLevels: 0,
        facadeType: 'Conventional', fireHvacScope: 'Basic', targetTimelineMonths: 18, greenCertTarget: 'None',
        localRateOverrides: [],
      },
    },
    {
      label: 'Large Footprint (100,000 sqft Commercial)',
      buaSqft: 100000,
      input: {
        lengthFt: 200, breadthFt: 100, heightFt: 60, plotAreaSqft: 30000, numFloors: 5,
        typology: 'Commercial', buildingUse: 'Office', soilType: 'Normal', locationRegion: 'Mumbai',
        qualityTier: 'Standard', structuralSystem: 'RCC_Frame', foundationType: 'Isolated',
        numLifts: 4, numStaircases: 3, parkingLevels: 2, unitsPerFloor: 8, seismicZone: 'Zone_III',
        soilBearingCapacity: 250, windLoadZone: 'Moderate', serviceFloors: 1, podiumLevels: 1,
        facadeType: 'Conventional', fireHvacScope: 'Full_Central', targetTimelineMonths: 24, greenCertTarget: 'IGBC',
        localRateOverrides: [],
      },
    },
    {
      label: 'Very Large Footprint (1,000,000 sqft Industrial Mega-Park)',
      buaSqft: 1000000,
      input: {
        lengthFt: 1000, breadthFt: 500, heightFt: 40, plotAreaSqft: 700000, numFloors: 2,
        typology: 'Industrial', buildingUse: 'Warehouse', soilType: 'Normal', locationRegion: 'Pune',
        qualityTier: 'Standard', structuralSystem: 'Steel', foundationType: 'Raft',
        numLifts: 4, numStaircases: 6, parkingLevels: 0, unitsPerFloor: 1, seismicZone: 'Zone_III',
        soilBearingCapacity: 300, windLoadZone: 'Moderate', serviceFloors: 0, podiumLevels: 0,
        facadeType: 'ACP_Cladding', fireHvacScope: 'Full_Central', targetTimelineMonths: 36, greenCertTarget: 'None',
        localRateOverrides: [],
      },
    },
    {
      label: 'Stress Scale: Skyscraper (150 Floors Maximum)',
      buaSqft: 1500000,
      input: {
        lengthFt: 100, breadthFt: 100, heightFt: 1500, plotAreaSqft: 20000, numFloors: 150,
        typology: 'Commercial', buildingUse: 'Office', soilType: 'Rocky', locationRegion: 'Mumbai',
        qualityTier: 'Premium', structuralSystem: 'Shear_Wall', foundationType: 'Pile',
        numLifts: 20, numStaircases: 4, parkingLevels: 5, unitsPerFloor: 10, seismicZone: 'Zone_III',
        soilBearingCapacity: 500, windLoadZone: 'High', serviceFloors: 6, podiumLevels: 3,
        facadeType: 'Curtain_Wall', fireHvacScope: 'Full_Central', targetTimelineMonths: 60, greenCertTarget: 'IGBC',
        localRateOverrides: [],
      },
    },
  ];

  for (const { label, input } of benchmarkScales) {
    it(`benchmarks calculation performance for ${label}`, () => {
      const cls = classifyBuilding(input);
      const { index: ri } = lookupRegionalIndex(input.locationRegion);

      const startTime = performance.now();
      const items = runEstimationEngine(input, cls, DEFAULT_DATASET, ri);
      const res = aggregateEstimate(items, input, cls, DEFAULT_DATASET, ri);
      const durationMs = performance.now() - startTime;

      // Invariants check
      assert.ok(items.length > 0);
      assert.ok(Number.isFinite(res.grandTotalMaterialCost) && res.grandTotalMaterialCost > 0);
      assert.ok(Number.isFinite(res.grandTotalWithLabor) && res.grandTotalWithLabor > res.grandTotalMaterialCost);

      // Performance assertion: Pure mathematical estimation must run in under 25ms even for 150 floors
      assert.ok(
        durationMs < 25,
        `Benchmark execution time exceeded 25ms threshold: ${durationMs.toFixed(2)} ms for ${label}`
      );
    });
  }

  it('benchmarks full 196-city regression execution throughput', () => {
    const input = benchmarkScales[1].input;
    const cls = classifyBuilding(input);
    const cities = Object.keys(REGIONAL_RATE_INDEX).filter((c) => c !== 'default');

    const startTime = performance.now();
    for (const city of cities) {
      const { index: ri } = lookupRegionalIndex(city);
      const items = runEstimationEngine(input, cls, DEFAULT_DATASET, ri);
      aggregateEstimate(items, input, cls, DEFAULT_DATASET, ri);
    }
    const totalDurationMs = performance.now() - startTime;

    assert.ok(
      totalDurationMs < 250,
      `Full 196-city sweep exceeded 250ms threshold: ${totalDurationMs.toFixed(2)} ms`
    );
  });
});
