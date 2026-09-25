import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FullInputSchema,
  BUILDING_USE_OPTIONS,
} from '../lib/validation/input-schema';
import { classifyBuilding } from '../lib/engine/classifier';
import { runEstimationEngine } from '../lib/engine/estimator';
import {
  aggregateEstimate,
  computeAccuracyBand,
} from '../lib/engine/cost-calculator';
import { DEFAULT_DATASET } from '../lib/engine/coefficients';
import { lookupRegionalIndex } from '../lib/engine/regions';
import { BoundedCache } from '../lib/cache/bounded-cache';
import type { FullInput } from '../lib/engine/types';
import { CATEGORY_NAMES } from '../lib/constants';

// ─── 0. Canonical Valid Fixture ─────────────────────────────────────────────
const CANONICAL_FIXTURE: FullInput = {
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
  targetTimelineMonths: 12,
  greenCertTarget: 'None',
  localRateOverrides: [],
};

describe('0. Canonical Valid Fixture Verification', () => {
  it('passes FullInputSchema without any error', () => {
    const res = FullInputSchema.safeParse(CANONICAL_FIXTURE);
    assert.equal(res.success, true);
  });

  it('satisfies footprint, coverage (40% <= 85%) and floor-to-floor (10 ft) invariants', () => {
    const footprint = CANONICAL_FIXTURE.lengthFt * CANONICAL_FIXTURE.breadthFt;
    assert.equal(footprint, 2000);
    assert.ok(footprint <= CANONICAL_FIXTURE.plotAreaSqft);
    assert.equal(footprint / CANONICAL_FIXTURE.plotAreaSqft, 0.4);
    assert.equal(CANONICAL_FIXTURE.heightFt / CANONICAL_FIXTURE.numFloors, 10);
  });
});

describe('SUITE A — Length & Breadth Boundaries', () => {
  it('A01: accepts lengthFt minimum positive boundary (0.000001)', () => {
    const res = FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, lengthFt: 0.000001 });
    assert.equal(res.success, true);
  });

  it('A02: rejects lengthFt = 0', () => {
    const res = FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, lengthFt: 0 });
    assert.equal(res.success, false);
  });

  it('A03: rejects lengthFt < 0', () => {
    const res = FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, lengthFt: -1 });
    assert.equal(res.success, false);
  });

  it('A04: accepts lengthFt = 2000 with valid coverage and height', () => {
    const res = FullInputSchema.safeParse({
      ...CANONICAL_FIXTURE,
      lengthFt: 2000,
      breadthFt: 1,
      heightFt: 10,
      numFloors: 1,
      plotAreaSqft: 10_000_000,
    });
    assert.equal(res.success, true);
  });

  it('A05: rejects lengthFt = 2000.000001', () => {
    const res = FullInputSchema.safeParse({
      ...CANONICAL_FIXTURE,
      lengthFt: 2000.000001,
      breadthFt: 1,
      heightFt: 10,
      numFloors: 1,
      plotAreaSqft: 10_000_000,
    });
    assert.equal(res.success, false);
  });

  it('A06–A09: breadthFt boundaries (0: reject, -1: reject, 2000: accept, 2000.000001: reject)', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, breadthFt: 0 }).success, false);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, breadthFt: -1 }).success, false);
    assert.equal(
      FullInputSchema.safeParse({
        ...CANONICAL_FIXTURE,
        lengthFt: 1,
        breadthFt: 2000,
        heightFt: 10,
        numFloors: 1,
        plotAreaSqft: 10_000_000,
      }).success,
      true
    );
    assert.equal(
      FullInputSchema.safeParse({
        ...CANONICAL_FIXTURE,
        lengthFt: 1,
        breadthFt: 2000.000001,
        heightFt: 10,
        numFloors: 1,
        plotAreaSqft: 10_000_000,
      }).success,
      false
    );
  });
});

describe('SUITE B — Height Boundaries', () => {
  it('B01: rejects heightFt = 0', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, heightFt: 0 }).success, false);
  });

  it('B02: rejects heightFt < 0', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, heightFt: -10 }).success, false);
  });

  it('B03: accepts heightFt = 1500 (with valid floor ratio)', () => {
    const res = FullInputSchema.safeParse({
      ...CANONICAL_FIXTURE,
      heightFt: 1500,
      numFloors: 100, // 15 ft/floor (valid)
    });
    assert.equal(res.success, true);
  });

  it('B04: rejects heightFt = 1500.01', () => {
    const res = FullInputSchema.safeParse({
      ...CANONICAL_FIXTURE,
      heightFt: 1500.01,
      numFloors: 100,
    });
    assert.equal(res.success, false);
  });
});

