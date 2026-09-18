import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deriveDimensions, deriveRoomCounts, runEstimationEngine } from '../lib/engine/estimator';
import { DEFAULT_DATASET } from '../lib/engine/coefficients';
import { classifyBuilding } from '../lib/engine/classifier';
import type { FullInput } from '../lib/engine/types';

describe('Geometry & Room Dimensions Derivation', () => {
  it('correctly computes floor dimensions and total BUA', () => {
    const dim = deriveDimensions({
      lengthFt: 50, breadthFt: 40, heightFt: 30, numFloors: 3,
      plotAreaSqft: 3000, typology: 'Residential', buildingUse: 'Villa',
      soilType: 'Normal', locationRegion: 'Delhi NCR', qualityTier: 'Standard',
    });
    assert.equal(dim.buaPerFloor, 2000);
    assert.equal(dim.totalBuaSqft, 6000);
    assert.equal(dim.perimeterFt, 180);
    assert.equal(dim.floorTier, 'G1_G3');
  });

  it('correctly reduces exposed facade area for row houses (shared party walls)', () => {
    const standard = deriveDimensions({
      lengthFt: 40, breadthFt: 25, heightFt: 20, numFloors: 2,
      plotAreaSqft: 2000, typology: 'Residential', buildingUse: 'Independent House',
      soilType: 'Normal', locationRegion: 'Delhi NCR', qualityTier: 'Standard',
    });
    const rowHouse = deriveDimensions({
      lengthFt: 40, breadthFt: 25, heightFt: 20, numFloors: 2,
      plotAreaSqft: 2000, typology: 'Residential', buildingUse: 'Row House',
      soilType: 'Normal', locationRegion: 'Delhi NCR', qualityTier: 'Standard',
    });
    assert.ok(rowHouse.facadeAreaSqft < standard.facadeAreaSqft);
  });

  it('assigns correct floor tiers according to floor count', () => {
    const base: FullInput = {
      lengthFt: 30, breadthFt: 20, heightFt: 10, numFloors: 1,
      plotAreaSqft: 1000, typology: 'Residential', buildingUse: 'House',
      soilType: 'Normal', locationRegion: 'Pune', qualityTier: 'Standard',
    };
    assert.equal(deriveDimensions({ ...base, numFloors: 3 }).floorTier, 'G1_G3');
    assert.equal(deriveDimensions({ ...base, numFloors: 6 }).floorTier, 'G4_G7');
    assert.equal(deriveDimensions({ ...base, numFloors: 12 }).floorTier, 'G8_G15');
    assert.equal(deriveDimensions({ ...base, numFloors: 20 }).floorTier, 'G16_PLUS');
  });

  it('derives room counts accurately for diverse residential and commercial uses', () => {
    const studio = deriveRoomCounts('Studio Apartment', 1, 1, 'Residential', 500);
    assert.equal(studio.doors, 3);
    assert.equal(studio.bathrooms, 1);

    const threeBhk = deriveRoomCounts('3 BHK Apartment', 1, 1, 'Residential', 1500);
    assert.equal(threeBhk.doors, 9);
    assert.equal(threeBhk.bathrooms, 3);

    const office = deriveRoomCounts('Office', 1, 1, 'Commercial', 3000);
    assert.equal(office.doors, 6);
    assert.equal(office.windows, 16);
  });
});

