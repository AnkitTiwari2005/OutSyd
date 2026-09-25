import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runEstimationEngine } from '../lib/engine/estimator';
import { classifyBuilding } from '../lib/engine/classifier';
import { aggregateEstimate } from '../lib/engine/cost-calculator';
import { DEFAULT_DATASET, LABOUR_INCLUSIVE_RATES } from '../lib/engine/coefficients';
import { SEISMIC_ZONE_LOOKUP, lookupRegionalIndex } from '../lib/engine/regions';
import { CATEGORY_NAMES } from '../lib/constants';
import { FullInputSchema } from '../lib/validation/input-schema';
import type { FullInput } from '../lib/engine/types';

const BASELINE_CANONICAL: FullInput = {
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

describe('PHASE 6: Rate Database Integrity & Override Isolation', () => {
  it('validates every rate record in DEFAULT_DATASET has complete, finite, and non-negative rates', () => {
    const rateEntries = Object.entries(DEFAULT_DATASET.rates);
    assert.ok(rateEntries.length >= 200, `Expected >= 200 rates, got ${rateEntries.length}`);

    for (const [code, rate] of rateEntries) {
      assert.ok(code.startsWith('MAT_'), `Invalid rate code prefix for: ${code}`);
      assert.ok(Number.isFinite(rate), `Rate for ${code} is not finite: ${rate}`);
      assert.ok(!Number.isNaN(rate), `Rate for ${code} is NaN`);
      assert.ok(rate > 0, `Rate for ${code} must be strictly positive, got ${rate}`);

      // Ensure labor inclusivity mapping is explicitly defined
      assert.ok(
        code in LABOUR_INCLUSIVE_RATES,
        `Missing labour-inclusive classification for code: ${code}`
      );
    }
  });

  it('validates all 18 standard construction categories in CATEGORY_NAMES are defined and non-empty', () => {
    const categories = Object.keys(CATEGORY_NAMES);
    assert.equal(categories.length, 18);
    for (const [code, name] of Object.entries(CATEGORY_NAMES)) {
      assert.ok(code.startsWith('CAT_'));
      assert.ok(typeof name === 'string' && name.length > 0);
    }
  });

  it('validates all cities in SEISMIC_ZONE_LOOKUP map to valid IS 1893:2016 zones', () => {
    const validZones = new Set(['Zone_II', 'Zone_III', 'Zone_IV', 'Zone_V']);
    for (const [city, zone] of Object.entries(SEISMIC_ZONE_LOOKUP)) {
      assert.ok(validZones.has(zone), `City ${city} references invalid seismic zone: ${zone}`);
    }
  });

  it('proves localRateOverrides isolation: modifies only target material and keeps physical quantities intact', () => {
    const cls = classifyBuilding(BASELINE_CANONICAL);
    const baselineItems = runEstimationEngine(BASELINE_CANONICAL, cls, DEFAULT_DATASET, 1.0);

    const cementBaseline = baselineItems.find((i) => i.materialItemCode === 'MAT_RCC_CEMENT');
    const steelBaseline = baselineItems.find((i) => i.materialItemCode === 'MAT_RCC_STEEL');
    assert.ok(cementBaseline && steelBaseline);

    const newCementRate = 580;
    const overriddenDs = {
      ...DEFAULT_DATASET,
      rates: { ...DEFAULT_DATASET.rates, MAT_RCC_CEMENT: newCementRate },
    };
    const overriddenInput = {
      ...BASELINE_CANONICAL,
      localRateOverrides: [{ materialItemCode: 'MAT_RCC_CEMENT', rate: newCementRate }],
    };

    const overriddenItems = runEstimationEngine(overriddenInput, cls, overriddenDs, 1.0);
    const cementOverridden = overriddenItems.find((i) => i.materialItemCode === 'MAT_RCC_CEMENT');
    const steelOverridden = overriddenItems.find((i) => i.materialItemCode === 'MAT_RCC_STEEL');
    assert.ok(cementOverridden && steelOverridden);

    // Quantity must NOT change
    assert.equal(cementOverridden.quantity, cementBaseline.quantity);
    // Rate must update to overridden rate
    assert.equal(cementOverridden.unitRate, newCementRate);
    // Line cost must recalculate exactly
    assert.equal(
      cementOverridden.lineCost,
      Math.round(cementBaseline.quantity * newCementRate * 100) / 100
    );

    // Steel and all other materials must be strictly unchanged
    assert.equal(steelOverridden.quantity, steelBaseline.quantity);
    assert.equal(steelOverridden.unitRate, steelBaseline.unitRate);
    assert.equal(steelOverridden.lineCost, steelBaseline.lineCost);
  });
});

describe('PHASE 7: Mutation & Sensitivity Testing', () => {
  it('Mutation: Standard -> Premium increases cost while preserving building dimensions and floor area', () => {
    const cls = classifyBuilding(BASELINE_CANONICAL);
    const stdItems = runEstimationEngine(BASELINE_CANONICAL, cls, DEFAULT_DATASET, 1.0);
    const stdRes = aggregateEstimate(stdItems, BASELINE_CANONICAL, cls, DEFAULT_DATASET, 1.0);

    const premiumInput: FullInput = { ...BASELINE_CANONICAL, qualityTier: 'Premium' };
    const premItems = runEstimationEngine(premiumInput, cls, DEFAULT_DATASET, 1.0);
    const premRes = aggregateEstimate(premItems, premiumInput, cls, DEFAULT_DATASET, 1.0);

    assert.ok(premRes.grandTotalMaterialCost > stdRes.grandTotalMaterialCost);
    assert.equal(premRes.derivedDimensions.totalBuaSqft, stdRes.derivedDimensions.totalBuaSqft);
    assert.equal(premRes.derivedDimensions.buaPerFloor, stdRes.derivedDimensions.buaPerFloor);
  });

  it('Mutation: Changing city alters costs via regional multiplier without changing any physical quantities', () => {
    const cls = classifyBuilding(BASELINE_CANONICAL);
    const { index: ludhianaRi } = lookupRegionalIndex('Ludhiana');
    const { index: mumbaiRi } = lookupRegionalIndex('Mumbai');

    const ludhianaItems = runEstimationEngine(BASELINE_CANONICAL, cls, DEFAULT_DATASET, ludhianaRi);
    const mumbaiItems = runEstimationEngine(BASELINE_CANONICAL, cls, DEFAULT_DATASET, mumbaiRi);

    assert.equal(ludhianaItems.length, mumbaiItems.length);
    for (let i = 0; i < ludhianaItems.length; i++) {
      assert.equal(
        ludhianaItems[i].quantity,
        mumbaiItems[i].quantity,
        `Quantity diverged for ${ludhianaItems[i].materialItemCode}`
      );
    }
  });

  it('Mutation: 3 floors -> 4 floors upgrades classification to Mid_Rise_Residential and increases quantities', () => {
    const cls3 = classifyBuilding(BASELINE_CANONICAL);
    const fourFloorInput: FullInput = {
      ...BASELINE_CANONICAL,
      numFloors: 4,
      heightFt: 40,
    };
    const cls4 = classifyBuilding(fourFloorInput);

    assert.equal(cls3.category, 'Small_Residential');
    assert.equal(cls3.tier, 1);
    assert.equal(cls4.category, 'Mid_Rise_Residential');
    assert.equal(cls4.tier, 2);

    const items3 = runEstimationEngine(BASELINE_CANONICAL, cls3, DEFAULT_DATASET, 1.0);
    const items4 = runEstimationEngine(fourFloorInput, cls4, DEFAULT_DATASET, 1.0);

    const steel3 = items3.find((i) => i.materialItemCode === 'MAT_RCC_STEEL')?.quantity ?? 0;
    const steel4 = items4.find((i) => i.materialItemCode === 'MAT_RCC_STEEL')?.quantity ?? 0;
    assert.ok(steel4 > steel3);
  });

  it('Mutation: 7 floors -> 8 floors triggers High_Rise classification and mandatory fire sprinklers', () => {
    const sevenFloor: FullInput = {
      ...BASELINE_CANONICAL,
      numFloors: 7,
      heightFt: 70,
    };
    const eightFloor: FullInput = {
      ...BASELINE_CANONICAL,
      numFloors: 8,
      heightFt: 80,
    };

    const cls7 = classifyBuilding(sevenFloor);
    const cls8 = classifyBuilding(eightFloor);
    assert.equal(cls7.category, 'Mid_Rise_Residential');
    assert.equal(cls8.category, 'High_Rise');

    const items7 = runEstimationEngine(sevenFloor, cls7, DEFAULT_DATASET, 1.0);
    const items8 = runEstimationEngine(eightFloor, cls8, DEFAULT_DATASET, 1.0);

    const hasSprink7 = items7.some((i) => i.materialItemCode === 'MAT_FIRE_SPRINKLER');
    const hasSprink8 = items8.some((i) => i.materialItemCode === 'MAT_FIRE_SPRINKLER');
    assert.equal(hasSprink7, false);
    assert.equal(hasSprink8, true);
  });

  it('Mutation: Zone III -> Zone IV applies ductile detailing multiplier increasing rebar quantity', () => {
    const z3Input = { ...BASELINE_CANONICAL, seismicZone: 'Zone_III' as const };
    const z4Input = { ...BASELINE_CANONICAL, seismicZone: 'Zone_IV' as const };

    const itemsZ3 = runEstimationEngine(z3Input, classifyBuilding(z3Input), DEFAULT_DATASET, 1.0);
    const itemsZ4 = runEstimationEngine(z4Input, classifyBuilding(z4Input), DEFAULT_DATASET, 1.0);

    const steelZ3 = itemsZ3.find((i) => i.materialItemCode === 'MAT_RCC_STEEL')?.quantity ?? 0;
    const steelZ4 = itemsZ4.find((i) => i.materialItemCode === 'MAT_RCC_STEEL')?.quantity ?? 0;
    assert.ok(steelZ4 > steelZ3);

    // Non-structural items (e.g. wall putty) must be identical
    const puttyZ3 = itemsZ3.find((i) => i.materialItemCode === 'MAT_PAINT_PUTTY')?.quantity ?? 0;
    const puttyZ4 = itemsZ4.find((i) => i.materialItemCode === 'MAT_PAINT_PUTTY')?.quantity ?? 0;
    assert.equal(puttyZ3, puttyZ4);
  });

  it('Mutation: Normal soil -> Waterlogged-prone upgrades pad footing to raft foundation', () => {
    const normal = { ...BASELINE_CANONICAL, soilType: 'Normal' as const };
    const waterlogged = { ...BASELINE_CANONICAL, soilType: 'Waterlogged-prone' as const };

    const normItems = runEstimationEngine(normal, classifyBuilding(normal), DEFAULT_DATASET, 1.0);
    const wlItems = runEstimationEngine(waterlogged, classifyBuilding(waterlogged), DEFAULT_DATASET, 1.0);

    assert.ok(normItems.some((i) => i.materialItemCode === 'MAT_FOUND_CONC'));
    assert.ok(wlItems.some((i) => i.materialItemCode === 'MAT_FOUND_RAFT'));
  });

  it('Mutation: None -> IGBC green cert target adds rooftop solar and rainwater harvesting', () => {
    const compactNone: FullInput = {
      ...BASELINE_CANONICAL,
      lengthFt: 30,
      breadthFt: 20,
      heightFt: 20,
      plotAreaSqft: 1200,
      numFloors: 2,
      greenCertTarget: 'None',
    };
    const compactIgbc: FullInput = {
      ...compactNone,
      greenCertTarget: 'IGBC',
    };

    const cls = classifyBuilding(compactNone);
    const noneItems = runEstimationEngine(compactNone, cls, DEFAULT_DATASET, 1.0);
    const igbcItems = runEstimationEngine(compactIgbc, cls, DEFAULT_DATASET, 1.0);

    assert.equal(noneItems.some((i) => i.materialItemCode === 'MAT_SOLAR_PANEL_ROO'), false);
    assert.equal(noneItems.some((i) => i.materialItemCode === 'MAT_GREEN_RAINWATER'), false);
    assert.equal(noneItems.some((i) => i.materialItemCode === 'MAT_GREEN_DUAL_FLUSH'), false);

    assert.equal(igbcItems.some((i) => i.materialItemCode === 'MAT_SOLAR_PANEL_ROO'), true);
    assert.equal(igbcItems.some((i) => i.materialItemCode === 'MAT_GREEN_RAINWATER'), true);
    assert.equal(igbcItems.some((i) => i.materialItemCode === 'MAT_GREEN_DUAL_FLUSH'), true);
  });

  it('Mutation: Normal timeline -> compressed timeline adds fast-track schedule acceleration surcharge', () => {
    const normalTimeline = { ...BASELINE_CANONICAL, targetTimelineMonths: 24 };
    const compressedTimeline = { ...BASELINE_CANONICAL, targetTimelineMonths: 12 };

    const normRes = aggregateEstimate(
      runEstimationEngine(normalTimeline, classifyBuilding(normalTimeline), DEFAULT_DATASET, 1.0),
      normalTimeline,
      classifyBuilding(normalTimeline),
      DEFAULT_DATASET,
      1.0
    );
    const compRes = aggregateEstimate(
      runEstimationEngine(compressedTimeline, classifyBuilding(compressedTimeline), DEFAULT_DATASET, 1.0),
      compressedTimeline,
      classifyBuilding(compressedTimeline),
      DEFAULT_DATASET,
      1.0
    );

    assert.equal(normRes.lineItems.some((i) => i.materialItemCode === 'MAT_PRELIM_ACCEL'), false);
    assert.equal(compRes.lineItems.some((i) => i.materialItemCode === 'MAT_PRELIM_ACCEL'), true);

    // Categories 1 to 17 must be identical
    for (let catIdx = 1; catIdx <= 17; catIdx++) {
      const code = `CAT_${String(catIdx).padStart(2, '0')}`;
      const normCat = normRes.categoryTotals.find((c) => c.categoryCode === code)?.subtotal;
      const compCat = compRes.categoryTotals.find((c) => c.categoryCode === code)?.subtotal;
      assert.equal(normCat, compCat, `Category ${code} subtotal altered by timeline compression`);
    }
  });
});

describe('PHASE 8: Boundary Discontinuity Tests', () => {
  it('Coverage boundary: 84.999% (valid), 85.000% (valid), 85.001% (rejected with exact norm error)', () => {
    const plot = 10000;
    // 84.999% coverage -> footprint 8499.9
    const p84_999 = FullInputSchema.safeParse({
      ...BASELINE_CANONICAL,
      plotAreaSqft: plot,
      lengthFt: 84.999,
      breadthFt: 100,
    });
    assert.equal(p84_999.success, true);

    // 85.000% coverage -> footprint 8500
    const p85_000 = FullInputSchema.safeParse({
      ...BASELINE_CANONICAL,
      plotAreaSqft: plot,
      lengthFt: 85,
      breadthFt: 100,
    });
    assert.equal(p85_000.success, true);

    // 85.001% coverage -> footprint 8500.1
    const p85_001 = FullInputSchema.safeParse({
      ...BASELINE_CANONICAL,
      plotAreaSqft: plot,
      lengthFt: 85.001,
      breadthFt: 100,
    });
    assert.equal(p85_001.success, false);
    if (!p85_001.success) {
      const msg = p85_001.error.issues[0].message;
      assert.ok(msg.includes('Ground coverage ratio'));
      assert.ok(msg.includes('exceeds standard 85% maximum plot coverage norm'));
    }
  });

  it('Floor height boundaries: 7.999 ft (reject), 8.000 ft (accept), 20.000 ft (accept), 20.001 ft (reject)', () => {
    // 1 floor, height = 7.999 ft -> ratio 7.999 < 8
    assert.equal(
      FullInputSchema.safeParse({ ...BASELINE_CANONICAL, numFloors: 1, heightFt: 7.999 }).success,
      false
    );
    // 1 floor, height = 8.000 ft -> ratio 8.000 (valid boundary)
    assert.equal(
      FullInputSchema.safeParse({ ...BASELINE_CANONICAL, numFloors: 1, heightFt: 8.0 }).success,
      true
    );
    // 1 floor, height = 20.000 ft -> ratio 20.000 (valid boundary)
    assert.equal(
      FullInputSchema.safeParse({ ...BASELINE_CANONICAL, numFloors: 1, heightFt: 20.0 }).success,
      true
    );
    // 1 floor, height = 20.001 ft -> ratio 20.001 > 20
    assert.equal(
      FullInputSchema.safeParse({ ...BASELINE_CANONICAL, numFloors: 1, heightFt: 20.001 }).success,
      false
    );
  });

  it('Industrial height boundary: allows up to 40.0 ft floor-to-floor (40.001 rejected)', () => {
    const industrialBase = {
      ...BASELINE_CANONICAL,
      typology: 'Industrial' as const,
      buildingUse: 'Warehouse',
      numFloors: 1,
    };
    // 40.000 ft -> valid
    assert.equal(
      FullInputSchema.safeParse({ ...industrialBase, heightFt: 40.0 }).success,
      true
    );
    // 40.001 ft -> rejected
    assert.equal(
      FullInputSchema.safeParse({ ...industrialBase, heightFt: 40.001 }).success,
      false
    );
  });

  it('Soil bearing capacity threshold: <100 triggers raft concrete, >=100 uses isolated footing', () => {
    const lowSbc = { ...BASELINE_CANONICAL, soilBearingCapacity: 99.999 };
    const exact100 = { ...BASELINE_CANONICAL, soilBearingCapacity: 100.0 };
    const above100 = { ...BASELINE_CANONICAL, soilBearingCapacity: 100.001 };

    const itemsLow = runEstimationEngine(lowSbc, classifyBuilding(lowSbc), DEFAULT_DATASET, 1.0);
    const itemsExact = runEstimationEngine(exact100, classifyBuilding(exact100), DEFAULT_DATASET, 1.0);
    const itemsAbove = runEstimationEngine(above100, classifyBuilding(above100), DEFAULT_DATASET, 1.0);

    assert.equal(itemsLow.some((i) => i.materialItemCode === 'MAT_FOUND_RAFT'), true);
    assert.equal(itemsExact.some((i) => i.materialItemCode === 'MAT_FOUND_RAFT'), false);
    assert.equal(itemsAbove.some((i) => i.materialItemCode === 'MAT_FOUND_RAFT'), false);
  });

  it('Maximum field boundaries: validates exactly at max and rejects max + epsilon', () => {
    // Length & breadth max 2000
    assert.equal(
      FullInputSchema.safeParse({ ...BASELINE_CANONICAL, lengthFt: 2000, breadthFt: 2000, plotAreaSqft: 5000000 }).success,
      true
    );
    assert.equal(
      FullInputSchema.safeParse({ ...BASELINE_CANONICAL, lengthFt: 2000.001, breadthFt: 2000, plotAreaSqft: 5000000 }).success,
      false
    );

    // Height max 1500 (with valid floor ratio)
    assert.equal(
      FullInputSchema.safeParse({ ...BASELINE_CANONICAL, heightFt: 1500, numFloors: 100 }).success,
      true
    );
    assert.equal(
      FullInputSchema.safeParse({ ...BASELINE_CANONICAL, heightFt: 1500.001, numFloors: 100 }).success,
      false
    );

    // Plot area max 10,000,000
    assert.equal(
      FullInputSchema.safeParse({ ...BASELINE_CANONICAL, plotAreaSqft: 10_000_000 }).success,
      true
    );
    assert.equal(
      FullInputSchema.safeParse({ ...BASELINE_CANONICAL, plotAreaSqft: 10_000_001 }).success,
      false
    );

    // Floors max 150
    assert.equal(
      FullInputSchema.safeParse({ ...BASELINE_CANONICAL, numFloors: 150, heightFt: 1500 }).success,
      true
    );
    assert.equal(
      FullInputSchema.safeParse({ ...BASELINE_CANONICAL, numFloors: 151, heightFt: 1500 }).success,
      false
    );

    // Lifts max 20
    assert.equal(FullInputSchema.safeParse({ ...BASELINE_CANONICAL, numLifts: 20 }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...BASELINE_CANONICAL, numLifts: 21 }).success, false);

    // Staircases max 20
    assert.equal(FullInputSchema.safeParse({ ...BASELINE_CANONICAL, numStaircases: 20 }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...BASELINE_CANONICAL, numStaircases: 21 }).success, false);

    // Parking levels max 10
    assert.equal(FullInputSchema.safeParse({ ...BASELINE_CANONICAL, parkingLevels: 10 }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...BASELINE_CANONICAL, parkingLevels: 11 }).success, false);

    // Units per floor max 100
    assert.equal(FullInputSchema.safeParse({ ...BASELINE_CANONICAL, unitsPerFloor: 100 }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...BASELINE_CANONICAL, unitsPerFloor: 101 }).success, false);

    // Soil bearing capacity max 1000
    assert.equal(FullInputSchema.safeParse({ ...BASELINE_CANONICAL, soilBearingCapacity: 1000 }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...BASELINE_CANONICAL, soilBearingCapacity: 1000.001 }).success, false);

    // Local rate overrides max 50
    const overrides50 = Array.from({ length: 50 }, (_, i) => ({ materialItemCode: `ITEM_${i}`, rate: 100 }));
    assert.equal(FullInputSchema.safeParse({ ...BASELINE_CANONICAL, localRateOverrides: overrides50 }).success, true);
    const overrides51 = [...overrides50, { materialItemCode: 'ITEM_51', rate: 100 }];
    assert.equal(FullInputSchema.safeParse({ ...BASELINE_CANONICAL, localRateOverrides: overrides51 }).success, false);
  });
});
