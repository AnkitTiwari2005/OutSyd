// lib/db/active-rates.ts — Cached loader for active DB coefficients and regional rates
import { db } from '@/lib/db';
import { coefficientDatasets, regionalRateIndex } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import {
  DEFAULT_DATASET,
  REGIONAL_RATE_INDEX,
  lookupRegionalIndex as staticLookupRegionalIndex,
} from '@/lib/engine/coefficients';
import type { CoefficientDataset } from '@/lib/engine/types';

interface CachedRateData {
  dataset: CoefficientDataset;
  regionalIndex: Record<string, number>;
  timestamp: number;
}

let cache: CachedRateData | null = null;
const CACHE_TTL_MS = 30_000; // 30 seconds cache TTL

export function invalidateRateCache(): void {
  cache = null;
}

export async function getActiveDatasetAndIndex(): Promise<{
  dataset: CoefficientDataset;
  lookupRegionalIndex: (location: string) => { index: number; matchedCity: string | null };
}> {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    const cachedIndex = cache.regionalIndex;
    return {
      dataset: cache.dataset,
      lookupRegionalIndex: (loc: string) => queryRegionalIndex(loc, cachedIndex),
    };
  }

  try {
    // 1. Fetch active dataset from DB
    const [activeRow] = await db
      .select()
      .from(coefficientDatasets)
      .where(eq(coefficientDatasets.isActive, true))
      .orderBy(desc(coefficientDatasets.publishedAt))
      .limit(1);

    let dataset = DEFAULT_DATASET;
    if (activeRow?.ratesJson) {
      try {
        const parsed = JSON.parse(activeRow.ratesJson);
        if (parsed.rates) {
          dataset = { ...DEFAULT_DATASET, ...parsed, version: activeRow.version };
        } else if (typeof parsed === 'object') {
          dataset = {
            ...DEFAULT_DATASET,
            rates: { ...DEFAULT_DATASET.rates, ...parsed },
            version: activeRow.version,
          };
        }
      } catch (err) {
        console.warn('[Rates] Error parsing active dataset from DB, using DEFAULT_DATASET:', err);
      }
    }

    // 2. Fetch regional rate index rows from DB
    const dbRates = await db.select().from(regionalRateIndex);
    const mergedRegionalIndex: Record<string, number> = { ...REGIONAL_RATE_INDEX };

    if (dbRates.length > 0) {
      for (const row of dbRates) {
        if (row.regionName) {
          mergedRegionalIndex[row.regionName.toLowerCase().trim()] = row.indexValue;
        }
      }
    }

    cache = {
      dataset,
      regionalIndex: mergedRegionalIndex,
      timestamp: now,
    };

    const finalIndex = mergedRegionalIndex;
    return {
      dataset,
      lookupRegionalIndex: (loc: string) => queryRegionalIndex(loc, finalIndex),
    };
  } catch (err) {
    console.warn('[Rates] Failed to load active rates from DB, falling back to static constants:', err);
    return {
      dataset: DEFAULT_DATASET,
      lookupRegionalIndex: staticLookupRegionalIndex,
    };
  }
}

function queryRegionalIndex(
  location: string,
  indexMap: Record<string, number>
): { index: number; matchedCity: string | null } {
  const loc = location.toLowerCase().trim();
  if (!loc) return { index: indexMap.default ?? 1.0, matchedCity: null };

  // 1. Exact match
  if (loc in indexMap && loc !== 'default') {
    return { index: indexMap[loc], matchedCity: loc };
  }

  // Minimum length check
  if (loc.length < 3) {
    return { index: indexMap.default ?? 1.0, matchedCity: null };
  }

  // 2. Prefix match
  let bestPrefix: { key: string; index: number } | null = null;
  for (const [city, index] of Object.entries(indexMap)) {
    if (city === 'default') continue;
    if (city.startsWith(loc)) {
      if (!bestPrefix || city.length > bestPrefix.key.length) {
        bestPrefix = { key: city, index };
      }
    }
  }
  if (bestPrefix) return { index: bestPrefix.index, matchedCity: bestPrefix.key };

  // 3. Substring match
  let bestSubstring: { key: string; index: number } | null = null;
  for (const [city, index] of Object.entries(indexMap)) {
    if (city === 'default') continue;
    if (loc.includes(city)) {
      if (!bestSubstring || city.length > bestSubstring.key.length) {
        bestSubstring = { key: city, index };
      }
    }
  }
  if (bestSubstring) return { index: bestSubstring.index, matchedCity: bestSubstring.key };

  return { index: indexMap.default ?? 1.0, matchedCity: null };
}