describe('Quantification Engine (runEstimationEngine)', () => {
  it('generates line items for a standard residential villa without error', () => {
    const input: FullInput = {
      lengthFt: 40, breadthFt: 30, heightFt: 22, plotAreaSqft: 2400, numFloors: 2,
      typology: 'Residential', buildingUse: 'Villa', soilType: 'Normal',
      locationRegion: 'Bengaluru', qualityTier: 'Standard',
    };
    const cls = classifyBuilding(input);
    const items = runEstimationEngine(input, cls, DEFAULT_DATASET, 1.22);
    assert.ok(items.length > 20);

    // Invariant checks
    for (const item of items) {
      assert.ok(item.quantity > 0, `Line item ${item.materialItemCode} has zero or negative quantity`);
      assert.ok(item.unitRate > 0, `Line item ${item.materialItemCode} has zero or negative unitRate`);
      assert.ok(item.lineCost > 0, `Line item ${item.materialItemCode} has zero or negative lineCost`);
    }
  });

  it('adjusts foundations for waterlogged soil by upgrading to raft/piles', () => {
    const normalInput: FullInput = {
      lengthFt: 40, breadthFt: 30, heightFt: 22, plotAreaSqft: 2400, numFloors: 2,
      typology: 'Residential', buildingUse: 'Villa', soilType: 'Normal',
      locationRegion: 'Bengaluru', qualityTier: 'Standard',
    };
    const waterloggedInput: FullInput = {
      ...normalInput,
      soilType: 'Waterlogged-prone',
    };

    const normalItems = runEstimationEngine(normalInput, classifyBuilding(normalInput), DEFAULT_DATASET, 1.0);
    const wlItems = runEstimationEngine(waterloggedInput, classifyBuilding(waterloggedInput), DEFAULT_DATASET, 1.0);

    const normalConc = normalItems.find(i => i.materialItemCode === 'MAT_FOUND_CONC');
    const wlRaft = wlItems.find(i => i.materialItemCode === 'MAT_FOUND_RAFT');
    const normalSteel = normalItems.find(i => i.materialItemCode === 'MAT_FOUND_STEEL')?.quantity ?? 0;
    const wlSteel = wlItems.find(i => i.materialItemCode === 'MAT_FOUND_STEEL')?.quantity ?? 0;

    assert.ok(normalConc, 'Normal soil should use isolated pad footing (MAT_FOUND_CONC)');
    assert.ok(wlRaft, 'Waterlogged soil should upgrade foundation to raft (MAT_FOUND_RAFT)');
    assert.ok(wlSteel > normalSteel, 'Raft foundation should require higher reinforcement steel than pad footing');
  });

  it('handles PEB Structural Steel for Industrial buildings', () => {
    const pebInput: FullInput = {
      lengthFt: 100, breadthFt: 80, heightFt: 30, plotAreaSqft: 15000, numFloors: 1,
      typology: 'Industrial', buildingUse: 'Warehouse', soilType: 'Normal',
      locationRegion: 'Pune', qualityTier: 'Economy', structuralSystem: 'Steel',
    };
    const cls = classifyBuilding(pebInput);
    const items = runEstimationEngine(pebInput, cls, DEFAULT_DATASET, 1.0);

    const pebSteel = items.find(i => i.materialItemCode === 'MAT_STEEL_STRUCT');
    assert.ok(pebSteel, 'Expected MAT_STEEL_STRUCT line item in industrial PEB building');
    assert.ok(pebSteel.quantity > 0);
  });

  it('applies ductile detailing multiplier in high seismic zones (Zone IV & V)', () => {
    const zone2Input: FullInput = {
      lengthFt: 40, breadthFt: 30, heightFt: 22, plotAreaSqft: 2400, numFloors: 2,
      typology: 'Residential', buildingUse: 'Villa', soilType: 'Normal',
      locationRegion: 'Bengaluru', qualityTier: 'Standard', seismicZone: 'Zone_II',
    };
    const zone5Input: FullInput = {
      ...zone2Input,
      seismicZone: 'Zone_V',
    };

    const z2Items = runEstimationEngine(zone2Input, classifyBuilding(zone2Input), DEFAULT_DATASET, 1.0);
    const z5Items = runEstimationEngine(zone5Input, classifyBuilding(zone5Input), DEFAULT_DATASET, 1.0);

    const z2Steel = z2Items.find(i => i.materialItemCode === 'MAT_RCC_STEEL')?.quantity ?? 0;
    const z5Steel = z5Items.find(i => i.materialItemCode === 'MAT_RCC_STEEL')?.quantity ?? 0;
    assert.ok(z5Steel > z2Steel, 'Zone V should have higher reinforcement steel quantity than Zone II');
  });

  it('incorporates wind lateral load multiplier when High or Cyclone_prone is selected', () => {
    const modInput: FullInput = {
      lengthFt: 100, breadthFt: 80, heightFt: 30, plotAreaSqft: 15000, numFloors: 1,
      typology: 'Industrial', buildingUse: 'Warehouse', soilType: 'Normal',
      locationRegion: 'Chennai', qualityTier: 'Standard', structuralSystem: 'Steel',
      windLoadZone: 'Moderate',
    };
    const cycloneInput: FullInput = {
      ...modInput,
      windLoadZone: 'Cyclone_prone',
    };

    const modItems = runEstimationEngine(modInput, classifyBuilding(modInput), DEFAULT_DATASET, 1.0);
    const cycItems = runEstimationEngine(cycloneInput, classifyBuilding(cycloneInput), DEFAULT_DATASET, 1.0);

    const modPeb = modItems.find(i => i.materialItemCode === 'MAT_STEEL_STRUCT')?.quantity ?? 0;
    const cycPeb = cycItems.find(i => i.materialItemCode === 'MAT_STEEL_STRUCT')?.quantity ?? 0;
    assert.ok(cycPeb > modPeb, 'Cyclone-prone wind zone should apply lateral uplift steel multiplier');
  });

  it('includes mandatory fire sprinklers for tall structures (>= 8 floors)', () => {
    const highRiseInput: FullInput = {
      lengthFt: 80, breadthFt: 60, heightFt: 100, plotAreaSqft: 10000, numFloors: 9,
      typology: 'Residential', buildingUse: 'Apartment', soilType: 'Normal',
      locationRegion: 'Mumbai', qualityTier: 'Standard',
    };
    const cls = classifyBuilding(highRiseInput);
    const items = runEstimationEngine(highRiseInput, cls, DEFAULT_DATASET, 1.38);

    const sprinkler = items.find(i => i.materialItemCode === 'MAT_FIRE_SPRINKLER');
    assert.ok(sprinkler, 'Mandatory fire sprinkler system required for >=8 floors per NBC Part 4');
  });

  it('guarantees engine determinism: identical inputs produce identical line items', () => {
    const input: FullInput = {
      lengthFt: 50, breadthFt: 35, heightFt: 33, plotAreaSqft: 3000, numFloors: 3,
      typology: 'Residential', buildingUse: 'Villa', soilType: 'Normal',
      locationRegion: 'Hyderabad', qualityTier: 'Premium',
    };
    const cls = classifyBuilding(input);
    const run1 = runEstimationEngine(input, cls, DEFAULT_DATASET, 1.15);
    const run2 = runEstimationEngine(input, cls, DEFAULT_DATASET, 1.15);

    assert.equal(run1.length, run2.length);
    for (let i = 0; i < run1.length; i++) {
      assert.equal(run1[i].materialItemCode, run2[i].materialItemCode);
      assert.equal(run1[i].quantity, run2[i].quantity);
      assert.equal(run1[i].unitRate, run2[i].unitRate);
      assert.equal(run1[i].lineCost, run2[i].lineCost);
    }
  });
});