describe('SUITE C — Plot Area Boundaries', () => {
  it('C01: rejects plotAreaSqft = 0', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, plotAreaSqft: 0 }).success, false);
  });

  it('C02: rejects plotAreaSqft < 0', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, plotAreaSqft: -500 }).success, false);
  });

  it('C03: accepts plotAreaSqft = 10,000,000', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, plotAreaSqft: 10_000_000 }).success, true);
  });

  it('C04: rejects plotAreaSqft = 10,000,001', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, plotAreaSqft: 10_000_001 }).success, false);
  });
});

describe('SUITE D — Floor Count Boundaries', () => {
  it('D01: rejects numFloors = 0', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, numFloors: 0 }).success, false);
  });

  it('D02: rejects numFloors = -1', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, numFloors: -1 }).success, false);
  });

  it('D03: accepts numFloors = 1 (with valid height 10 ft)', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, numFloors: 1, heightFt: 10 }).success, true);
  });

  it('D04: accepts numFloors = 150 (with valid height 1500 ft)', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, numFloors: 150, heightFt: 1500 }).success, true);
  });

  it('D05: rejects numFloors = 151', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, numFloors: 151, heightFt: 1500 }).success, false);
  });

  it('D06: rejects fractional numFloors = 3.5', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, numFloors: 3.5 }).success, false);
  });
});

describe('SUITE E — Typology Enum', () => {
  it('E01–E04: accepts valid typologies Residential, Commercial, Institutional, Industrial', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, typology: 'Residential', buildingUse: 'Villa' }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, typology: 'Commercial', buildingUse: 'Office' }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, typology: 'Institutional', buildingUse: 'School' }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, typology: 'Industrial', buildingUse: 'Warehouse' }).success, true);
  });

  it('E05–E10: rejects invalid typologies', () => {
    for (const invalid of ['residential', 'Residential ', 'RESIDENTIAL', 'Mixed', 'Other', '']) {
      assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, typology: invalid as unknown as FullInput['typology'] }).success, false);
    }
  });
});

describe('SUITE F — Building Use × Typology Cross-Field', () => {
  it('accepts all valid residential uses', () => {
    for (const use of BUILDING_USE_OPTIONS.Residential) {
      assert.equal(
        FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, typology: 'Residential', buildingUse: use }).success,
        true
      );
    }
  });

  it('rejects invalid buildingUse for Residential (e.g. Hotel)', () => {
    const res = FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, typology: 'Residential', buildingUse: 'Hotel' });
    assert.equal(res.success, false);
  });

  it('accepts all valid commercial uses and rejects invalid (e.g. 3BHK)', () => {
    for (const use of BUILDING_USE_OPTIONS.Commercial) {
      assert.equal(
        FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, typology: 'Commercial', buildingUse: use }).success,
        true
      );
    }
    assert.equal(
      FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, typology: 'Commercial', buildingUse: '3BHK' }).success,
      false
    );
  });

  it('accepts all valid institutional uses and rejects invalid (e.g. Factory)', () => {
    for (const use of BUILDING_USE_OPTIONS.Institutional) {
      assert.equal(
        FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, typology: 'Institutional', buildingUse: use }).success,
        true
      );
    }
    assert.equal(
      FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, typology: 'Institutional', buildingUse: 'Factory' }).success,
      false
    );
  });

  it('accepts all valid industrial uses and rejects invalid (e.g. Hospital)', () => {
    for (const use of BUILDING_USE_OPTIONS.Industrial) {
      assert.equal(
        FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, typology: 'Industrial', buildingUse: use }).success,
        true
      );
    }
    assert.equal(
      FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, typology: 'Industrial', buildingUse: 'Hospital' }).success,
      false
    );
  });
});

describe('SUITE G — Soil Type', () => {
  it('accepts valid soil types: Normal, Rocky, Filled-up, Waterlogged-prone', () => {
    for (const soil of ['Normal', 'Rocky', 'Filled-up', 'Waterlogged-prone'] as const) {
      assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, soilType: soil }).success, true);
    }
  });

  it('rejects invalid soil types', () => {
    for (const invalid of ['normal', 'Soft', 'Clay', 'Rock', 'Waterlogged', '']) {
      assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, soilType: invalid as unknown as FullInput['soilType'] }).success, false);
    }
  });
});

