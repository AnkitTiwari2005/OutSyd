import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyBuilding } from '../lib/engine/classifier';
import {
  computeAccuracyBand,
  aggregateEstimate,
  checkTier2Complete,
  checkTier3Complete,
  checkHasNotSureFields,
  resolveAccuracyBandForInput,
} from '../lib/engine/cost-calculator';
import { DEFAULT_DATASET } from '../lib/engine/coefficients';
import { ACCURACY_BANDS } from '../lib/constants';
import type { FullInput, EstimateLineItem } from '../lib/engine/types';

const MOCK_ITEMS: EstimateLineItem[] = [
  {
    categoryCode: 'CAT_01',
    materialItemCode: 'MAT_FOUND_EXCAV',
    name: 'Excavation',
    recommendedGrade: 'Standard',
    quantity: 100,
    unit: 'cum',
    unitRate: 150,
    lineCost: 15000,
    isApproximate: false,
  },
];

const TEST_COMBINATIONS: Array<{
  name: string;
  input: FullInput;
  expectedBand: 'Preliminary_15_20' | 'Standard_10_15' | 'Advanced_5_10';
}> = [
  // 1: Tier 1 Residential - incomplete tier 2
  {
    name: '1. G+1 Residential (Tier 1) - incomplete tier 2',
    input: {
      lengthFt: 40, breadthFt: 30, heightFt: 22, plotAreaSqft: 2400, numFloors: 2,
      typology: 'Residential', buildingUse: 'Villa / Individual House',
      soilType: 'Normal', locationRegion: 'Bengaluru', qualityTier: 'Standard',
    },
    expectedBand: 'Preliminary_15_20',
  },
  // 2: Tier 1 Residential - complete tier 2 (remains Preliminary since Tier 1 doesn't unlock Standard)
  {
    name: '2. G+1 Residential (Tier 1) - complete tier 2',
    input: {
      lengthFt: 40, breadthFt: 30, heightFt: 22, plotAreaSqft: 2400, numFloors: 2,
      typology: 'Residential', buildingUse: 'Villa / Individual House',
      soilType: 'Normal', locationRegion: 'Bengaluru', qualityTier: 'Standard',
      structuralSystem: 'RCC_Frame', foundationType: 'Isolated', seismicZone: 'Zone_II',
    },
    expectedBand: 'Preliminary_15_20',
  },
  // 3: Tier 2 Commercial - incomplete tier 2
  {
    name: '3. G+1 Commercial (Tier 2) - incomplete tier 2',
    input: {
      lengthFt: 40, breadthFt: 30, heightFt: 22, plotAreaSqft: 2400, numFloors: 2,
      typology: 'Commercial', buildingUse: 'Office',
      soilType: 'Normal', locationRegion: 'Bengaluru', qualityTier: 'Standard',
    },
    expectedBand: 'Preliminary_15_20',
  },
  // 4: Tier 2 Commercial - complete tier 2 with "Not_sure"
  {
    name: '4. G+1 Commercial (Tier 2) - complete tier 2 with Not_sure',
    input: {
      lengthFt: 40, breadthFt: 30, heightFt: 22, plotAreaSqft: 2400, numFloors: 2,
      typology: 'Commercial', buildingUse: 'Office',
      soilType: 'Normal', locationRegion: 'Bengaluru', qualityTier: 'Standard',
      structuralSystem: 'Not_sure', foundationType: 'Isolated', seismicZone: 'Zone_II',
    },
    expectedBand: 'Preliminary_15_20',
  },
  // 5: Tier 2 Commercial - complete tier 2 without Not_sure
  {
    name: '5. G+1 Commercial (Tier 2) - complete tier 2 without Not_sure',
    input: {
      lengthFt: 40, breadthFt: 30, heightFt: 22, plotAreaSqft: 2400, numFloors: 2,
      typology: 'Commercial', buildingUse: 'Office',
      soilType: 'Normal', locationRegion: 'Bengaluru', qualityTier: 'Standard',
      structuralSystem: 'RCC_Frame', foundationType: 'Isolated', seismicZone: 'Zone_II',
    },
    expectedBand: 'Standard_10_15',
  },
  // 6: Tier 2 Mid-rise Residential G+4 - complete tier 2 without Not_sure
  {
    name: '6. G+4 Residential (Tier 2) - complete tier 2 without Not_sure',
    input: {
      lengthFt: 50, breadthFt: 40, heightFt: 50, plotAreaSqft: 4000, numFloors: 5,
      typology: 'Residential', buildingUse: 'Apartment',
      soilType: 'Normal', locationRegion: 'Hyderabad', qualityTier: 'Standard',
      structuralSystem: 'RCC_Frame', foundationType: 'Raft', seismicZone: 'Zone_II',
    },
    expectedBand: 'Standard_10_15',
  },
  // 7: Tier 2 Mid-rise Residential G+4 - with Not_sure
  {
    name: '7. G+4 Residential (Tier 2) - with Not_sure',
    input: {
      lengthFt: 50, breadthFt: 40, heightFt: 50, plotAreaSqft: 4000, numFloors: 5,
      typology: 'Residential', buildingUse: 'Apartment',
      soilType: 'Normal', locationRegion: 'Hyderabad', qualityTier: 'Standard',
      structuralSystem: 'RCC_Frame', foundationType: 'Not_sure', seismicZone: 'Zone_II',
    },
    expectedBand: 'Preliminary_15_20',
  },
  // 8: Tier 2 Institutional - complete tier 2
  {
    name: '8. G+2 Institutional (Tier 2) - complete tier 2',
    input: {
      lengthFt: 60, breadthFt: 40, heightFt: 35, plotAreaSqft: 5000, numFloors: 3,
      typology: 'Institutional', buildingUse: 'School',
      soilType: 'Normal', locationRegion: 'Delhi', qualityTier: 'Standard',
      structuralSystem: 'RCC_Frame', foundationType: 'Raft', seismicZone: 'Zone_II',
    },
    expectedBand: 'Standard_10_15',
  },
  // 9: Tier 2 Industrial - complete tier 2
  {
    name: '9. G+0 Industrial (Tier 2) - complete tier 2',
    input: {
      lengthFt: 100, breadthFt: 60, heightFt: 25, plotAreaSqft: 10000, numFloors: 1,
      typology: 'Industrial', buildingUse: 'Warehouse',
      soilType: 'Normal', locationRegion: 'Pune', qualityTier: 'Economy',
      structuralSystem: 'RCC_Frame', foundationType: 'Isolated', seismicZone: 'Zone_III',
    },
    expectedBand: 'Standard_10_15',
  },
  // 10: Tier 3 High-Rise G+8 - incomplete tier 2
  {
    name: '10. G+8 High Rise (Tier 3) - incomplete tier 2',
    input: {
      lengthFt: 80, breadthFt: 60, heightFt: 90, plotAreaSqft: 10000, numFloors: 9,
      typology: 'Residential', buildingUse: 'Apartment',
      soilType: 'Normal', locationRegion: 'Mumbai', qualityTier: 'Standard',
    },
    expectedBand: 'Preliminary_15_20',
  },
  // 11: Tier 3 Steel structure - complete tier 2, no drawing
  {
    name: '11. Steel structure (Tier 3) - complete tier 2, no drawing',
    input: {
      lengthFt: 100, breadthFt: 80, heightFt: 30, plotAreaSqft: 15000, numFloors: 1,
      typology: 'Industrial', buildingUse: 'Warehouse',
      soilType: 'Normal', locationRegion: 'Ludhiana', qualityTier: 'Economy',
      structuralSystem: 'Steel', foundationType: 'Isolated', seismicZone: 'Zone_III',
    },
    expectedBand: 'Standard_10_15',
  },
  // 12: Tier 3 High Seismic Zone IV - complete tier 2, no drawing
  {
    name: '12. High Seismic Zone IV (Tier 3) - complete tier 2, no drawing',
    input: {
      lengthFt: 50, breadthFt: 40, heightFt: 30, plotAreaSqft: 3000, numFloors: 3,
      typology: 'Residential', buildingUse: 'Apartment',
      soilType: 'Normal', locationRegion: 'Delhi', qualityTier: 'Standard',
      structuralSystem: 'RCC_Frame', foundationType: 'Raft', seismicZone: 'Zone_IV',
    },
    expectedBand: 'Standard_10_15',
  },
  // 13: Tier 3 High-Rise G+9 with Tier 3 fields complete, no drawing
  {
    name: '13. G+9 Commercial (Tier 3) - tier 3 complete, no drawing',
    input: {
      lengthFt: 100, breadthFt: 80, heightFt: 120, plotAreaSqft: 15000, numFloors: 10,
      typology: 'Commercial', buildingUse: 'Office',
      soilType: 'Normal', locationRegion: 'Mumbai', qualityTier: 'Standard',
      structuralSystem: 'RCC_Frame', foundationType: 'Raft', seismicZone: 'Zone_III',
      windLoadZone: 'Moderate', facadeType: 'Curtain_Wall', fireHvacScope: 'Full_Central',
    },
    expectedBand: 'Standard_10_15',
  },
  // 14: Tier 3 with structural drawing URL
  {
    name: '14. Tier 3 with structural drawing URL provided',
    input: {
      lengthFt: 100, breadthFt: 80, heightFt: 120, plotAreaSqft: 15000, numFloors: 10,
      typology: 'Commercial', buildingUse: 'Office',
      soilType: 'Normal', locationRegion: 'Mumbai', qualityTier: 'Standard',
      structuralSystem: 'RCC_Frame', foundationType: 'Raft', seismicZone: 'Zone_III',
      structuralDrawingUrl: 'https://storage.example.com/drawings/dwg-101.pdf',
    },
    expectedBand: 'Standard_10_15',
  },
];

