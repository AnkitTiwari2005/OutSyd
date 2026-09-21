import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWallAnalysis } from '../lib/engine';

test('Wall Analysis: Long Wall - Short Wall vs Center Line Method', async (t) => {
  await t.test('exact geometry and centerline perimeter match', () => {
    // 40ft x 30ft, 2 floors, 22ft total height (11ft/floor), 9" (0.75ft) walls
    const res = calculateWallAnalysis(
      {
        lengthFt: 40,
        breadthFt: 30,
        heightFt: 22,
        numFloors: 2,
        typology: 'Residential',
      },
      300000, // ₹3,00,000 masonry material cost
    );

    // Center-to-center:
    // L_cc = 40 - 0.75 = 39.25 ft
    // B_cc = 30 - 0.75 = 29.25 ft
    assert.equal(res.centerToCenter.lengthCcFt, 39.25);
    assert.equal(res.centerToCenter.breadthCcFt, 29.25);

    // Centerline perimeter per floor = 2 * (39.25 + 29.25) = 137 ft
    assert.equal(res.centerToCenter.totalCenterLinePerFloorFt, 137);
    assert.equal(res.centerToCenter.totalCenterLineAllFloorsFt, 274);

    // Long Wall - Short Wall Method:
    // Long wall (out-to-out) = 39.25 + 0.75 = 40 ft
    // Short wall (in-to-in) = 29.25 - 0.75 = 28.5 ft
    assert.equal(res.longShortWallMethod.longWallLengthFt, 40);
    assert.equal(res.longShortWallMethod.shortWallLengthFt, 28.5);

    // Effective perimeter = 2*(40) + 2*(28.5) = 80 + 57 = 137 ft
    assert.equal(res.longShortWallMethod.effectivePerimeterPerFloorFt, 137);
    assert.equal(res.longShortWallMethod.totalRunningLengthFt, 274);

    // Effective perimeters must be identical
    assert.equal(
      res.longShortWallMethod.effectivePerimeterPerFloorFt,
      res.centerLineMethod.effectivePerimeterPerFloorFt,
    );
  });

  await t.test('per-wall cost calculation and reconciliation', () => {
    const masonryCost = 274000; // ₹1,000 per RFT
    const res = calculateWallAnalysis(
      {
        lengthFt: 40,
        breadthFt: 30,
        heightFt: 20,
        numFloors: 2,
        typology: 'Residential',
      },
      masonryCost,
    );

    // RFT rate: 274000 / 274 RFT = 1000/RFT
    assert.equal(res.rates.materialCostPerRft, 1000);
    // Turnkey rate: 1000 * 1.30 = 1300/RFT
    assert.equal(res.rates.turnkeyCostPerRft, 1300);

    // Long wall cost per wall: 40ft * 1000 = 40000
    assert.equal(res.longShortWallMethod.costPerLongWallMat, 40000);
    assert.equal(res.longShortWallMethod.costPerLongWallTurnkey, 52000);

    // Short wall cost per wall: 28.5ft * 1000 = 28500
    assert.equal(res.longShortWallMethod.costPerShortWallMat, 28500);
    assert.equal(res.longShortWallMethod.costPerShortWallTurnkey, 37050);

    // Reconciliation:
    // (2 * 40000 + 2 * 28500) * 2 floors = (80000 + 57000) * 2 = 137000 * 2 = 274000
    assert.equal(res.longShortWallMethod.totalCostMat, masonryCost);
    assert.equal(res.centerLineMethod.totalCostMat, masonryCost);
    assert.equal(res.reconciliation.methodsMatch, true);
    assert.equal(res.reconciliation.difference, 0);
  });

  await t.test('best approach recommendation gives Center Line Method with engineering rationale', () => {
    const res = calculateWallAnalysis(
      {
        lengthFt: 50,
        breadthFt: 40,
        heightFt: 30,
        numFloors: 3,
        typology: 'Residential',
      },
      450000,
    );

    assert.equal(res.bestApproachRecommendation.recommendedMethod, 'Center Line Method');
    assert.ok(res.bestApproachRecommendation.rationaleDetails.length >= 3);
    assert.ok(res.bestApproachRecommendation.whenToUseAlternative.includes('load-bearing'));
  });
});
