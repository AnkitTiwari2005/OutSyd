import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyBuilding, getRequiredTiers } from '../lib/engine/classifier';

describe('Classifier Engine (classifyBuilding)', () => {
  it('classifies G+1 residential house as Tier 1 Small_Residential', () => {
    const res = classifyBuilding({
      numFloors: 2,
      typology: 'Residential',
    });
    assert.equal(res.tier, 1);
    assert.equal(res.category, 'Small_Residential');
    assert.equal(res.reasons.length, 0);
  });

  it('classifies G+3 residential as Tier 1 Small_Residential', () => {
    const res = classifyBuilding({
      numFloors: 3,
      typology: 'Residential',
    });
    assert.equal(res.tier, 1);
    assert.equal(res.category, 'Small_Residential');
  });

  it('triggers Tier 2 for residential with >3 floors', () => {
    const res = classifyBuilding({
      numFloors: 4,
      typology: 'Residential',
    });
    assert.equal(res.tier, 2);
    assert.equal(res.category, 'Mid_Rise_Residential');
    assert.ok(res.reasons.some(r => r.includes('exceeds 3-floor')));
  });

  it('triggers Tier 2 for Commercial building even with 1 floor', () => {
    const res = classifyBuilding({
      numFloors: 1,
      typology: 'Commercial',
    });
    assert.equal(res.tier, 2);
    assert.equal(res.category, 'Mid_Rise_Commercial');
    assert.ok(res.reasons.some(r => r.includes('Non-residential')));
  });

  it('triggers Tier 2 for Institutional and Industrial typologies', () => {
    const inst = classifyBuilding({ numFloors: 2, typology: 'Institutional' });
    assert.equal(inst.tier, 2);
    assert.equal(inst.category, 'Institutional_Facility');

    const ind = classifyBuilding({ numFloors: 1, typology: 'Industrial' });
    assert.equal(ind.tier, 2);
    assert.equal(ind.category, 'Industrial_Facility');
  });

  it('classifies >5 floors institutional/industrial as Complex_Specialized', () => {
    const res = classifyBuilding({
      numFloors: 6,
      typology: 'Institutional',
    });
    assert.equal(res.tier, 2);
    assert.equal(res.category, 'Complex_Specialized');
    assert.ok(res.reasons.some(r => r.includes('Complex Specialized')));
  });

  it('triggers Tier 3 and High_Rise category for >7 floors', () => {
    const res = classifyBuilding({
      numFloors: 8,
      typology: 'Residential',
    });
    assert.equal(res.tier, 3);
    assert.equal(res.category, 'High_Rise');
    assert.ok(res.reasons.some(r => r.includes('High Rise')));
  });

  it('triggers Tier 3 for Steel or Shear_Wall structural systems', () => {
    const steelRes = classifyBuilding({
      numFloors: 2,
      typology: 'Residential',
      structuralSystem: 'Steel',
    });
    assert.equal(steelRes.tier, 3);
    assert.ok(steelRes.reasons.some(r => r.includes('Steel')));

    const shearRes = classifyBuilding({
      numFloors: 3,
      typology: 'Residential',
      structuralSystem: 'Shear_Wall',
    });
    assert.equal(shearRes.tier, 3);
    assert.ok(shearRes.reasons.some(r => r.includes('Shear_Wall')));
  });

  it('triggers Tier 3 for high seismic zones (Zone IV and Zone V)', () => {
    const zone4 = classifyBuilding({
      numFloors: 2,
      typology: 'Residential',
      seismicZone: 'Zone_IV',
    });
    assert.equal(zone4.tier, 3);
    assert.ok(zone4.reasons.some(r => r.includes('Zone_IV')));

    const zone5 = classifyBuilding({
      numFloors: 2,
      typology: 'Residential',
      seismicZone: 'Zone_V',
    });
    assert.equal(zone5.tier, 3);
    assert.ok(zone5.reasons.some(r => r.includes('Zone_V')));
  });

  it('leaves Tier 1 for low seismic zones (Zone II, Zone III, or Not_sure)', () => {
    const zone2 = classifyBuilding({
      numFloors: 2,
      typology: 'Residential',
      seismicZone: 'Zone_II',
    });
    assert.equal(zone2.tier, 1);

    const zone3 = classifyBuilding({
      numFloors: 2,
      typology: 'Residential',
      seismicZone: 'Zone_III',
    });
    assert.equal(zone3.tier, 1);
  });
});

describe('getRequiredTiers', () => {
  it('returns false for both tier 2 and tier 3 for G+2 residential', () => {
    const { showTier2, showTier3 } = getRequiredTiers({ numFloors: 2, typology: 'Residential' });
    assert.equal(showTier2, false);
    assert.equal(showTier3, false);
  });

  it('returns true for showTier2 when floors > 3 or commercial', () => {
    assert.equal(getRequiredTiers({ numFloors: 4, typology: 'Residential' }).showTier2, true);
    assert.equal(getRequiredTiers({ numFloors: 1, typology: 'Commercial' }).showTier2, true);
  });

  it('returns true for showTier3 when floors > 7, Steel, or Zone IV/V', () => {
    assert.equal(getRequiredTiers({ numFloors: 8 }).showTier3, true);
    assert.equal(getRequiredTiers({ structuralSystem: 'Steel' }).showTier3, true);
    assert.equal(getRequiredTiers({ seismicZone: 'Zone_IV' }).showTier3, true);
  });
});