describe('Accuracy Band Shell Logic vs Engine Agreement (U-4 & N-3)', () => {
  for (const { name, input, expectedBand } of TEST_COMBINATIONS) {
    it(`guarantees shell and engine agreement for ${name}`, () => {
      const cls = classifyBuilding({
        numFloors: input.numFloors,
        typology: input.typology ?? 'Residential',
        structuralSystem: input.structuralSystem,
        seismicZone: input.seismicZone,
      });

      // 1. Shell logic
      const tier2Complete = checkTier2Complete(input);
      const tier3Complete = checkTier3Complete(input);
      const hasNotSure = checkHasNotSureFields(input);
      const shellBand = computeAccuracyBand(
        cls.tier,
        tier2Complete,
        tier3Complete,
        hasNotSure,
        Boolean(input.structuralDrawingUrl),
      );

      // 2. Helper resolveAccuracyBandForInput
      const resolvedHelperBand = resolveAccuracyBandForInput(input);
      assert.equal(shellBand, resolvedHelperBand, 'Helper must match direct computeAccuracyBand');

      // 3. Engine aggregateEstimate
      const result = aggregateEstimate(MOCK_ITEMS, input, cls, DEFAULT_DATASET, 1.0);

      // 4. Assert shell and engine output match exactly
      assert.equal(shellBand, result.accuracyBand, `Shell badge (${shellBand}) must equal result.accuracyBand (${result.accuracyBand})`);

      // 5. Assert expected band
      assert.equal(result.accuracyBand, expectedBand, `Expected ${expectedBand} but got ${result.accuracyBand}`);

      // 6. Verify badge label corresponds to valid accuracy band metadata
      const meta = ACCURACY_BANDS[result.accuracyBand];
      assert.ok(meta.band.length > 0);
      assert.ok(meta.fullDisplay.length > 0);
    });
  }
});
