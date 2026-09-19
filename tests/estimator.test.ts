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

  it('guarantees no duplicate (materialItemCode, name) pairs within an estimate for any scenario (N-2)', () => {
    const testInputs: FullInput[] = [
      // Scenario A: Standard Villa
      {
        lengthFt: 40, breadthFt: 30, heightFt: 22, plotAreaSqft: 2400, numFloors: 2,
        typology: 'Residential', buildingUse: 'Villa / Individual House',
        soilType: 'Normal', locationRegion: 'Bengaluru', qualityTier: 'Standard',
      },
      // Scenario D: Commercial Office
      {
        lengthFt: 100, breadthFt: 80, heightFt: 120, plotAreaSqft: 15000, numFloors: 10,
        typology: 'Commercial', buildingUse: 'Office',
        soilType: 'Normal', locationRegion: 'Mumbai', qualityTier: 'Standard',
        foundationType: 'Raft', seismicZone: 'Zone_III', facadeType: 'Curtain_Wall',
        parkingLevels: 2, fireHvacScope: 'Full_Central',
      },
      // Scenario E: Industrial Warehouse (generates roof sheeting, wall cladding, floor slab, dock apron)
      {
        lengthFt: 200, breadthFt: 150, heightFt: 30, plotAreaSqft: 35000, numFloors: 1,
        typology: 'Industrial', buildingUse: 'Warehouse',
        soilType: 'Normal', locationRegion: 'Ludhiana', qualityTier: 'Economy',
        structuralSystem: 'Steel',
      },
      // Pharma / cleanroom factory
      {
        lengthFt: 120, breadthFt: 80, heightFt: 25, plotAreaSqft: 15000, numFloors: 2,
        typology: 'Industrial', buildingUse: 'Pharma manufacturing cleanroom',
        soilType: 'Normal', locationRegion: 'Hyderabad', qualityTier: 'Premium',
        structuralSystem: 'Steel',
      },
    ];

    for (const input of testInputs) {
      const cls = classifyBuilding(input);
      const items = runEstimationEngine(input, cls, DEFAULT_DATASET, 1.2);
      const seen = new Set<string>();

      for (const item of items) {
        const pairKey = `${item.materialItemCode}::${item.name}`;
        assert.ok(
          !seen.has(pairKey),
          `Duplicate (materialItemCode, name) pair found in typology ${input.typology}: "${pairKey}"`,
        );
        seen.add(pairKey);
      }
    }
  });

  it('wires and emits CAT_16 swimming pool and recreation items when buildingUse is community hall or clubhouse (N-5)', () => {
    const input: FullInput = {
      lengthFt: 100, breadthFt: 100, heightFt: 30, plotAreaSqft: 20000, numFloors: 2,
      typology: 'Institutional', buildingUse: 'Community Hall',
      soilType: 'Normal', locationRegion: 'Bengaluru', qualityTier: 'Premium',
    };
    const cls = classifyBuilding(input);
    const items = runEstimationEngine(input, cls, DEFAULT_DATASET, 1.0);
    const poolItems = items.filter(i => i.categoryCode === 'CAT_16');
    assert.ok(poolItems.length > 0, 'Expected CAT_16 line items for community hall / clubhouse');
    const codes = poolItems.map(i => i.materialItemCode);
    assert.ok(codes.includes('MAT_CLUB_FINISH'), 'Expected MAT_CLUB_FINISH');
    assert.ok(codes.includes('MAT_GYM_EQUIP'), 'Expected MAT_GYM_EQUIP');
    assert.ok(codes.includes('MAT_POOL_TILE'), 'Expected MAT_POOL_TILE');
  });

  it('triggers raft foundation when soilBearingCapacity is low (<100 kN/m²) (H-6, P1)', () => {
    const baseInput: FullInput = {
      lengthFt: 40, breadthFt: 30, heightFt: 22, plotAreaSqft: 2400, numFloors: 2,
      typology: 'Residential', buildingUse: 'Villa',
      soilType: 'Normal', locationRegion: 'Bengaluru', qualityTier: 'Standard',
      soilBearingCapacity: 150, // firm soil -> isolated footings
    };
    const softSoilInput: FullInput = {
      ...baseInput,
      soilBearingCapacity: 80, // soft soil condition (< 100) -> raft foundation
    };
    const cls = classifyBuilding(baseInput);
    const firmItems = runEstimationEngine(baseInput, cls, DEFAULT_DATASET, 1.0);
    const softItems = runEstimationEngine(softSoilInput, cls, DEFAULT_DATASET, 1.0);

    const firmHasRaft = firmItems.some(i => i.materialItemCode === 'MAT_FOUND_RAFT');
    const softHasRaft = softItems.some(i => i.materialItemCode === 'MAT_FOUND_RAFT');
    assert.equal(firmHasRaft, false, 'Expected no raft foundation on firm soil (150 kN/m²)');
    assert.equal(softHasRaft, true, 'Expected MAT_FOUND_RAFT when soilBearingCapacity < 100 kN/m²');
  });

  it('podiumLevels increases MAT_STAIR_CONC and MAT_STAIR_STEEL quantities (P1)', () => {
    const baseInput: FullInput = {
      lengthFt: 80, breadthFt: 60, heightFt: 80, plotAreaSqft: 8000, numFloors: 6,
      typology: 'Commercial', buildingUse: 'Office',
      soilType: 'Normal', locationRegion: 'Bengaluru', qualityTier: 'Standard',
      podiumLevels: 0,
    };
    const podiumInput: FullInput = {
      ...baseInput,
      podiumLevels: 2,
    };
    const cls = classifyBuilding(baseInput);
    const baseItems = runEstimationEngine(baseInput, cls, DEFAULT_DATASET, 1.0);
    const podiumItems = runEstimationEngine(podiumInput, cls, DEFAULT_DATASET, 1.0);

    const baseStairConc = baseItems.find(i => i.materialItemCode === 'MAT_STAIR_CONC')!.quantity;
    const podiumStairConc = podiumItems.find(i => i.materialItemCode === 'MAT_STAIR_CONC')!.quantity;
    const baseStairSteel = baseItems.find(i => i.materialItemCode === 'MAT_STAIR_STEEL')!.quantity;
    const podiumStairSteel = podiumItems.find(i => i.materialItemCode === 'MAT_STAIR_STEEL')!.quantity;

    assert.ok(podiumStairConc > baseStairConc, `Expected podiumLevels: 2 to increase stair concrete (${podiumStairConc} > ${baseStairConc})`);
    assert.ok(podiumStairSteel > baseStairSteel, `Expected podiumLevels: 2 to increase stair steel (${podiumStairSteel} > ${baseStairSteel})`);
  });

  it('serviceFloors increases MAT_STAIR_CONC and MAT_STAIR_STEEL quantities (P1)', () => {
    const baseInput: FullInput = {
      lengthFt: 80, breadthFt: 60, heightFt: 80, plotAreaSqft: 8000, numFloors: 6,
      typology: 'Commercial', buildingUse: 'Office',
      soilType: 'Normal', locationRegion: 'Bengaluru', qualityTier: 'Standard',
      serviceFloors: 0,
    };
    const serviceInput: FullInput = {
      ...baseInput,
      serviceFloors: 2,
    };
    const cls = classifyBuilding(baseInput);
    const baseItems = runEstimationEngine(baseInput, cls, DEFAULT_DATASET, 1.0);
    const serviceItems = runEstimationEngine(serviceInput, cls, DEFAULT_DATASET, 1.0);

    const baseStairConc = baseItems.find(i => i.materialItemCode === 'MAT_STAIR_CONC')!.quantity;
    const serviceStairConc = serviceItems.find(i => i.materialItemCode === 'MAT_STAIR_CONC')!.quantity;
    const baseStairSteel = baseItems.find(i => i.materialItemCode === 'MAT_STAIR_STEEL')!.quantity;
    const serviceStairSteel = serviceItems.find(i => i.materialItemCode === 'MAT_STAIR_STEEL')!.quantity;

    assert.ok(serviceStairConc > baseStairConc, `Expected serviceFloors: 2 to increase stair concrete (${serviceStairConc} > ${baseStairConc})`);
    assert.ok(serviceStairSteel > baseStairSteel, `Expected serviceFloors: 2 to increase stair steel (${serviceStairSteel} > ${baseStairSteel})`);
  });

  it('greenCertTarget triggers solar, rainwater harvesting, and water-saving fixtures (P1)', () => {
    const noneInput: FullInput = {
      lengthFt: 40, breadthFt: 30, heightFt: 22, plotAreaSqft: 1200, numFloors: 2, // 2400 sqft BUA, small plot < 1500
      typology: 'Residential', buildingUse: 'Villa',
      soilType: 'Normal', locationRegion: 'Bengaluru', qualityTier: 'Standard',
      greenCertTarget: 'None',
    };
    const igbcInput: FullInput = {
      ...noneInput,
      greenCertTarget: 'IGBC',
    };
    const cls = classifyBuilding(noneInput);
    const noneItems = runEstimationEngine(noneInput, cls, DEFAULT_DATASET, 1.0);
    const igbcItems = runEstimationEngine(igbcInput, cls, DEFAULT_DATASET, 1.0);

    const noneSolar = noneItems.some(i => i.materialItemCode === 'MAT_SOLAR_PANEL_ROO');
    const igbcSolar = igbcItems.some(i => i.materialItemCode === 'MAT_SOLAR_PANEL_ROO');
    const noneRwh = noneItems.some(i => i.materialItemCode === 'MAT_GREEN_RAINWATER');
    const igbcRwh = igbcItems.some(i => i.materialItemCode === 'MAT_GREEN_RAINWATER');
    const noneDual = noneItems.some(i => i.materialItemCode === 'MAT_GREEN_DUAL_FLUSH');
    const igbcDual = igbcItems.some(i => i.materialItemCode === 'MAT_GREEN_DUAL_FLUSH');

    assert.equal(noneSolar, false, 'Expected no solar on small standard residential with greenCertTarget: None');
    assert.equal(igbcSolar, true, 'Expected MAT_SOLAR_PANEL_ROO when greenCertTarget is IGBC');
    assert.equal(noneRwh, false, 'Expected no RWH on small plot with greenCertTarget: None');
    assert.equal(igbcRwh, true, 'Expected MAT_GREEN_RAINWATER when greenCertTarget is IGBC');
    assert.equal(noneDual, false, 'Expected no dual-flush on standard quality with greenCertTarget: None');
    assert.equal(igbcDual, true, 'Expected MAT_GREEN_DUAL_FLUSH when greenCertTarget is IGBC');
  });
});


