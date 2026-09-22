import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BoundedCache } from '../lib/cache/bounded-cache';
import { FullInputSchema } from '../lib/validation/input-schema';

describe('Security & Reliability Fixes', () => {
  describe('BoundedCache (LRU & TTL Eviction)', () => {
    it('evicts least-recently-used item when max capacity is reached', () => {
      const cache = new BoundedCache<string>(3, 60000);
      cache.set('a', 'val_a');
      cache.set('b', 'val_b');
      cache.set('c', 'val_c');

      // Access 'a' so 'b' becomes the oldest
      assert.equal(cache.get('a'), 'val_a');

      // Insert 'd' -> 'b' should be evicted
      cache.set('d', 'val_d');
      assert.equal(cache.has('b'), false);
      assert.equal(cache.get('a'), 'val_a');
      assert.equal(cache.get('c'), 'val_c');
      assert.equal(cache.get('d'), 'val_d');
      assert.equal(cache.size(), 3);
    });

    it('expires and removes entries past TTL', async () => {
      // 20ms TTL
      const cache = new BoundedCache<string>(5, 20);
      cache.set('temp', 'temporary_value');
      assert.equal(cache.get('temp'), 'temporary_value');

      await new Promise((resolve) => setTimeout(resolve, 35));
      assert.equal(cache.get('temp'), undefined);
      assert.equal(cache.has('temp'), false);
    });
  });

  describe('Validation Schema Constraints', () => {
    const validBaseInput = {
      lengthFt: 40,
      breadthFt: 30,
      heightFt: 11,
      plotAreaSqft: 2000,
      numFloors: 1,
      typology: 'Residential',
      buildingUse: 'Independent House / Villa',
      qualityTier: 'Standard',
      locationRegion: 'Bangalore',
      soilType: 'Normal',
    };

    it('accepts localRateOverrides up to 50 items', () => {
      const validOverrides = Array.from({ length: 50 }, (_, i) => ({
        materialItemCode: `CAT_ITEM_${i}`,
        rate: 100 + i,
      }));

      const parsed = FullInputSchema.safeParse({
        ...validBaseInput,
        localRateOverrides: validOverrides,
      });
      assert.equal(parsed.success, true);
    });

    it('rejects localRateOverrides exceeding 50 items', () => {
      const excessiveOverrides = Array.from({ length: 51 }, (_, i) => ({
        materialItemCode: `CAT_ITEM_${i}`,
        rate: 100 + i,
      }));

      const parsed = FullInputSchema.safeParse({
        ...validBaseInput,
        localRateOverrides: excessiveOverrides,
      });
      assert.equal(parsed.success, false);
      if (!parsed.success) {
        assert.match(parsed.error.issues[0].message, /50/);
      }
    });
  });
});