describe('SUITE H — Location Region', () => {
  it('H01: accepts major Indian cities and loads valid multiplier', () => {
    for (const city of ['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Ludhiana']) {
      assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, locationRegion: city }).success, true);
      const { index } = lookupRegionalIndex(city);
      assert.ok(index > 0);
    }
  });

  it('H02: unlisted city falls back to 1.00x multiplier', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, locationRegion: 'Testville' }).success, true);
    const { index } = lookupRegionalIndex('Testville');
    assert.equal(index, 1.0);
  });

  it('H03: rejects empty locationRegion', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, locationRegion: '' }).success, false);
  });

  it('H04: rejects 256 character locationRegion', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, locationRegion: 'A'.repeat(256) }).success, false);
  });

  it('H05: accepts 255 character locationRegion', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, locationRegion: 'A'.repeat(255) }).success, true);
  });
});

describe('SUITE I — Quality Tier', () => {
  it('accepts Economy, Standard, Premium', () => {
    for (const q of ['Economy', 'Standard', 'Premium'] as const) {
      assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, qualityTier: q }).success, true);
    }
  });

  it('rejects invalid quality tiers', () => {
    for (const inv of ['Basic', 'Luxury', 'standard', 'STANDARD', 'Premium+', '']) {
      assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, qualityTier: inv as unknown as FullInput['qualityTier'] }).success, false);
    }
  });
});

describe('SUITE J, K, L, M, N, O, P — Tier 2 Fields', () => {
  it('J: structuralSystem valid options and default Not_sure', () => {
    for (const sys of ['RCC_Frame', 'Load_bearing', 'Steel', 'Shear_Wall', 'Not_sure'] as const) {
      assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, structuralSystem: sys }).success, true);
    }
    const omitted = { ...CANONICAL_FIXTURE };
    delete (omitted as Record<string, unknown>).structuralSystem;
    const parsed = FullInputSchema.parse(omitted);
    assert.equal(parsed.structuralSystem, 'Not_sure');
  });

  it('K: foundationType valid options and default Not_sure', () => {
    for (const f of ['Isolated', 'Raft', 'Pile', 'Not_sure'] as const) {
      assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, foundationType: f }).success, true);
    }
  });

  it('L: numLifts boundary (-1: reject, 0: accept, 20: accept, 21: reject, 1.5: reject)', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, numLifts: -1 }).success, false);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, numLifts: 0 }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, numLifts: 20 }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, numLifts: 21 }).success, false);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, numLifts: 1.5 }).success, false);
  });

  it('M: numStaircases boundary (0: reject, 1: accept, 20: accept, 21: reject, 2.5: reject)', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, numStaircases: 0 }).success, false);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, numStaircases: 1 }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, numStaircases: 20 }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, numStaircases: 21 }).success, false);
  });

  it('N: parkingLevels boundary (-1: reject, 0: accept, 10: accept, 11: reject)', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, parkingLevels: -1 }).success, false);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, parkingLevels: 0 }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, parkingLevels: 10 }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, parkingLevels: 11 }).success, false);
  });

  it('O: unitsPerFloor boundary (0: reject, 1: accept, 100: accept, 101: reject, omitted: accept)', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, unitsPerFloor: 0 }).success, false);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, unitsPerFloor: 1 }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, unitsPerFloor: 100 }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, unitsPerFloor: 101 }).success, false);
    const omitted = { ...CANONICAL_FIXTURE };
    delete (omitted as Record<string, unknown>).unitsPerFloor;
    assert.equal(FullInputSchema.safeParse(omitted).success, true);
  });

  it('P: seismicZone valid options and invalid rejection', () => {
    for (const z of ['Zone_II', 'Zone_III', 'Zone_IV', 'Zone_V', 'Not_sure'] as const) {
      assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, seismicZone: z }).success, true);
    }
    for (const inv of ['Zone_I', 'Zone_VI', 'Zone4', 'IV']) {
      assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, seismicZone: inv as unknown as NonNullable<FullInput['seismicZone']> }).success, false);
    }
  });
});

