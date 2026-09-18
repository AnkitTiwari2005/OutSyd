// app/api/admin/coefficients/route.ts — Coefficient Datasets Management (admin only)
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { coefficientDatasets } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { invalidateRateCache } from '@/lib/db/active-rates';

const PublishSchema = z.object({
  version: z.string().min(3).max(64),
  description: z.string().max(255).optional(),
  ratesJson: z.string().min(10),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const datasets = await db
    .select()
    .from(coefficientDatasets)
    .orderBy(desc(coefficientDatasets.publishedAt))
    .limit(20);

  return NextResponse.json({ datasets });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = PublishSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid payload' }, { status: 400 });
    }

    // Verify ratesJson is valid JSON
    try {
      JSON.parse(parsed.data.ratesJson);
    } catch {
      return NextResponse.json({ error: 'ratesJson must be valid JSON' }, { status: 400 });
    }

    // Deactivate currently active datasets (BR-6 immutable versioning)
    await db
      .update(coefficientDatasets)
      .set({ isActive: false })
      .where(eq(coefficientDatasets.isActive, true));

    // Insert new immutable dataset
    await db.insert(coefficientDatasets).values({
      version: parsed.data.version.trim(),
      description: parsed.data.description?.trim() ?? 'Schedule of rates revision',
      publishedBy: session.user.email ?? session.user.id ?? 'admin',
      isActive: true,
      ratesJson: parsed.data.ratesJson,
    });

    invalidateRateCache();

    return NextResponse.json({ success: true, version: parsed.data.version });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
