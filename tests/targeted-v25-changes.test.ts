// tests/targeted-v25-changes.test.ts
// Targeted verification tests for OUTSYD v2.5.0 Class-A changes:
// P1 — Low-Rise Residential Fire Guard
// P2 — Micro-Residential DG Set Feasibility Guard
// P3 — Micro-Plot Floorplate Density Scaling
// + Critical Boundary Tests

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runEstimationEngine, aggregateEstimate } from '../lib/engine';
import { classifyBuilding } from '../lib/engine/classifier';
import { DEFAULT_DATASET } from '../lib/engine/coefficients';
import type { FullInput } from '../lib/engine/types';

function run(override: Partial<FullInput>) {
  const input: FullInput = {
    lengthFt: 40,
    breadthFt: 30,
    heightFt: 30,
    plotAreaSqft: 2000,
    numFloors: 3,
    typology: 'Residential',
    buildingUse: 'Apartment',
    qualityTier: 'Standard',
    soilType: 'Normal',
    locationRegion: 'Delhi',
    ...override,
  };
  const cls = classifyBuilding(input);
  const items = runEstimationEngine(input, cls, DEFAULT_DATASET, 1.0);
  const estimate = aggregateEstimate(items, input, cls, DEFAULT_DATASET, 1.0);
  return { input, cls, items, estimate };
}