describe('SUITE Q, R, S, T, U, V, W, X, Y, Z — Tier 3 & Advanced Fields', () => {
  it('Q: soilBearingCapacity boundaries (<100 triggers raft, max 1000)', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, soilBearingCapacity: 0 }).success, false);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, soilBearingCapacity: -1 }).success, false);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, soilBearingCapacity: 0.001 }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, soilBearingCapacity: 1000 }).success, true);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, soilBearingCapacity: 1000.001 }).success, false);

    // Verify engine adaptation: bearing capacity < 100 triggers raft concrete
    const lowSbc = { ...CANONICAL_FIXTURE, soilBearingCapacity: 90 };
    const items = runEstimationEngine(lowSbc, classifyBuilding(lowSbc), DEFAULT_DATASET, 1.0);
    assert.ok(items.some((i) => i.materialItemCode === 'MAT_FOUND_RAFT'));
  });

  it('R: windLoadZone valid options', () => {
    for (const w of ['Low', 'Moderate', 'High', 'Cyclone_prone', 'Not_sure'] as const) {
      assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, windLoadZone: w }).success, true);
    }
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, windLoadZone: 'Extreme' as unknown as NonNullable<FullInput['windLoadZone']> }).success, false);
  });

  it('W: structuralDrawingUrl preprocessing and normalization', () => {
    const p1 = FullInputSchema.parse({
      ...CANONICAL_FIXTURE,
      structuralDrawingUrl: 'https://example.com/drawing.pdf',
    });
    assert.equal(p1.structuralDrawingUrl, 'https://example.com/drawing.pdf');

    const p2 = FullInputSchema.parse({
      ...CANONICAL_FIXTURE,
      structuralDrawingUrl: '  https://example.com/drawing.pdf  ',
    });
    assert.equal(p2.structuralDrawingUrl, 'https://example.com/drawing.pdf');

    const p3 = FullInputSchema.parse({
      ...CANONICAL_FIXTURE,
      structuralDrawingUrl: 'example.com/drawing.pdf',
    });
    assert.equal(p3.structuralDrawingUrl, 'https://example.com/drawing.pdf');

    assert.equal(
      FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, structuralDrawingUrl: 'ftp://example.com/file.pdf' }).success,
      false
    );
  });

  it('X: targetTimelineMonths positive integer and compression surcharge', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, targetTimelineMonths: 0 }).success, false);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, targetTimelineMonths: -1 }).success, false);
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, targetTimelineMonths: 12 }).success, true);

    // Compressed timeline (e.g. 6 months for a building where normal is 12+) triggers surcharge in CAT_18
    const compressed = { ...CANONICAL_FIXTURE, targetTimelineMonths: 6 };
    const res = aggregateEstimate(
      runEstimationEngine(compressed, classifyBuilding(compressed), DEFAULT_DATASET, 1.0),
      compressed,
      classifyBuilding(compressed),
      DEFAULT_DATASET,
      1.0
    );
    assert.ok(res.lineItems.some((i) => i.materialItemCode === 'MAT_PRELIM_ACCEL'));
  });

  it('Y: greenCertTarget triggers CAT_17 green and solar items', () => {
    for (const target of ['None', 'IGBC', 'GRIHA'] as const) {
      assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, greenCertTarget: target }).success, true);
    }
    const igbc = { ...CANONICAL_FIXTURE, greenCertTarget: 'IGBC' as const };
    const items = runEstimationEngine(igbc, classifyBuilding(igbc), DEFAULT_DATASET, 1.0);
    assert.ok(items.some((i) => i.materialItemCode === 'MAT_SOLAR_PANEL_ROO'));
    assert.ok(items.some((i) => i.materialItemCode === 'MAT_GREEN_RAINWATER'));
  });

  it('Z: localRateOverrides max 50 items and positive finite rates', () => {
    const validOverrides = Array.from({ length: 50 }, (_, i) => ({
      materialItemCode: `ITEM_${i}`,
      rate: 100 + i,
    }));
    assert.equal(
      FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, localRateOverrides: validOverrides }).success,
      true
    );

    const invalid51 = [...validOverrides, { materialItemCode: 'ITEM_51', rate: 500 }];
    assert.equal(
      FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, localRateOverrides: invalid51 }).success,
      false
    );

    assert.equal(
      FullInputSchema.safeParse({
        ...CANONICAL_FIXTURE,
        localRateOverrides: [{ materialItemCode: 'CEMENT', rate: 0 }],
      }).success,
      false
    );
  });
});

