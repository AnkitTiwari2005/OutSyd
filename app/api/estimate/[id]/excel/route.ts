import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { estimates, buildingInputs, reports } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { EstimateResult } from '@/lib/engine/types';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const excelCache = new Map<string, Uint8Array>();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  try {
    const rl = await checkRateLimit(`export:${ip}`, false);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'TOO_MANY_REQUESTS', retryAfter: Math.ceil((rl.reset - Date.now()) / 1000) },
        { status: 429 },
      );
    }
  } catch (err) {
    console.warn('[RateLimit] Warning on export route:', err);
  }

  const { id } = await params;

  if (excelCache.has(id)) {
    const cachedBytes = excelCache.get(id)!;
    const filename = `OUTSYD-Estimate-${id.slice(0, 8)}.xlsx`;
    return new NextResponse(Buffer.from(cachedBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': cachedBytes.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400, immutable',
        'X-Cache': 'HIT',
      },
    });
  }

  const [estimate] = await db.select().from(estimates).where(eq(estimates.id, id)).limit(1);
  if (!estimate) {
    return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
  }

  const result = (typeof estimate.resultJson === 'string'
    ? JSON.parse(estimate.resultJson)
    : estimate.resultJson) as unknown as EstimateResult;

  const [input] = await db.select().from(buildingInputs)
    .where(eq(buildingInputs.id, estimate.buildingInputId)).limit(1);

  const inputSummary: Record<string, string> = {};
  if (input) {
    inputSummary['Dimensions']   = `${input.lengthFt}ft × ${input.breadthFt}ft × ${input.heightFt}ft`;
    inputSummary['Floors']       = `${input.numFloors}`;
    inputSummary['Typology']     = `${input.typology} — ${input.buildingUse}`;
    inputSummary['Soil Type']    = input.soilType;
    inputSummary['Location']     = input.locationRegion;
    inputSummary['Quality Tier'] = input.qualityTier;
    if (input.structuralSystem && input.structuralSystem !== 'Not_sure')
      inputSummary['Structural System'] = input.structuralSystem.replace(/_/g, ' ');
    if (input.seismicZone && input.seismicZone !== 'Not_sure')
      inputSummary['Seismic Zone'] = input.seismicZone.replace(/_/g, ' ');
    if (input.foundationType && input.foundationType !== 'Not_sure')
      inputSummary['Foundation Type'] = input.foundationType.replace(/_/g, ' ');
    if (input.computedBuaSqft)
      inputSummary['Built-up Area'] = `${input.computedBuaSqft.toLocaleString('en-IN')} sqft`;
  }

  try {
    const { generateEstimateExcel } = await import('@/lib/excel/report-template');
    const buffer = await generateEstimateExcel(
      result,
      inputSummary,
      input?.numFloors ?? 1,
      input?.typology ?? 'Residential',
    );

    const bytes = new Uint8Array(buffer);
    // Cache rendered Excel by estimate ID (H-9)
    excelCache.set(id, bytes);

    try {
      await db.insert(reports).values({
        id: crypto.randomUUID(),
        estimateId: id,
        fileUrl: null,
        generatedAt: new Date(),
      });
    } catch (insertErr) {
      console.warn('[Excel] Failed to log report to DB:', insertErr);
    }

    const filename = `OUTSYD-Estimate-${id.slice(0, 8)}.xlsx`;
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': bytes.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400, immutable',
        'X-Cache': 'MISS',
      },
    });
  } catch (err) {
    console.error('[Excel] Generation error:', err);
    return NextResponse.json({ error: 'Excel generation failed', detail: String(err) }, { status: 500 });
  }
}