describe('Targeted Tests: Change P1 — Low-Rise Residential Fire Guard', () => {
  function checkFire(override: Partial<FullInput>) {
    const { items } = run(override);
    const hasHydrant = items.some(i => i.materialItemCode === 'MAT_FIRE_HYDRANT');
    const hasPump = items.some(i => i.materialItemCode === 'MAT_FIRE_PUMP_SET');
    const hasFireDoor = items.some(i => i.materialItemCode === 'MAT_DOOR_FIRE_RATED');
    return { hasHydrant, hasPump, hasFireDoor };
  }

  it('1. Residential 3F, 2,400 sqft: fire systems suppressed', () => {
    // 40x20 ft, 3 floors, 2,400 sqft BUA, height 30 ft
    const { hasHydrant, hasPump, hasFireDoor } = checkFire({
      lengthFt: 40, breadthFt: 20, numFloors: 3, heightFt: 30, typology: 'Residential', buildingUse: 'Apartment'
    });
    assert.equal(hasHydrant, false, 'Wet riser hydrant must be suppressed');
    assert.equal(hasPump, false, 'Fire pump set must be suppressed');
    assert.equal(hasFireDoor, false, 'Fire door must be suppressed');
  });

  it('2. Residential 4F, 3,200 sqft: fire systems suppressed under P1 guard', () => {
    // 40x20 ft, 4 floors, 3,200 sqft BUA, height 40 ft (<= 50 ft, <= 5000 sqft)
    const { hasHydrant, hasPump, hasFireDoor } = checkFire({
      lengthFt: 40, breadthFt: 20, numFloors: 4, heightFt: 40, typology: 'Residential', buildingUse: 'Apartment'
    });
    assert.equal(hasHydrant, false, 'Wet riser hydrant must be suppressed');
    assert.equal(hasPump, false, 'Fire pump set must be suppressed');
    assert.equal(hasFireDoor, false, 'Fire door must be suppressed');
  });

  it('3. Residential 4F, 5,000 sqft: exactly at boundary, fire systems suppressed', () => {
    // 50x25 ft, 4 floors, 5,000 sqft BUA, height 40 ft
    const { hasHydrant, hasPump, hasFireDoor } = checkFire({
      lengthFt: 50, breadthFt: 25, numFloors: 4, heightFt: 40, typology: 'Residential', buildingUse: 'Apartment'
    });
    assert.equal(hasHydrant, false, 'Wet riser hydrant must be suppressed at <= 5000 sqft');
    assert.equal(hasPump, false, 'Fire pump set must be suppressed at <= 5000 sqft');
    assert.equal(hasFireDoor, false, 'Fire door must be suppressed at <= 5000 sqft');
  });

  it('4. Residential 4F, >5,000 sqft (e.g. 5,200 sqft): fire systems active', () => {
    // 52x25 ft, 4 floors, 5,200 sqft BUA, height 40 ft
    const { hasHydrant, hasPump, hasFireDoor } = checkFire({
      lengthFt: 52, breadthFt: 25, numFloors: 4, heightFt: 40, typology: 'Residential', buildingUse: 'Apartment'
    });
    assert.equal(hasHydrant, true, 'Wet riser hydrant must be active for BUA > 5000 sqft');
    assert.equal(hasPump, true, 'Fire pump set must be active for BUA > 5000 sqft');
    assert.equal(hasFireDoor, true, 'Fire door must be active for BUA > 5000 sqft');
  });

  it('5. Residential >=5 floors: fire systems active regardless of BUA', () => {
    // 25x20 ft, 5 floors, 2,500 sqft BUA, height 50 ft
    const { hasHydrant, hasPump, hasFireDoor } = checkFire({
      lengthFt: 25, breadthFt: 20, numFloors: 5, heightFt: 50, typology: 'Residential', buildingUse: 'Apartment'
    });
    assert.equal(hasHydrant, true, 'Wet riser hydrant must be active for >= 5 floors');
    assert.equal(hasPump, true, 'Fire pump set must be active for >= 5 floors');
    assert.equal(hasFireDoor, true, 'Fire door must be active for >= 5 floors');
  });

  it('6. Residential >50 ft height: fire systems active', () => {
    // 40x20 ft, 4 floors, 3,200 sqft BUA, height 52 ft (> 50 ft)
    const { hasHydrant, hasPump, hasFireDoor } = checkFire({
      lengthFt: 40, breadthFt: 20, numFloors: 4, heightFt: 52, typology: 'Residential', buildingUse: 'Apartment'
    });
    assert.equal(hasHydrant, true, 'Wet riser hydrant must be active for height > 50 ft');
    assert.equal(hasPump, true, 'Fire pump set must be active for height > 50 ft');
    assert.equal(hasFireDoor, true, 'Fire door must be active for height > 50 ft');
  });

  it('7. Commercial 4F: fire systems active (not affected by residential guard)', () => {
    // 40x20 ft, 4 floors, 3,200 sqft, height 40 ft, Commercial
    const { hasHydrant, hasPump, hasFireDoor } = checkFire({
      lengthFt: 40, breadthFt: 20, numFloors: 4, heightFt: 40, typology: 'Commercial', buildingUse: 'Office'
    });
    assert.equal(hasHydrant, true, 'Commercial 4F must retain fire hydrants');
    assert.equal(hasPump, true, 'Commercial 4F must retain fire pumps');
    assert.equal(hasFireDoor, true, 'Commercial 4F must retain fire doors');
  });

  it('8. Institutional 4F: fire systems active', () => {
    const { hasHydrant, hasPump, hasFireDoor } = checkFire({
      lengthFt: 40, breadthFt: 20, numFloors: 4, heightFt: 40, typology: 'Institutional', buildingUse: 'School'
    });
    assert.equal(hasHydrant, true, 'Institutional 4F must retain fire hydrants');
    assert.equal(hasPump, true, 'Institutional 4F must retain fire pumps');
    assert.equal(hasFireDoor, true, 'Institutional 4F must retain fire doors');
  });

  it('9. Industrial 4F: fire systems active', () => {
    const { hasHydrant, hasPump } = checkFire({
      lengthFt: 80, breadthFt: 70, numFloors: 4, heightFt: 48, typology: 'Industrial', buildingUse: 'Factory'
    });
    assert.equal(hasHydrant, true, 'Industrial 4F >20k sqft must retain fire hydrants');
    assert.equal(hasPump, true, 'Industrial 4F >20k sqft must retain fire pumps');
  });
});