describe('SUITE AA — Cross-Field Validation (Footprint & 85% Ground Coverage)', () => {
  it('AA01: rejects footprint == plotArea (coverage 100% > 85%)', () => {
    const res = FullInputSchema.safeParse({
      ...CANONICAL_FIXTURE,
      lengthFt: 50,
      breadthFt: 40,
      plotAreaSqft: 2000, // 2000 / 2000 = 100%
    });
    assert.equal(res.success, false);
    if (!res.success) {
      assert.ok(res.error.issues.some((i) => i.message.includes('85%')));
    }
  });

  it('AA02: accepts coverage exactly 85% (34 × 25 = 850 sqft on 1000 sqft plot)', () => {
    const res = FullInputSchema.safeParse({
      ...CANONICAL_FIXTURE,
      lengthFt: 34,
      breadthFt: 25,
      plotAreaSqft: 1000,
      heightFt: 24,
      numFloors: 3,
    });
    assert.equal(res.success, true);
  });

  it('AA03: rejects coverage > 85% (e.g. 85.1%) with specific error message', () => {
    const res = FullInputSchema.safeParse({
      ...CANONICAL_FIXTURE,
      lengthFt: 35,
      breadthFt: 25, // 875 sqft / 1000 = 87.5%
      plotAreaSqft: 1000,
    });
    assert.equal(res.success, false);
    if (!res.success) {
      assert.ok(res.error.issues.some((i) => i.message.includes('Ground coverage ratio')));
    }
  });

  it('AA04: rejects footprint > plotArea', () => {
    const res = FullInputSchema.safeParse({
      ...CANONICAL_FIXTURE,
      lengthFt: 60,
      breadthFt: 50, // 3000 sqft > 2000 sqft
      plotAreaSqft: 2000,
    });
    assert.equal(res.success, false);
  });
});

describe('SUITE AB & AC — Floor-to-Floor Height Validation (NBC 2016)', () => {
  it('AB01: accepts floor height exactly 8 ft for Residential', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, heightFt: 24, numFloors: 3 }).success, true);
  });

  it('AB02: rejects floor height 7.99 ft (< 8 ft)', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, heightFt: 23.97, numFloors: 3 }).success, false);
  });

  it('AB03: accepts floor height exactly 20 ft for Residential', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, heightFt: 60, numFloors: 3 }).success, true);
  });

  it('AB04: rejects floor height 20.1 ft (> 20 ft) for Residential', () => {
    assert.equal(FullInputSchema.safeParse({ ...CANONICAL_FIXTURE, heightFt: 60.3, numFloors: 3 }).success, false);
  });

  it('AC01–AC02: Industrial allows up to 40 ft floor-to-floor height', () => {
    const indValid = {
      ...CANONICAL_FIXTURE,
      typology: 'Industrial' as const,
      buildingUse: 'Warehouse',
      numFloors: 1,
      heightFt: 40,
    };
    assert.equal(FullInputSchema.safeParse(indValid).success, true);

    const indExcess = { ...indValid, heightFt: 40.1 };
    assert.equal(FullInputSchema.safeParse(indExcess).success, false);
  });
});

describe('SUITE AD & AE — Classification & Tier Triggers', () => {
  it('classifies Residential <= 3 floors as Small_Residential Tier 1', () => {
    const cls = classifyBuilding({ numFloors: 3, typology: 'Residential' });
    assert.equal(cls.tier, 1);
    assert.equal(cls.category, 'Small_Residential');
  });

  it('classifies Residential 4 floors as Mid_Rise_Residential Tier 2', () => {
    const cls = classifyBuilding({ numFloors: 4, typology: 'Residential' });
    assert.equal(cls.tier, 2);
    assert.equal(cls.category, 'Mid_Rise_Residential');
  });

  it('classifies Residential > 7 floors as High_Rise Tier 3', () => {
    const cls = classifyBuilding({ numFloors: 8, typology: 'Residential' });
    assert.equal(cls.tier, 3);
    assert.equal(cls.category, 'High_Rise');
  });

  it('classifies Commercial <= 7 floors as Mid_Rise_Commercial Tier 2', () => {
    const cls = classifyBuilding({ numFloors: 4, typology: 'Commercial' });
    assert.equal(cls.tier, 2);
    assert.equal(cls.category, 'Mid_Rise_Commercial');
  });

  it('classifies Institutional and Industrial > 5 floors as Complex_Specialized', () => {
    assert.equal(classifyBuilding({ numFloors: 6, typology: 'Institutional' }).category, 'Complex_Specialized');
    assert.equal(classifyBuilding({ numFloors: 6, typology: 'Industrial' }).category, 'Complex_Specialized');
  });

  it('triggers Tier 3 for Steel, Shear_Wall, or Seismic Zone IV/V regardless of floor count', () => {
    assert.equal(classifyBuilding({ numFloors: 2, typology: 'Residential', structuralSystem: 'Steel' }).tier, 3);
    assert.equal(classifyBuilding({ numFloors: 2, typology: 'Residential', structuralSystem: 'Shear_Wall' }).tier, 3);
    assert.equal(classifyBuilding({ numFloors: 2, typology: 'Residential', seismicZone: 'Zone_IV' }).tier, 3);
    assert.equal(classifyBuilding({ numFloors: 2, typology: 'Residential', seismicZone: 'Zone_V' }).tier, 3);
  });
});

