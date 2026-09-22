import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { estimates, buildingInputs, reports, projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { EstimateResult } from '@/lib/engine/types';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/auth';
import { BoundedCache } from '@/lib/cache/bounded-cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const pdfCache = new BoundedCache<Uint8Array>(50, 1000 * 60 * 30); // Max 50 items, 30-min TTL

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

  // Resolve estimate
  const [estimate] = await db.select().from(estimates).where(eq(estimates.id, id)).limit(1);
  if (!estimate) {
    return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
  }

  // Resolve associated project to enforce ownership (prevents IDOR)
  const [project] = await db.select().from(projects).where(eq(projects.id, estimate.projectId)).limit(1);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Ownership verification:
  // a) User session matching project.userId, OR admin role
  // b) Guest-owned project (project.userId is null) matching supplied guestToken (query or header)
  const session = await auth();
  const guestToken = req.nextUrl.searchParams.get('guestToken') || req.headers.get('x-guest-token');

  const isUserOwner = Boolean(session?.user?.id && project.userId && session.user.id === project.userId);
  const isAdmin = session?.user?.role === 'admin';
  const isGuestOwner = !project.userId && Boolean(project.guestToken && guestToken && project.guestToken === guestToken);

  if (!isUserOwner && !isAdmin && !isGuestOwner) {
    if (!session?.user?.id && !guestToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Cache lookup ONLY after ownership verification to prevent unauthorized cache hits
  const noCache = req.nextUrl.searchParams.has('t') || req.nextUrl.searchParams.has('nocache');
  const cachedBytes = !noCache ? pdfCache.get(id) : undefined;

  if (cachedBytes) {
    const filename = `OUTSYD-Estimate-${id.slice(0, 8)}.pdf`;
    return new NextResponse(Buffer.from(cachedBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': cachedBytes.byteLength.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Cache': 'HIT',
      },
    });
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
    if (input.computedBuaSqft)
      inputSummary['Built-up Area'] = `${input.computedBuaSqft.toLocaleString('en-IN')} sqft`;
  }

  try {
    const React = await import('react');
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const { OutsydReportDocument } = await import('@/lib/pdf/report-template');

    const pdfBuffer = await renderToBuffer(
      React.createElement(OutsydReportDocument, {
        result,
        inputSummary,
        rawInput: input ? {
          lengthFt: input.lengthFt,
          breadthFt: input.breadthFt,
          heightFt: input.heightFt,
          numFloors: input.numFloors,
        } : undefined,
      }) as React.ReactElement<import('@react-pdf/renderer').DocumentProps>
    );

    const bytes = new Uint8Array(
      Buffer.isBuffer(pdfBuffer)
        ? (pdfBuffer as Buffer)
        : Buffer.from(pdfBuffer as ArrayBuffer)
    );

    // Cache rendered PDF in bounded LRU cache
    pdfCache.set(id, bytes);

    try {
      await db.insert(reports).values({
        id: crypto.randomUUID(),
        estimateId: id,
        fileUrl: null,
        generatedAt: new Date(),
      });
    } catch (insertErr) {
      console.warn('[PDF] Failed to log report to DB:', insertErr);
    }

    const filename = `OUTSYD-Estimate-${id.slice(0, 8)}.pdf`;
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': bytes.byteLength.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Cache': 'MISS',
      },
    });
  } catch (err) {
    console.error('[PDF] Render error:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}