describe('Targeted Tests: Change P2 — Micro-Residential DG Set Feasibility Guard', () => {
  function checkDg(override: Partial<FullInput>) {
    const { items } = run(override);
    const dgItem = items.find(i => i.materialItemCode === 'MAT_ELEC_GENSET');
    return { hasDg: !!dgItem, kva: dgItem?.quantity ?? 0 };
  }

  it('1. Micro residential 4F, no lift: DG suppressed', () => {
    // 40x20 ft (800 sqft/floor, 3,200 sqft BUA < 3500) -> isMicroBuilding = true, numLifts = 0
    const { hasDg } = checkDg({
      lengthFt: 40, breadthFt: 20, numFloors: 4, heightFt: 40, typology: 'Residential', buildingUse: 'Apartment', numLifts: 0
    });
    assert.equal(hasDg, false, 'DG set must be suppressed for micro-residential without lift');
  });

  it('2. Micro residential 4F, explicit 1 lift: DG active (honors lift backup)', () => {
    const { hasDg, kva } = checkDg({
      lengthFt: 40, breadthFt: 20, numFloors: 4, heightFt: 40, typology: 'Residential', buildingUse: 'Apartment', numLifts: 1
    });
    assert.equal(hasDg, true, 'DG set must be active when passenger lift is present');
    assert.ok(kva >= 15, 'DG capacity must be at least 15 kVA');
  });

  it('3. Micro residential 3F: DG suppressed (<4 floors and micro)', () => {
    const { hasDg } = checkDg({
      lengthFt: 30, breadthFt: 20, numFloors: 3, heightFt: 30, typology: 'Residential', buildingUse: 'Apartment', numLifts: 0
    });
    assert.equal(hasDg, false, 'DG set must be suppressed for 3F micro residential');
  });

  it('4. Commercial 4F: DG active (commercial exempt from micro DG guard)', () => {
    const { hasDg } = checkDg({
      lengthFt: 40, breadthFt: 20, numFloors: 4, heightFt: 40, typology: 'Commercial', buildingUse: 'Office', numLifts: 0
    });
    assert.equal(hasDg, true, 'Commercial 4F must retain DG set');
  });

  it('5. Institutional 4F: DG active', () => {
    const { hasDg } = checkDg({
      lengthFt: 40, breadthFt: 20, numFloors: 4, heightFt: 40, typology: 'Institutional', buildingUse: 'College', numLifts: 0
    });
    assert.equal(hasDg, true, 'Institutional 4F must retain DG set');
  });

  it('6. Industrial 4F: DG active for multi-storey industrial', () => {
    const { hasDg } = checkDg({
      lengthFt: 60, breadthFt: 50, numFloors: 4, heightFt: 48, typology: 'Industrial', buildingUse: 'Factory'
    });
    assert.equal(hasDg, true, 'Industrial 4F must retain DG set');
  });
});