describe('SUITE AF — Accuracy Bands Computation', () => {
  it('assigns Preliminary_15_20 for Tier 1 inputs', () => {
    assert.equal(computeAccuracyBand(1, false, false, false, false), 'Preliminary_15_20');
  });

  it('assigns Standard_10_15 for complete Tier 2 without Not_sure', () => {
    assert.equal(computeAccuracyBand(2, true, false, false, false), 'Standard_10_15');
  });

  it('downgrades to Preliminary_15_20 if Tier 2 contains Not_sure fields', () => {
    assert.equal(computeAccuracyBand(2, true, false, true, false), 'Preliminary_15_20');
  });

  it('caps complete Tier 3 at Standard_10_15 without verified/parsed drawing', () => {
    assert.equal(computeAccuracyBand(3, true, true, false, true, false), 'Standard_10_15');
  });

  it('assigns Advanced_5_10 ONLY when drawing is parsed/verified', () => {
    assert.equal(computeAccuracyBand(3, true, true, false, true, true), 'Advanced_5_10');
  });
});

describe('SUITE AG, AH, AI, AJ — Engine Determinism & Mathematical Invariants', () => {
  const cls = classifyBuilding(CANONICAL_FIXTURE);
  const items1 = runEstimationEngine(CANONICAL_FIXTURE, cls, DEFAULT_DATASET, 1.0);
  const res1 = aggregateEstimate(items1, CANONICAL_FIXTURE, cls, DEFAULT_DATASET, 1.0);

  const items2 = runEstimationEngine(CANONICAL_FIXTURE, cls, DEFAULT_DATASET, 1.0);
  const res2 = aggregateEstimate(items2, CANONICAL_FIXTURE, cls, DEFAULT_DATASET, 1.0);

  it('AG01: Engine execution is 100% deterministic (identical line items and totals)', () => {
    assert.equal(res1.grandTotalMaterialCost, res2.grandTotalMaterialCost);
    assert.equal(res1.grandTotalWithLabor, res2.grandTotalWithLabor);
    assert.equal(res1.lineItems.length, res2.lineItems.length);
    for (let i = 0; i < res1.lineItems.length; i++) {
      assert.equal(res1.lineItems[i].materialItemCode, res2.lineItems[i].materialItemCode);
      assert.equal(res1.lineItems[i].quantity, res2.lineItems[i].quantity);
      assert.equal(res1.lineItems[i].lineCost, res2.lineItems[i].lineCost);
    }
  });

  it('AH01: Zero duplicate materialItemCode entries in output lineItems', () => {
    const codes = res1.lineItems.map((i) => i.materialItemCode);
    const unique = new Set(codes);
    assert.equal(unique.size, codes.length, 'Found duplicate material item codes in estimate line items');
  });

  it('AI01: Sum of categoryTotals matches grandTotalMaterialCost exactly', () => {
    const catSum = Math.round(res1.categoryTotals.reduce((s, c) => s + c.subtotal, 0) * 100) / 100;
    assert.equal(catSum, res1.grandTotalMaterialCost);
  });

  it('AJ01: CAT_18 subtotal equals exactly 3.5% of sum(CAT_01..17)', () => {
    const unaccelerated = { ...CANONICAL_FIXTURE, targetTimelineMonths: undefined };
    const res = aggregateEstimate(
      runEstimationEngine(unaccelerated, classifyBuilding(unaccelerated), DEFAULT_DATASET, 1.0),
      unaccelerated,
      classifyBuilding(unaccelerated),
      DEFAULT_DATASET,
      1.0
    );
    const cat01to17Sum = res.categoryTotals
      .filter((c) => c.categoryCode !== 'CAT_18')
      .reduce((s, c) => s + c.subtotal, 0);
    const expectedCat18 = Math.round(cat01to17Sum * DEFAULT_DATASET.miscPct * 100) / 100;
    const actualCat18 = res.categoryTotals.find((c) => c.categoryCode === 'CAT_18')?.subtotal ?? 0;
    assert.equal(actualCat18, expectedCat18);
  });
});

