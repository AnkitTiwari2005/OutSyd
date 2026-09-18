// app/api/estimate/[id]/report/route.ts — GET PDF download
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { estimates, buildingInputs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { EstimateResult } from '@/lib/engine/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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
    if (input.computedBuaSqft)
      inputSummary['Built-up Area'] = `${input.computedBuaSqft.toLocaleString('en-IN')} sqft`;
  }

  try {
    const React = await import('react');
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const { OutsydReportDocument } = await import('@/lib/pdf/report-template');

    const pdfBuffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(OutsydReportDocument as any, { result, inputSummary }) as any
    );

    const bytes = new Uint8Array(
      Buffer.isBuffer(pdfBuffer)
        ? (pdfBuffer as Buffer)
        : Buffer.from(pdfBuffer as ArrayBuffer)
    );

    const filename = `OUTSYD-Estimate-${id.slice(0, 8)}.pdf`;
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': bytes.byteLength.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[PDF] Render error:', err);
    return NextResponse.json({ error: 'PDF generation failed', detail: String(err) }, { status: 500 });
  }
}