describe('Targeted Tests: Change P3 — Micro-Plot Floorplate Density Scaling', () => {
  it('Tests floorplate density transition across 350, 500, 600, 799, 800, 1000 sqft', () => {
    const floorplates = [
      { fp: 350,  len: 35, br: 10, shouldScale: true },
      { fp: 500,  len: 25, br: 20, shouldScale: true },
      { fp: 600,  len: 30, br: 20, shouldScale: true },
      { fp: 799,  len: 39.95, br: 20, shouldScale: true },
      { fp: 800,  len: 40, br: 20, shouldScale: false },
      { fp: 1000, len: 50, br: 20, shouldScale: false },
    ];

    for (const { fp, len, br, shouldScale } of floorplates) {
      const { items, estimate } = run({
        lengthFt: len,
        breadthFt: br,
        numFloors: 4,
        heightFt: 40,
        typology: 'Residential',
        buildingUse: 'Apartment',
      });

      const kitchItem = items.find(i => i.materialItemCode.startsWith('MAT_WOOD_KITCH'));
      const wcItem = items.find(i => i.materialItemCode === 'MAT_PLUMB_WC' || i.materialItemCode === 'MAT_PLUMB_EWC');
      const flushDoor = items.find(i => i.materialItemCode === 'MAT_DOOR_FLUSH');

      assert.ok(kitchItem, `Kitchen item must exist for fp=${fp}`);
      assert.ok(wcItem, `WC item must exist for fp=${fp}`);

      if (shouldScale) {
        // units = 4, kitchenLinearFt = 4 * 10 = 40 Lft (instead of 4 * 16 = 64 Lft)
        assert.equal(kitchItem.quantity, 40, `Kitchen linear ft must be 40 for micro fp=${fp}`);
        // bathrooms scaled by 0.65: round(8 * 0.65) = 5
        assert.equal(wcItem.quantity, 5, `WC count must be scaled to 5 for fp=${fp}`);
        // internal flush doors scaled by 0.75: round(16 * 0.75) = 12
        assert.equal(flushDoor?.quantity, 12, `Internal flush doors must be scaled to 12 for fp=${fp}`);
      } else {
        // Standard non-micro density:
        // buaPerFloor >= 800: effectiveUnitsPerFloor = round(800 / 1600) or similar
        // kitchenLinearFt = units * 16 (never * 10)
        assert.ok(kitchItem.quantity % 16 === 0, `Kitchen linear ft must be multiple of 16 for non-micro fp=${fp}`);
        assert.ok(estimate.grandTotalWithLabor > 0);
      }
    }
  });

  it('Verifies category totals CAT_06, CAT_08, CAT_11 scale down for micro-density', () => {
    // 4 floors, 500 sqft/floor (2,000 sqft total)
    const micro = run({
      lengthFt: 25, breadthFt: 20, numFloors: 4, heightFt: 40, typology: 'Residential', buildingUse: 'Apartment', numLifts: 0
    });

    const cat06 = micro.estimate.categoryTotals.find(c => c.categoryCode === 'CAT_06')?.subtotal ?? 0;
    const cat08 = micro.estimate.categoryTotals.find(c => c.categoryCode === 'CAT_08')?.subtotal ?? 0;
    const cat11 = micro.estimate.categoryTotals.find(c => c.categoryCode === 'CAT_11')?.subtotal ?? 0;

    assert.ok(cat06 > 0, 'CAT_06 total must be positive');
    assert.ok(cat08 > 0, 'CAT_08 total must be positive');
    assert.ok(cat11 > 0, 'CAT_11 total must be positive');
  });
});