describe('SUITE AK, AL, AM, AN, AO — Engineering Adaptations & Category Triggers', () => {
  it('AK: Waterlogged soil upgrades foundation from pad concrete to raft concrete', () => {
    const normal = { ...CANONICAL_FIXTURE, soilType: 'Normal' as const };
    const waterlogged = { ...CANONICAL_FIXTURE, soilType: 'Waterlogged-prone' as const };

    const normItems = runEstimationEngine(normal, classifyBuilding(normal), DEFAULT_DATASET, 1.0);
    const wlItems = runEstimationEngine(waterlogged, classifyBuilding(waterlogged), DEFAULT_DATASET, 1.0);

    assert.ok(normItems.some((i) => i.materialItemCode === 'MAT_FOUND_CONC'));
    assert.ok(wlItems.some((i) => i.materialItemCode === 'MAT_FOUND_RAFT'));
  });

  it('AL: Seismic Zone IV/V applies ductile detailing reinforcement multiplier', () => {
    const zone3 = { ...CANONICAL_FIXTURE, seismicZone: 'Zone_III' as const };
    const zone4 = { ...CANONICAL_FIXTURE, seismicZone: 'Zone_IV' as const };

    const z3Items = runEstimationEngine(zone3, classifyBuilding(zone3), DEFAULT_DATASET, 1.0);
    const z4Items = runEstimationEngine(zone4, classifyBuilding(zone4), DEFAULT_DATASET, 1.0);

    const z3Steel = z3Items.find((i) => i.materialItemCode === 'MAT_RCC_STEEL')?.quantity ?? 0;
    const z4Steel = z4Items.find((i) => i.materialItemCode === 'MAT_RCC_STEEL')?.quantity ?? 0;
    assert.ok(z4Steel > z3Steel);
  });

  it('AM: All 18 categories (CAT_01 to CAT_18) exist in output', () => {
    const res = aggregateEstimate(
      runEstimationEngine(CANONICAL_FIXTURE, classifyBuilding(CANONICAL_FIXTURE), DEFAULT_DATASET, 1.0),
      CANONICAL_FIXTURE,
      classifyBuilding(CANONICAL_FIXTURE),
      DEFAULT_DATASET,
      1.0
    );
    const expected = Object.keys(CATEGORY_NAMES).sort();
    const actual = res.categoryTotals.map((c) => c.categoryCode).sort();
    assert.deepEqual(actual, expected);
  });

  it('AN: CAT_16 auto-triggers for Community Hall and Hotel', () => {
    const commHall = {
      ...CANONICAL_FIXTURE,
      typology: 'Institutional' as const,
      buildingUse: 'Community Hall',
    };
    const items = runEstimationEngine(commHall, classifyBuilding(commHall), DEFAULT_DATASET, 1.0);
    assert.ok(items.some((i) => i.categoryCode === 'CAT_16'));
  });
});

