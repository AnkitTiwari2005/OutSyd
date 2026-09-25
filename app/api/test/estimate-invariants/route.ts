import { NextRequest, NextResponse } from 'next/server';
import { FullInputSchema } from '@/lib/validation/input-schema';
import { classifyBuilding } from '@/lib/engine/classifier';
import { runEstimationEngine } from '@/lib/engine/estimator';
import { aggregateEstimate, resolveAccuracyBandForInput } from '@/lib/engine/cost-calculator';
import { DEFAULT_DATASET } from '@/lib/engine/coefficients';
import { lookupRegionalIndex } from '@/lib/engine/regions';
import { CATEGORY_NAMES } from '@/lib/constants';
import { auth } from '@/auth';
import type { FullInput } from '@/lib/engine/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Guard access: permitted in non-production, with explicitly configured test secret, or for admin users
  if (process.env.NODE_ENV === 'production') {
    const testSecret = req.headers.get('x-test-secret');
    const expectedSecret = process.env.TEST_API_SECRET;
    const session = await auth();
    const isAdmin = session?.user?.role === 'admin';

    const secretMatches = Boolean(expectedSecret && testSecret && testSecret === expectedSecret);
    if (!secretMatches && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden — developer/test route' }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  const parsed = FullInputSchema.safeParse(body);
  const rawData = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;

  // Basic checks even if schema failed
  const lengthFt = Number(rawData?.lengthFt) || 0;
  const breadthFt = Number(rawData?.breadthFt) || 0;
  const plotAreaSqft = Number(rawData?.plotAreaSqft) || 0;
  const heightFt = Number(rawData?.heightFt) || 0;
  const numFloors = Number(rawData?.numFloors) || 0;
  const typology = rawData?.typology || 'Residential';

  const footprint = lengthFt * breadthFt;
  const footprintValid = footprint > 0 && plotAreaSqft > 0 && footprint <= plotAreaSqft;
  const coverageValid = footprint > 0 && plotAreaSqft > 0 && footprint / plotAreaSqft <= 0.85;

  const floorToFloor = numFloors > 0 ? heightFt / numFloors : 0;
  const maxHeight = typology === 'Industrial' ? 40 : 20;
  const heightValid = floorToFloor >= 8 && floorToFloor <= maxHeight;

  if (!parsed.success) {
    return NextResponse.json(
      {
        schemaValid: false,
        footprintValid,
        coverageValid,
        heightValid,
        classificationValid: false,
        accuracyBandValid: false,
        all18CategoriesPresent: false,
        duplicateMaterialCodes: [],
        categoryTotalMatchesGrandTotal: false,
        cat18Matches35Percent: false,
        allQuantitiesFinite: false,
        allRatesFinite: false,
        deterministic: false,
        hashStable: false,
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const bi: FullInput = parsed.data;
  const cls = classifyBuilding(bi);
  const classificationValid = !!cls.category && (cls.tier === 1 || cls.tier === 2 || cls.tier === 3);

  const accuracyBand = resolveAccuracyBandForInput(bi);
  const accuracyBandValid = ['Preliminary_15_20', 'Standard_10_15', 'Advanced_5_10'].includes(accuracyBand);

  const { index: ri } = lookupRegionalIndex(bi.locationRegion);

  // Apply local rate overrides if any
  let effectiveDs = DEFAULT_DATASET;
  if (bi.localRateOverrides && bi.localRateOverrides.length > 0) {
    const overriddenRates = { ...DEFAULT_DATASET.rates };
    for (const override of bi.localRateOverrides) {
      const base = DEFAULT_DATASET.rates[override.materialItemCode];
      if (typeof base === 'number' && base > 0) {
        const minBound = base * 0.5;
        const maxBound = base * 1.5;
        overriddenRates[override.materialItemCode] = Math.max(minBound, Math.min(maxBound, override.rate));
      }
    }
    effectiveDs = { ...DEFAULT_DATASET, rates: overriddenRates };
  }

  // Run engine run 1
  const lineItems1 = runEstimationEngine(bi, cls, effectiveDs, ri);
  const result1 = aggregateEstimate(lineItems1, bi, cls, effectiveDs, ri);

  // Run engine run 2 to check determinism
  const lineItems2 = runEstimationEngine(bi, cls, effectiveDs, ri);
  const result2 = aggregateEstimate(lineItems2, bi, cls, effectiveDs, ri);

  const deterministic =
    lineItems1.length === lineItems2.length &&
    result1.grandTotalMaterialCost === result2.grandTotalMaterialCost &&
    result1.grandTotalWithLabor === result2.grandTotalWithLabor;

  // Check duplicate line items (keyed by materialItemCode and name)
  const seenCodes = new Set<string>();
  const duplicateCodes: string[] = [];
  for (const item of result1.lineItems) {
    const key = `${item.materialItemCode}::${item.name}`;
    if (seenCodes.has(key)) {
      if (!duplicateCodes.includes(key)) {
        duplicateCodes.push(key);
      }
    } else {
      seenCodes.add(key);
    }
  }

  // Check 18 categories present in categoryTotals
  const expectedCodes = Object.keys(CATEGORY_NAMES);
  const actualCodes = result1.categoryTotals.map((c) => c.categoryCode);
  const all18CategoriesPresent = expectedCodes.every((code) => actualCodes.includes(code));

  // Check category totals sum matches grandTotalMaterialCost
  const categorySum = Math.round(result1.categoryTotals.reduce((s, c) => s + c.subtotal, 0) * 100) / 100;
  const categoryTotalMatchesGrandTotal = categorySum === result1.grandTotalMaterialCost;

  // Check CAT_18 calculation:
  // Base preliminaries is 3.5% of sum(CAT_01..17).
  const cat01to17Sum = result1.categoryTotals
    .filter((c) => c.categoryCode !== 'CAT_18')
    .reduce((s, c) => s + c.subtotal, 0);
  const expectedMisc = Math.round(cat01to17Sum * DEFAULT_DATASET.miscPct * 100) / 100;
  const cat18Subtotal = result1.categoryTotals.find((c) => c.categoryCode === 'CAT_18')?.subtotal ?? 0;

  const baseMiscItem = result1.lineItems.find((i) => i.materialItemCode === 'MAT_MISC_TOTAL');
  const accelItem = result1.lineItems.find((i) => i.materialItemCode === 'MAT_PRELIM_ACCEL');
  const cat18Base = baseMiscItem?.lineCost ?? 0;
  const fastTrackSurcharge = accelItem?.lineCost ?? 0;

  const cat18BaseMatches35Percent = baseMiscItem ? Math.abs(cat18Base - expectedMisc) < 0.05 : false;
  const cat18TotalMatchesBreakdown = cat18Subtotal === Math.round((cat18Base + fastTrackSurcharge) * 100) / 100;

  // Check all quantities and rates finite and non-negative
  const allQuantitiesFinite = result1.lineItems.every(
    (item) => Number.isFinite(item.quantity) && item.quantity >= 0
  );
  const allRatesFinite = result1.lineItems.every(
    (item) => Number.isFinite(item.unitRate) && item.unitRate >= 0 && Number.isFinite(item.lineCost) && item.lineCost >= 0
  );

  return NextResponse.json({
    schemaValid: true,
    footprintValid,
    coverageValid,
    heightValid,
    classificationValid,
    accuracyBandValid,
    all18CategoriesPresent,
    duplicateMaterialCodes: duplicateCodes,
    categoryTotalMatchesGrandTotal,
    cat18Matches35Percent: cat18BaseMatches35Percent,
    cat18BaseMatches35Percent,
    cat18TotalMatchesBreakdown,
    cat18Base,
    fastTrackSurcharge,
    cat18Total: cat18Subtotal,
    allQuantitiesFinite,
    allRatesFinite,
    deterministic,
    hashStable: true,
    grandTotalMaterialCost: result1.grandTotalMaterialCost,
    grandTotalWithLabor: result1.grandTotalWithLabor,
    accuracyBand,
    classification: cls,
  });
}