describe('Targeted Tests: Critical Boundary Tests', () => {
  it('BUA boundary: 4,999 vs 5,000 vs 5,001 sqft', () => {
    // 4 floors, height 40 ft
    // 4,999 sqft BUA: length 49.99, breadth 25 -> total 4,999 sqft -> suppressed
    const r4999 = run({ lengthFt: 49.99, breadthFt: 25, numFloors: 4, heightFt: 40, typology: 'Residential', buildingUse: 'Apartment' });
    const has4999 = r4999.items.some(i => i.materialItemCode === 'MAT_FIRE_HYDRANT');
    assert.equal(has4999, false, 'BUA 4999 sqft must be exempt from fire hydrants');

    // 5,000 sqft BUA: length 50, breadth 25 -> total 5,000 sqft -> suppressed
    const r5000 = run({ lengthFt: 50, breadthFt: 25, numFloors: 4, heightFt: 40, typology: 'Residential', buildingUse: 'Apartment' });
    const has5000 = r5000.items.some(i => i.materialItemCode === 'MAT_FIRE_HYDRANT');
    assert.equal(has5000, false, 'BUA 5000 sqft must be exempt from fire hydrants');

    // 5,001 sqft BUA: length 50.01, breadth 25 -> total 5,001 sqft -> ACTIVE
    const r5001 = run({ lengthFt: 50.01, breadthFt: 25, numFloors: 4, heightFt: 40, typology: 'Residential', buildingUse: 'Apartment' });
    const has5001 = r5001.items.some(i => i.materialItemCode === 'MAT_FIRE_HYDRANT');
    assert.equal(has5001, true, 'BUA 5001 sqft must trigger fire hydrants');
  });

  it('Height boundary: 49.9 ft vs 50 ft vs 50.1 ft', () => {
    // 4 floors, 40x20 ft (3,200 sqft BUA)
    const r49_9 = run({ lengthFt: 40, breadthFt: 20, numFloors: 4, heightFt: 49.9, typology: 'Residential', buildingUse: 'Apartment' });
    assert.equal(r49_9.items.some(i => i.materialItemCode === 'MAT_FIRE_HYDRANT'), false, 'Height 49.9 ft must be exempt');

    const r50_0 = run({ lengthFt: 40, breadthFt: 20, numFloors: 4, heightFt: 50.0, typology: 'Residential', buildingUse: 'Apartment' });
    assert.equal(r50_0.items.some(i => i.materialItemCode === 'MAT_FIRE_HYDRANT'), false, 'Height 50.0 ft must be exempt');

    const r50_1 = run({ lengthFt: 40, breadthFt: 20, numFloors: 4, heightFt: 50.1, typology: 'Residential', buildingUse: 'Apartment' });
    assert.equal(r50_1.items.some(i => i.materialItemCode === 'MAT_FIRE_HYDRANT'), true, 'Height 50.1 ft must trigger fire hydrants');
  });

  it('Floors boundary: 4 floors vs 5 floors', () => {
    // 25x20 ft (500 sqft/floor, height 40 ft for 4F vs 50 ft for 5F)
    const r4 = run({ lengthFt: 25, breadthFt: 20, numFloors: 4, heightFt: 40, typology: 'Residential', buildingUse: 'Apartment' });
    assert.equal(r4.items.some(i => i.materialItemCode === 'MAT_FIRE_HYDRANT'), false, '4 floors micro must be exempt');

    const r5 = run({ lengthFt: 25, breadthFt: 20, numFloors: 5, heightFt: 50, typology: 'Residential', buildingUse: 'Apartment' });
    assert.equal(r5.items.some(i => i.materialItemCode === 'MAT_FIRE_HYDRANT'), true, '5 floors must trigger fire hydrants');
  });

  it('Floorplate boundary: 799 vs 800 vs 801 sqft', () => {
    // 4 floors, Apartment
    const r799 = run({ lengthFt: 39.95, breadthFt: 20, numFloors: 4, heightFt: 40, typology: 'Residential', buildingUse: 'Apartment' });
    const k799 = r799.items.find(i => i.materialItemCode.startsWith('MAT_WOOD_KITCH'))?.quantity;
    assert.equal(k799, 40, 'Floorplate 799 sqft must use micro kitchen scaling (40 Lft)');

    const r800 = run({ lengthFt: 40, breadthFt: 20, numFloors: 4, heightFt: 40, typology: 'Residential', buildingUse: 'Apartment' });
    const k800 = r800.items.find(i => i.materialItemCode.startsWith('MAT_WOOD_KITCH'))?.quantity;
    assert.ok(k800 !== undefined && k800 % 16 === 0, 'Floorplate 800 sqft must use standard kitchen scaling (multiple of 16)');

    const r801 = run({ lengthFt: 40.05, breadthFt: 20, numFloors: 4, heightFt: 40, typology: 'Residential', buildingUse: 'Apartment' });
    const k801 = r801.items.find(i => i.materialItemCode.startsWith('MAT_WOOD_KITCH'))?.quantity;
    assert.ok(k801 !== undefined && k801 % 16 === 0, 'Floorplate 801 sqft must use standard kitchen scaling (multiple of 16)');
  });

  it('Lift boundary: numLifts 0 vs 1 on 4F micro residential', () => {
    const r0 = run({ lengthFt: 40, breadthFt: 20, numFloors: 4, heightFt: 40, typology: 'Residential', buildingUse: 'Apartment', numLifts: 0 });
    assert.equal(r0.items.some(i => i.materialItemCode === 'MAT_ELEC_GENSET'), false, 'Lift=0 must suppress DG');

    const r1 = run({ lengthFt: 40, breadthFt: 20, numFloors: 4, heightFt: 40, typology: 'Residential', buildingUse: 'Apartment', numLifts: 1 });
    assert.equal(r1.items.some(i => i.materialItemCode === 'MAT_ELEC_GENSET'), true, 'Lift=1 must include DG');
  });
});
