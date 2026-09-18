import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lookupRegionalIndex, lookupSeismicZone, DEFAULT_DATASET } from '../lib/engine/coefficients';

describe('Regional Index Matcher (lookupRegionalIndex)', () => {
  it('performs exact match for known cities', () => {
    const b = lookupRegionalIndex('Bengaluru');
    assert.equal(b.matchedCity, 'bengaluru');
    assert.equal(b.index, 1.22);

    const m = lookupRegionalIndex('Mumbai');
    assert.equal(m.matchedCity, 'mumbai');
    assert.equal(m.index, 1.38);
  });

  it('performs case-insensitive exact matching', () => {
    const res = lookupRegionalIndex('mumbai');
    assert.equal(res.matchedCity, 'mumbai');
    assert.equal(res.index, 1.38);
  });

  it('performs prefix matching when query matches city prefix', () => {
    const res = lookupRegionalIndex('hyderabad');
    assert.equal(res.matchedCity, 'hyderabad');
    assert.equal(res.index, 1.14);
  });

  it('performs substring matching when city name is contained inside query', () => {
    const res = lookupRegionalIndex('Greater Kolkata Area');
    assert.equal(res.matchedCity, 'kolkata');
    assert.equal(res.index, 1.12);
  });

  it('falls back to default 1.00 for unknown locations', () => {
    const res = lookupRegionalIndex('Random Nonexistent City XYZ');
    assert.equal(res.index, 1.00);
    assert.equal(res.matchedCity, null);
  });

  it('falls back to default for inputs shorter than 3 characters', () => {
    const res = lookupRegionalIndex('DL');
    assert.equal(res.index, 1.00);
    assert.equal(res.matchedCity, null);
  });

  it('handles empty or whitespace strings gracefully', () => {
    const res = lookupRegionalIndex('   ');
    assert.equal(res.index, 1.00);
    assert.equal(res.matchedCity, null);
  });
});

describe('Seismic Zone Lookup (lookupSeismicZone)', () => {
  it('resolves seismic zones for major cities accurately', () => {
    assert.equal(lookupSeismicZone('Bengaluru'), 'Zone_II');
    assert.equal(lookupSeismicZone('Mumbai'), 'Zone_III');
    assert.equal(lookupSeismicZone('Delhi'), 'Zone_IV');
    assert.equal(lookupSeismicZone('Guwahati'), 'Zone_V');
  });
});

describe('Coefficient Dataset Invariants (DEFAULT_DATASET)', () => {
  it('has a valid version string', () => {
    assert.ok(DEFAULT_DATASET.version.length > 0);
    assert.equal(typeof DEFAULT_DATASET.version, 'string');
  });

  it('has valid quality multipliers with monotonic progression Economy < Standard < Premium', () => {
    const qm = DEFAULT_DATASET.qualityMultipliers;
    assert.ok(qm.Economy < qm.Standard);
    assert.ok(qm.Standard < qm.Premium);
    assert.equal(qm.Standard, 1.0);
  });

  it('has structural multipliers for all systems', () => {
    const sm = DEFAULT_DATASET.structMultipliers;
    assert.ok(sm.RCC_Frame);
    assert.ok(sm.Load_bearing);
    assert.ok(sm.Shear_Wall);
    assert.ok(sm.Steel);
    assert.ok(sm.Not_sure);
    assert.equal(sm.RCC_Frame.cm, 1.0);
    assert.equal(sm.RCC_Frame.sm, 1.0);
  });

  it('has seismic multipliers monotonic by severity (Zone II <= Zone III <= Zone IV <= Zone V)', () => {
    const seis = DEFAULT_DATASET.seismicMultipliers;
    assert.ok(seis.Zone_II <= seis.Zone_III);
    assert.ok(seis.Zone_III <= seis.Zone_IV);
    assert.ok(seis.Zone_IV <= seis.Zone_V);
    assert.equal(seis.Zone_II, 1.0);
    assert.equal(seis.Zone_V, 1.175);
  });

  it('contains rates for standard structural line items with non-zero positive prices', () => {
    const essentialItems = [
      'MAT_FOUND_EXCAV', 'MAT_FOUND_PCC', 'MAT_FOUND_CONC', 'MAT_FOUND_STEEL',
      'MAT_RCC_CEMENT', 'MAT_RCC_STEEL', 'MAT_RCC_SAND', 'MAT_RCC_AGGREGATE_20MM',
      'MAT_MASON_BLOCK', 'MAT_MASON_BRICK', 'MAT_PLAST_CEMENT',
      'MAT_FLOOR_VIT', 'MAT_PAINT_PUTTY', 'MAT_ELEC_POINT', 'MAT_PLUMB_PIPE_CPVC',
    ];
    for (const code of essentialItems) {
      const rate = DEFAULT_DATASET.rates[code];
      assert.ok(rate && rate > 0, `Expected ${code} to have a positive rate in DEFAULT_DATASET`);
    }
  });
});
