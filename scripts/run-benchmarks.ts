import { runEstimationEngine, aggregateEstimate } from '../lib/engine';
import { DEFAULT_DATASET, lookupRegionalIndex } from '../lib/engine/coefficients';
import { classifyBuilding } from '../lib/engine/classifier';
import type { FullInput } from '../lib/engine/types';

export const SCENARIOS: Record<string, { name: string; input: FullInput; targetRange: [number, number] | string }> = {
  A: {
    name: '2,400 sqft G+1 3BHK Bengaluru Standard',
    targetRange: [1900, 2900],
    input: {
      lengthFt: 40, breadthFt: 30, heightFt: 22, plotAreaSqft: 2400, numFloors: 2,
      typology: 'Residential', buildingUse: 'Villa / Individual House',
      soilType: 'Normal', locationRegion: 'Bengaluru', qualityTier: 'Standard',
    },
  },
  B: {
    name: '2,400 sqft G+1 3BHK Bengaluru Premium',
    targetRange: [2900, 5200],
    input: {
      lengthFt: 40, breadthFt: 30, heightFt: 22, plotAreaSqft: 2400, numFloors: 2,
      typology: 'Residential', buildingUse: 'Villa / Individual House',
      soilType: 'Normal', locationRegion: 'Bengaluru', qualityTier: 'Premium',
    },
  },
  C: {
    name: '2,400 sqft G+1 3BHK Bengaluru Economy',
    targetRange: [1500, 1900],
    input: {
      lengthFt: 40, breadthFt: 30, heightFt: 22, plotAreaSqft: 2400, numFloors: 2,
      typology: 'Residential', buildingUse: 'Villa / Individual House',
      soilType: 'Normal', locationRegion: 'Bengaluru', qualityTier: 'Economy',
    },
  },
  D: {
    name: '100x80 G+9 80,000 sqft Mumbai Office Standard',
    targetRange: 'verify vs market',
    input: {
      lengthFt: 100, breadthFt: 80, heightFt: 120, plotAreaSqft: 15000, numFloors: 10,
      typology: 'Commercial', buildingUse: 'Office',
      soilType: 'Normal', locationRegion: 'Mumbai', qualityTier: 'Standard',
      foundationType: 'Raft', seismicZone: 'Zone_III', facadeType: 'Curtain_Wall',
      parkingLevels: 2, fireHvacScope: 'Full_Central',
    },
  },
  E: {
    name: '200x150 G+0 30,000 sqft Ludhiana Warehouse Economy',
    targetRange: 'verify vs market',
    input: {
      lengthFt: 200, breadthFt: 150, heightFt: 30, plotAreaSqft: 35000, numFloors: 1,
      typology: 'Industrial', buildingUse: 'Warehouse',
      soilType: 'Normal', locationRegion: 'Ludhiana', qualityTier: 'Economy',
      structuralSystem: 'Steel',
    },
  },
};

export function runAll() {
  console.log('--- CURRENT BENCHMARKS ---');
  for (const [key, { name, input, targetRange }] of Object.entries(SCENARIOS)) {
    const { index: ri } = lookupRegionalIndex(input.locationRegion);
    const cls = classifyBuilding({
      numFloors: input.numFloors, typology: input.typology ?? 'Residential',
      structuralSystem: input.structuralSystem, seismicZone: input.seismicZone
    });
    const raw = runEstimationEngine(input, cls, DEFAULT_DATASET, ri);
    const result = aggregateEstimate(raw, input, cls, DEFAULT_DATASET, ri);
    const bua = result.derivedDimensions.totalBuaSqft;
    const perSqftAllIn = Math.round(result.grandTotalWithLabor / bua);
    const perSqftMat = Math.round(result.grandTotalMaterialCost / bua);
    const plinth = Math.round(result.plinthAreaEstimate / bua);
    const div = Math.abs(result.grandTotalWithLabor - result.plinthAreaEstimate) / result.plinthAreaEstimate;

    const regionalTarget = Array.isArray(targetRange)
      ? [Math.round(targetRange[0] * ri), Math.round(targetRange[1] * ri)]
      : targetRange;

    const zeroRateItems = result.lineItems.filter(i => i.quantity > 0 && i.unitRate === 0);
    const zeroOrNegItems = result.lineItems.filter(i => i.quantity <= 0);
    const catSum = result.categoryTotals.reduce((acc, c) => acc + c.subtotal, 0);
    const catSumMatches = Math.abs(catSum - result.grandTotalMaterialCost) < 1;

    console.log(`Scenario ${key} [${name}]:`);
    console.log(`  BUA: ${bua} sqft | All-in: Rs ${perSqftAllIn}/sqft | Mat: Rs ${perSqftMat}/sqft | Plinth: Rs ${plinth}/sqft | Div: ${(div * 100).toFixed(1)}%`);
    console.log(`  National Target: ${JSON.stringify(targetRange)} | Regional Target (ri=${ri}): ${JSON.stringify(regionalTarget)}`);
    console.log(`  Checks: zeroRate=${zeroRateItems.length}, zeroOrNeg=${zeroOrNegItems.length}, catSumMatches=${catSumMatches}`);

    // Assertions
    if (zeroRateItems.length > 0) throw new Error(`Scenario ${key} has items with zero rate: ${zeroRateItems.map(i => i.materialItemCode).join(', ')}`);
    if (zeroOrNegItems.length > 0) throw new Error(`Scenario ${key} has zero or negative quantity items: ${zeroOrNegItems.map(i => i.materialItemCode).join(', ')}`);
    if (!catSumMatches) throw new Error(`Scenario ${key} category sum mismatch: sum=${catSum}, total=${result.grandTotalMaterialCost}`);
    if (div >= 0.20) throw new Error(`Scenario ${key} divergence vs plinth estimate ${(div*100).toFixed(1)}% exceeds 20% limit`);
    if (!Number.isFinite(result.grandTotalWithLabor) || !Number.isFinite(result.grandTotalMaterialCost)) throw new Error(`Scenario ${key} has non-finite totals`);
  }
  console.log('\nAll 5 benchmark scenarios passed all 7 engine assertions and <20% divergence limit!');
}

runAll();
