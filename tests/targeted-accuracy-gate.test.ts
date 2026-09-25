// tests/targeted-accuracy-gate.test.ts
// Targeted verification tests for the two approved changes:
// 1. Area-Based Commercial Glazing Takeoff
// 2. Micro-Building Elevator Feasibility Guard

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runEstimationEngine } from '../lib/engine/estimator';
import { classifyBuilding } from '../lib/engine/classifier';
import { DEFAULT_DATASET } from '../lib/engine/coefficients';
import type { FullInput } from '../lib/engine/types';

const BASE_INPUT: FullInput = {
  lengthFt: 50, breadthFt: 40, heightFt: 30, numFloors: 3, plotAreaSqft: 3000,
  typology: 'Commercial', buildingUse: 'Office', qualityTier: 'Standard',
  soilType: 'Normal', locationRegion: 'Delhi'
};

describe('Targeted Tests: Change #1 — Commercial Glazing', () => {
  function getWinQty(override: Partial<FullInput>): { code: string; qty: number } {
    const input: FullInput = { ...BASE_INPUT, ...override };
    const cls = classifyBuilding(input);
    const items = runEstimationEngine(input, cls, DEFAULT_DATASET, 1.0);
    const winItem = items.find(i => i.materialItemCode.startsWith('MAT_WIN_'));
    assert.ok(winItem, 'Window item must exist');
    return { code: winItem.materialItemCode, qty: winItem.quantity };
  }

  it('1. Small commercial office: glazing scales with facade area without 240 sqft cap', () => {
    // 2,000 sqft floorplate, 1 floor, 45x45 ft, perimeter 180 ft, height 12 ft -> facade 2,160 sqft
    const { qty } = getWinQty({
      lengthFt: 45, breadthFt: 45, heightFt: 12, numFloors: 1, plotAreaSqft: 3000,
      typology: 'Commercial', buildingUse: 'Office', qualityTier: 'Standard'
    });
    // 2160 * 0.25 = 540 sqft (previously capped at 240 sqft)
    assert.equal(qty, 540);
    assert.ok(qty > 240, 'Glazing must exceed old 240 sqft cap');
  });

  it('2. Medium commercial office: 10,000 sqft floorplate correctly scales to 25%', () => {
    // 100x100 ft, 1 floor, perimeter 400 ft, height 12 ft -> facade 4,800 sqft
    const { qty } = getWinQty({
      lengthFt: 100, breadthFt: 100, heightFt: 12, numFloors: 1, plotAreaSqft: 15000,
      typology: 'Commercial', buildingUse: 'Office', qualityTier: 'Standard'
    });
    // 4800 * 0.25 = 1200 sqft
    assert.equal(qty, 1200);
  });

  it('3. Large commercial office: 50,000 sqft floorplate eliminates WWR collapse', () => {
    // 224x224 ft, 1 floor, perimeter 896 ft, height 12 ft -> facade 10,752 sqft
    const { qty } = getWinQty({
      lengthFt: 224, breadthFt: 224, heightFt: 12, numFloors: 1, plotAreaSqft: 60000,
      typology: 'Commercial', buildingUse: 'Office', qualityTier: 'Standard'
    });
    // 10752 * 0.25 = 2688 sqft (previously 240 sqft!)
    assert.equal(qty, 2688);
  });

  it('4. Retail building: applies 25% facade glazing', () => {
    // Facade = 2 * (50 + 40) * 14 = 2520 sqft. 2520 * 0.25 = 630 sqft
    const { qty } = getWinQty({
      lengthFt: 50, breadthFt: 40, heightFt: 14, numFloors: 1, plotAreaSqft: 3000,
      typology: 'Commercial', buildingUse: 'Retail', qualityTier: 'Standard'
    });
    assert.equal(qty, 630);
  });

  it('5. Commercial Showroom: applies 25% facade glazing', () => {
    // Facade = 2 * (60 + 40) * 15 = 3000 sqft. 3000 * 0.25 = 750 sqft
    const { qty } = getWinQty({
      lengthFt: 60, breadthFt: 40, heightFt: 15, numFloors: 1, plotAreaSqft: 4000,
      typology: 'Commercial', buildingUse: 'Showroom', qualityTier: 'Standard'
    });
    assert.equal(qty, 750);
  });

  it('6. Premium commercial office: uses 35% high-performance curtain wall glazing', () => {
    // Facade = 4800 sqft. 4800 * 0.35 = 1680 sqft
    const { code, qty } = getWinQty({
      lengthFt: 100, breadthFt: 100, heightFt: 12, numFloors: 1, plotAreaSqft: 15000,
      typology: 'Commercial', buildingUse: 'Office', qualityTier: 'Premium'
    });
    assert.equal(qty, 1680);
    assert.equal(code, 'MAT_WIN_THERMBREAK');
  });

  it('7. Standard vs Economy commercial: both use 25% glazing with respective material grades', () => {
    const stdRes = getWinQty({
      lengthFt: 80, breadthFt: 50, heightFt: 12, numFloors: 1, plotAreaSqft: 6000,
      typology: 'Commercial', buildingUse: 'Commercial Office', qualityTier: 'Standard'
    });
    const econRes = getWinQty({
      lengthFt: 80, breadthFt: 50, heightFt: 12, numFloors: 1, plotAreaSqft: 6000,
      typology: 'Commercial', buildingUse: 'Commercial Office', qualityTier: 'Economy'
    });

    // Facade = 2 * 130 * 12 = 3120 sqft. 3120 * 0.25 = 780 sqft
    assert.equal(stdRes.qty, 780);
    assert.equal(econRes.qty, 780);
    assert.equal(stdRes.code, 'MAT_WIN_UPVC');
    assert.equal(econRes.code, 'MAT_WIN_ALUM');
  });

  it('8. Residential building: remains UNTOUCHED by commercial glazing change', () => {
    const { qty } = getWinQty({
      lengthFt: 50, breadthFt: 40, heightFt: 30, numFloors: 3, plotAreaSqft: 3000,
      typology: 'Residential', buildingUse: '3bhk apartment', qualityTier: 'Standard'
    });
    // Residential uses roomCounts derived window count * 15 sqft
    assert.equal(qty, 450);
  });

  it('9. Industrial PEB Warehouse: remains UNTOUCHED by commercial glazing change', () => {
    const { qty } = getWinQty({
      lengthFt: 200, breadthFt: 100, heightFt: 25, numFloors: 1, plotAreaSqft: 30000,
      typology: 'Industrial', buildingUse: 'Warehouse', qualityTier: 'Economy'
    });
    // Industrial warehouse rc.windows = 6. winSqft = Math.min(facade * 0.35, 6 * 15) = 90 sqft
    assert.equal(qty, 90);
  });

  it('10. Institutional School: remains UNTOUCHED by commercial glazing change', () => {
    const { qty } = getWinQty({
      lengthFt: 100, breadthFt: 60, heightFt: 40, numFloors: 3, plotAreaSqft: 15000,
      typology: 'Institutional', buildingUse: 'School', qualityTier: 'Standard'
    });
    // Institutional rc.windows = 20 * 3 = 60. winSqft = Math.min(facade * 0.35, 60 * 22) = 1320 sqft
    assert.equal(qty, 1320);
  });
});

