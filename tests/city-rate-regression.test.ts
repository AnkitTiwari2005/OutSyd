import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runEstimationEngine } from '../lib/engine/estimator';
import { classifyBuilding } from '../lib/engine/classifier';
import { aggregateEstimate } from '../lib/engine/cost-calculator';
import { DEFAULT_DATASET } from '../lib/engine/coefficients';
import { REGIONAL_RATE_INDEX, lookupRegionalIndex } from '../lib/engine/regions';
import type { FullInput } from '../lib/engine/types';

const CANONICAL_PROJECT: FullInput = {
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
  targetTimelineMonths: 24,
  greenCertTarget: 'None',
  localRateOverrides: [],
};

describe('PHASE 5: 160+ Indian Cities Regional Rate Regression', () => {
  const allCities = Object.keys(REGIONAL_RATE_INDEX).filter((c) => c !== 'default');

  it('contains at least 160 supported cities in the regional database', () => {
    assert.ok(
      allCities.length >= 160,
      `Expected >= 160 cities in database, found ${allCities.length}`
    );
  });

  it('verifies all city multipliers are bounded within realistic physical thresholds (0.70x to 1.60x)', () => {
    for (const city of allCities) {
      const mult = REGIONAL_RATE_INDEX[city];
      assert.ok(
        Number.isFinite(mult),
        `City ${city} multiplier is not finite: ${mult}`
      );
      assert.ok(
        mult >= 0.70 && mult <= 1.60,
        `City ${city} multiplier ${mult} is outside realistic boundaries [0.70, 1.60]`
      );
    }
  });

  it('runs canonical project calculation across EVERY single supported city', () => {
    const cls = classifyBuilding(CANONICAL_PROJECT);
    const seenTotalsByMultiplier = new Map<number, number>();

    for (const city of allCities) {
      const { index: ri, matchedCity } = lookupRegionalIndex(city);
      assert.ok(matchedCity !== null, `Lookup failed to match configured city: ${city}`);
      assert.equal(ri, REGIONAL_RATE_INDEX[city], `Multiplier mismatch for city ${city}`);

      const projectForCity: FullInput = { ...CANONICAL_PROJECT, locationRegion: city };
      const items = runEstimationEngine(projectForCity, cls, DEFAULT_DATASET, ri);
      const res = aggregateEstimate(items, projectForCity, cls, DEFAULT_DATASET, ri);

      // 1. Result exists and has line items
      assert.ok(res.lineItems.length > 0, `No line items generated for city ${city}`);

      // 2. Material cost finite and > 0
      assert.ok(Number.isFinite(res.grandTotalMaterialCost) && res.grandTotalMaterialCost > 0);

      // 3. Labour cost finite and > 0
      const labourCost = Math.round((res.grandTotalWithLabor - res.grandTotalMaterialCost) * 100) / 100;
      assert.ok(Number.isFinite(labourCost) && labourCost > 0);

      // 4. Turnkey cost with labor is finite and greater than material cost
      assert.ok(Number.isFinite(res.grandTotalWithLabor));
      assert.ok(res.grandTotalWithLabor > res.grandTotalMaterialCost);

      // 5. Cost per sqft is finite and > 0
      const costPerSqft = res.grandTotalWithLabor / res.derivedDimensions.totalBuaSqft;
      assert.ok(Number.isFinite(costPerSqft) && costPerSqft > 0);

      // 6. Plinth area and cubic content estimates are finite and > 0
      assert.ok(res.plinthAreaEstimate !== undefined && Number.isFinite(res.plinthAreaEstimate) && res.plinthAreaEstimate > 0);
      assert.ok(res.cubicContentEstimate !== undefined && Number.isFinite(res.cubicContentEstimate) && res.cubicContentEstimate > 0);

      // 7. Verify all line item values >= 0
      for (const item of res.lineItems) {
        assert.ok(item.quantity >= 0, `Negative quantity for item ${item.materialItemCode} in ${city}`);
        assert.ok(item.unitRate >= 0, `Negative unitRate for item ${item.materialItemCode} in ${city}`);
        assert.ok(item.lineCost >= 0, `Negative lineCost for item ${item.materialItemCode} in ${city}`);
      }

      // 8. Track multiplier to detect pricing variations
      if (seenTotalsByMultiplier.has(ri)) {
        // Cities with identical multipliers should yield identical totals for the canonical input
        assert.equal(
          res.grandTotalMaterialCost,
          seenTotalsByMultiplier.get(ri),
          `Inconsistent pricing for cities sharing multiplier ${ri} (tested ${city})`
        );
      } else {
        seenTotalsByMultiplier.set(ri, res.grandTotalMaterialCost);
      }
    }
  });

  it('detects distinct pricing between high-cost mega city (Mumbai 1.38x) and Tier-3 city (Gaya 0.80x)', () => {
    const cls = classifyBuilding(CANONICAL_PROJECT);

    const { index: mumbaiRi } = lookupRegionalIndex('Mumbai');
    const mumbaiItems = runEstimationEngine(CANONICAL_PROJECT, cls, DEFAULT_DATASET, mumbaiRi);
    const mumbaiRes = aggregateEstimate(mumbaiItems, CANONICAL_PROJECT, cls, DEFAULT_DATASET, mumbaiRi);

    const { index: gayaRi } = lookupRegionalIndex('Gaya');
    const gayaItems = runEstimationEngine(CANONICAL_PROJECT, cls, DEFAULT_DATASET, gayaRi);
    const gayaRes = aggregateEstimate(gayaItems, CANONICAL_PROJECT, cls, DEFAULT_DATASET, gayaRi);

    assert.equal(mumbaiRi, 1.38);
    assert.equal(gayaRi, 0.80);

    // Mumbai cost must be significantly higher than Gaya
    assert.ok(
      mumbaiRes.grandTotalMaterialCost > gayaRes.grandTotalMaterialCost * 1.5,
      `Expected Mumbai material total (${mumbaiRes.grandTotalMaterialCost}) to be substantially higher than Gaya (${gayaRes.grandTotalMaterialCost})`
    );

    // Physical quantities must remain identical regardless of city rate differences
    assert.equal(mumbaiItems.length, gayaItems.length);
    for (let i = 0; i < mumbaiItems.length; i++) {
      assert.equal(
        mumbaiItems[i].quantity,
        gayaItems[i].quantity,
        `Physical quantity diverged between Mumbai and Gaya for ${mumbaiItems[i].materialItemCode}`
      );
    }
  });

  it('guarantees unlisted city fallback multiplier equals exactly 1.00x', () => {
    const unlisted = lookupRegionalIndex('RandomFictionalTownX123');
    assert.equal(unlisted.index, 1.0);
    assert.equal(unlisted.matchedCity, null);

    const blank = lookupRegionalIndex('');
    assert.equal(blank.index, 1.0);
    assert.equal(blank.matchedCity, null);
  });
});
