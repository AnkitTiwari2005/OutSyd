// app/api/estimate/route.ts — POST /api/estimate (public, rate-limited)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { FullInputSchema } from '@/lib/validation/input-schema';
import {
  classifyBuilding,
  runEstimationEngine,
  aggregateEstimate,
  lookupSeismicZone,
} from '@/lib/engine';
import { getActiveDatasetAndIndex } from '@/lib/db/active-rates';
import { db } from '@/lib/db';
import { projects, buildingInputs, estimates, coefficientDatasets } from '@/lib/db/schema';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const session    = await auth();
  const userId     = session?.user?.id;
  const ip         = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const identifier = userId ?? ip;

  try {
    const rl = await checkRateLimit(identifier, !!userId);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'TOO_MANY_REQUESTS', retryAfter: Math.ceil((rl.reset - Date.now()) / 1000), message: userId ? '30 estimates per hour allowed.' : '5 estimates per hour allowed for guests.' },
        { status: 429 },
      );
    }
  } catch {
    // Redis unavailable — degrade gracefully, allow request
    console.warn('Rate limit check failed — Redis unavailable');
  }

  // ── Input validation ───────────────────────────────────────────────────────
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }

  const parsed = FullInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const bi = parsed.data;

  // ── Auto-fill seismic zone from location if Not_sure ──────────────────────
  if (!bi.seismicZone || bi.seismicZone === 'Not_sure') {
    const detectedZone = lookupSeismicZone(bi.locationRegion);
    if (detectedZone) bi.seismicZone = detectedZone;
  }

  // ── Regional index & active dataset (DB with cached fallback) ─────────────
  const { dataset: ds, lookupRegionalIndex: activeLookupRegionalIndex } = await getActiveDatasetAndIndex();
  const { index: ri, matchedCity } = activeLookupRegionalIndex(bi.locationRegion);

  // ── H-6: Apply server-side local rate overrides with hard bounds (±50% max variance) ──
  let effectiveDs = ds;
  if (bi.localRateOverrides && bi.localRateOverrides.length > 0) {
    const overriddenRates = { ...ds.rates };
    for (const override of bi.localRateOverrides) {
      const base = ds.rates[override.materialItemCode];
      if (typeof base === 'number' && base > 0) {
        // Enforce hard bounds: rate override must remain within 0.50x to 1.50x of base rate
        const minBound = base * 0.5;
        const maxBound = base * 1.5;
        overriddenRates[override.materialItemCode] = Math.max(minBound, Math.min(maxBound, override.rate));
      }
    }
    effectiveDs = { ...ds, rates: overriddenRates };
  }

  // ── Run estimation engine (pure) ───────────────────────────────────────────
  const cls = classifyBuilding({
    numFloors       : bi.numFloors,
    typology        : bi.typology,
    structuralSystem: bi.structuralSystem ?? 'Not_sure',
    seismicZone     : bi.seismicZone      ?? 'Not_sure',
  });

  const lineItems = runEstimationEngine(bi, cls, effectiveDs, ri);
  const result    = aggregateEstimate(lineItems, bi, cls, effectiveDs, ri);

  // ── Persist to DB (PostgreSQL async) ──────────────────────────────────────
  try {
    const guestToken = userId ? null : randomUUID();
    const projectId  = randomUUID();
    const inputId    = randomUUID();
    const estimateId = randomUUID();

    // Ensure coefficient dataset exists (upsert on first call)
    await db.insert(coefficientDatasets).values({
      version    : ds.version,
      description: 'CPWD DSR 2024 validated dataset',
      publishedBy: 'OUTSYD',
      isActive   : true,
      ratesJson  : JSON.stringify(ds),
    }).onConflictDoNothing();

    await db.transaction(async (tx) => {
      await tx.insert(projects).values({
        id        : projectId,
        userId    : userId ?? null,
        guestToken: guestToken ?? undefined,
        name      : `${bi.typology} — ${bi.locationRegion}`,
      });

      await tx.insert(buildingInputs).values({
        id               : inputId,
        projectId,
        lengthFt         : bi.lengthFt,
        breadthFt        : bi.breadthFt,
        heightFt         : bi.heightFt,
        plotAreaSqft     : bi.plotAreaSqft,
        numFloors        : bi.numFloors,
        typology         : bi.typology,
        buildingUse      : bi.buildingUse,
        soilType         : bi.soilType,
        locationRegion   : bi.locationRegion,
        qualityTier      : bi.qualityTier,
        structuralSystem : bi.structuralSystem ?? 'Not_sure',
        foundationType   : bi.foundationType  ?? 'Not_sure',
        seismicZone      : bi.seismicZone     ?? 'Not_sure',
        numStaircases    : bi.numStaircases    ?? 1,
        parkingLevels    : bi.parkingLevels    ?? 0,
        numLifts         : bi.numLifts         ?? 0,
        unitsPerFloor    : bi.unitsPerFloor,
        facadeType       : bi.facadeType       ?? 'Not_sure',
        fireHvacScope    : bi.fireHvacScope    ?? 'Not_sure',
        classificationTier: cls.tier.toString(),
        buildingCategory : cls.category,
        computedBuaSqft  : result.derivedDimensions.totalBuaSqft,
      });

      await tx.insert(estimates).values({
        id                       : estimateId,
        projectId,
        buildingInputId          : inputId,
        coefficientDatasetVersion: ds.version,
        accuracyBand             : result.accuracyBand,
        classificationTier       : cls.tier.toString(),
        buildingCategory         : cls.category,
        classificationReasons    : JSON.stringify(cls.reasons),
        plinthAreaEstimate       : result.plinthAreaEstimate,
        cubicContentEstimate     : result.cubicContentEstimate ?? null,
        grandTotalMaterialCost   : result.grandTotalMaterialCost,
        grandTotalWithLabor      : result.grandTotalWithLabor,
        regionalIndexApplied     : ri,
        resultJson               : JSON.stringify(result),
      });
    });

    return NextResponse.json({
      estimateId,
      guestToken,
      projectId,
      ...result,
      regionalIndexNote: matchedCity ? `Regional index ${ri}× applied for ${matchedCity}` : null,
    }, { status: 200 });

  } catch (err) {
    console.error('DB persist error:', err);
    // Return result even if DB fails — estimation still succeeded
    return NextResponse.json({
      estimateId: null,
      guestToken: null,
      ...result,
      warning: 'Estimate computed but could not be saved. Copy your results now.',
    }, { status: 200 });
  }
}