describe('Targeted Tests: Change #2 — Micro-Building Elevator Feasibility Guard', () => {
  function getLifts(override: Partial<FullInput>) {
    const input: FullInput = { ...BASE_INPUT, ...override };
    const cls = classifyBuilding(input);
    const items = runEstimationEngine(input, cls, DEFAULT_DATASET, 1.0);
    return items.filter(i => i.materialItemCode.startsWith('MAT_LIFT_'));
  }

  it('1. G+3 residential micro-building (<3500 sqft BUA): automatic lift SUPPRESSED', () => {
    // 30x20 ft footprint (600 sqft/floor), 4 floors = 2,400 sqft BUA
    const lifts = getLifts({
      lengthFt: 30, breadthFt: 20, heightFt: 40, numFloors: 4, plotAreaSqft: 1200,
      typology: 'Residential', buildingUse: 'Individual House', qualityTier: 'Standard'
    });
    assert.equal(lifts.length, 0, 'Automatic lift must be suppressed for micro-building');
  });

  it('2. G+3 residential non-micro building (>=3500 sqft BUA & >=800 sqft/floor): automatic lift INCLUDED', () => {
    // 40x30 ft footprint (1200 sqft/floor), 4 floors = 4,800 sqft BUA
    const lifts = getLifts({
      lengthFt: 40, breadthFt: 30, heightFt: 44, numFloors: 4, plotAreaSqft: 2000,
      typology: 'Residential', buildingUse: 'Apartment', qualityTier: 'Standard'
    });
    assert.equal(lifts.length, 1, 'Automatic lift should trigger on non-micro residential 4-storey building');
    assert.equal(lifts[0].materialItemCode, 'MAT_LIFT_4P');
    assert.equal(lifts[0].quantity, 1);
  });

  it('3. Residential building with BUA/floor < 800 sqft (even if BUA >= 3500 sqft): automatic lift SUPPRESSED', () => {
    // 25x28 ft footprint = 700 sqft/floor (<800), 5 floors = 3,500 sqft BUA
    const lifts = getLifts({
      lengthFt: 25, breadthFt: 28, heightFt: 50, numFloors: 5, plotAreaSqft: 1200,
      typology: 'Residential', buildingUse: 'Apartment', qualityTier: 'Standard'
    });
    assert.equal(lifts.length, 0, 'Automatic lift must be suppressed when floorplate < 800 sqft');
  });

  it('4. Residential building with BUA/floor >= 800 sqft and total BUA >= 3500 sqft: automatic lift INCLUDED', () => {
    // 35x25 ft footprint = 875 sqft/floor, 4 floors = 3,500 sqft BUA
    const lifts = getLifts({
      lengthFt: 35, breadthFt: 25, heightFt: 40, numFloors: 4, plotAreaSqft: 1500,
      typology: 'Residential', buildingUse: 'Apartment', qualityTier: 'Standard'
    });
    assert.equal(lifts.length, 1, 'Automatic lift must trigger when both thresholds are satisfied');
  });

  it('5. 4-floor residential micro-building with EXPLICIT numLifts = 1: ALWAYS HONORED', () => {
    // 30x20 ft footprint (600 sqft/floor), 4 floors = 2,400 sqft BUA, but user requested 1 lift
    const lifts = getLifts({
      lengthFt: 30, breadthFt: 20, heightFt: 40, numFloors: 4, plotAreaSqft: 1200,
      typology: 'Residential', buildingUse: 'Individual House', qualityTier: 'Standard',
      numLifts: 1
    });
    assert.equal(lifts.length, 1, 'Explicit user lift must NEVER be suppressed');
    assert.equal(lifts[0].quantity, 1);
    assert.equal(lifts[0].materialItemCode, 'MAT_LIFT_HYDRO'); // 4 floors gets hydraulic
  });

  it('6. 4-floor residential micro-building with EXPLICIT numLifts = 2: ALWAYS HONORED with quantity 2', () => {
    const lifts = getLifts({
      lengthFt: 30, breadthFt: 20, heightFt: 40, numFloors: 4, plotAreaSqft: 1200,
      typology: 'Residential', buildingUse: 'Individual House', qualityTier: 'Standard',
      numLifts: 2
    });
    assert.equal(lifts.length, 1);
    assert.equal(lifts[0].quantity, 2, 'Explicit quantity of 2 lifts must be preserved');
  });

  it('7. Taller residential building (G+14): gets correct high-rise lift', () => {
    const lifts = getLifts({
      lengthFt: 80, breadthFt: 60, heightFt: 150, numFloors: 15, plotAreaSqft: 15000,
      typology: 'Residential', buildingUse: 'Apartment', qualityTier: 'Standard'
    });
    assert.equal(lifts.length, 1);
    assert.equal(lifts[0].materialItemCode, 'MAT_LIFT_8P');
    assert.equal(lifts[0].quantity, Math.floor(15 / 6)); // 2 lifts
  });

  it('8. Commercial building: lift logic is UNTOUCHED by residential micro-guard', () => {
    const lifts = getLifts({
      lengthFt: 30, breadthFt: 20, heightFt: 33, numFloors: 3, plotAreaSqft: 1200,
      typology: 'Commercial', buildingUse: 'Office', qualityTier: 'Standard'
    });
    assert.equal(lifts.length, 1, 'Commercial lift must trigger per commercial rules');
    assert.equal(lifts[0].materialItemCode, 'MAT_LIFT_4P');
  });

  it('9. Institutional building: lift logic is UNTOUCHED by residential micro-guard', () => {
    const lifts = getLifts({
      lengthFt: 30, breadthFt: 20, heightFt: 33, numFloors: 3, plotAreaSqft: 1200,
      typology: 'Institutional', buildingUse: 'College', qualityTier: 'Standard'
    });
    assert.equal(lifts.length, 1, 'Institutional lift must trigger per institutional rules');
  });

  it('10. Industrial building: zero lifts generated', () => {
    const lifts = getLifts({
      lengthFt: 100, breadthFt: 50, heightFt: 25, numFloors: 1, plotAreaSqft: 10000,
      typology: 'Industrial', buildingUse: 'Factory', qualityTier: 'Standard'
    });
    assert.equal(lifts.length, 0, 'Industrial should have zero lifts');
  });
});