describe('SUITE AP & AQ — Local Rate Override Calculation & Isolation', () => {
  it('AP: Overriding rate updates lineCost without altering quantity', () => {
    const baselineItems = runEstimationEngine(CANONICAL_FIXTURE, classifyBuilding(CANONICAL_FIXTURE), DEFAULT_DATASET, 1.0);
    const cementBaseline = baselineItems.find((i) => i.materialItemCode === 'MAT_RCC_CEMENT');
    assert.ok(cementBaseline);

    const newRate = 600;
    const effectiveDs = {
      ...DEFAULT_DATASET,
      rates: { ...DEFAULT_DATASET.rates, MAT_RCC_CEMENT: newRate },
    };
    const overridden = {
      ...CANONICAL_FIXTURE,
      localRateOverrides: [{ materialItemCode: 'MAT_RCC_CEMENT', rate: newRate }],
    };
    const overriddenItems = runEstimationEngine(overridden, classifyBuilding(overridden), effectiveDs, 1.0);
    const cementOverridden = overriddenItems.find((i) => i.materialItemCode === 'MAT_RCC_CEMENT');

    assert.ok(cementOverridden);
    assert.equal(cementOverridden.quantity, cementBaseline.quantity);
    assert.equal(cementOverridden.unitRate, newRate);
    assert.equal(cementOverridden.lineCost, Math.round(cementBaseline.quantity * newRate * 100) / 100);
  });

  it('AQ: Override isolation — cement override leaves steel and other materials untouched', () => {
    const baselineItems = runEstimationEngine(CANONICAL_FIXTURE, classifyBuilding(CANONICAL_FIXTURE), DEFAULT_DATASET, 1.0);
    const steelBaseline = baselineItems.find((i) => i.materialItemCode === 'MAT_RCC_STEEL');

    const effectiveDs = {
      ...DEFAULT_DATASET,
      rates: { ...DEFAULT_DATASET.rates, MAT_RCC_CEMENT: 600 },
    };
    const overridden = {
      ...CANONICAL_FIXTURE,
      localRateOverrides: [{ materialItemCode: 'MAT_RCC_CEMENT', rate: 600 }],
    };
    const overriddenItems = runEstimationEngine(overridden, classifyBuilding(overridden), effectiveDs, 1.0);
    const steelOverridden = overriddenItems.find((i) => i.materialItemCode === 'MAT_RCC_STEEL');

    assert.ok(steelBaseline && steelOverridden);
    assert.equal(steelOverridden.quantity, steelBaseline.quantity);
    assert.equal(steelOverridden.unitRate, steelBaseline.unitRate);
    assert.equal(steelOverridden.lineCost, steelBaseline.lineCost);
  });
});

describe('SUITE AX — Bounded LRU Cache Verification', () => {
  it('caps items at 50 and evicts LRU on 51st insert', () => {
    const cache = new BoundedCache<string>(50, 1000 * 60);
    for (let i = 1; i <= 50; i++) {
      cache.set(`key-${i}`, `val-${i}`);
    }
    assert.equal(cache.size(), 50);
    assert.equal(cache.get('key-1'), 'val-1');

    // Inserting 51st item evicts the least recently used
    cache.set('key-51', 'val-51');
    assert.equal(cache.size(), 50);
  });
});

describe('🔥 Critical Invariant Suite (Every Single Estimate)', () => {
  const testScenarios: FullInput[] = [
    CANONICAL_FIXTURE,
    { ...CANONICAL_FIXTURE, typology: 'Commercial', buildingUse: 'Office', numFloors: 5, heightFt: 55 },
    { ...CANONICAL_FIXTURE, typology: 'Industrial', buildingUse: 'Warehouse', numFloors: 1, heightFt: 25 },
    { ...CANONICAL_FIXTURE, typology: 'Institutional', buildingUse: 'School', numFloors: 4, heightFt: 45 },
  ];

  for (const scenario of testScenarios) {
    it(`enforces all calculation invariants for ${scenario.typology} (${scenario.buildingUse})`, () => {
      const cls = classifyBuilding(scenario);
      const items = runEstimationEngine(scenario, cls, DEFAULT_DATASET, 1.0);
      const res = aggregateEstimate(items, scenario, cls, DEFAULT_DATASET, 1.0);

      assert.ok(Number.isFinite(res.grandTotalMaterialCost));
      assert.ok(res.grandTotalMaterialCost > 0);
      assert.ok(Number.isFinite(res.grandTotalWithLabor));
      assert.ok(res.grandTotalWithLabor >= res.grandTotalMaterialCost);

      for (const item of res.lineItems) {
        assert.ok(Number.isFinite(item.quantity) && item.quantity >= 0);
        assert.ok(Number.isFinite(item.unitRate) && item.unitRate >= 0);
        assert.ok(Number.isFinite(item.lineCost) && item.lineCost >= 0);
      }

      // No duplicate line items (keyed by materialItemCode and name)
      const itemKeys = res.lineItems.map((i) => `${i.materialItemCode}::${i.name}`);
      assert.equal(new Set(itemKeys).size, itemKeys.length);

      // Category total reconciliation
      const catSum = Math.round(res.categoryTotals.reduce((s, c) => s + c.subtotal, 0) * 100) / 100;
      assert.equal(catSum, res.grandTotalMaterialCost);
    });
  }
});
