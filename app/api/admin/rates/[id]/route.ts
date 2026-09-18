// app/api/admin/rates/[id]/route.ts — PATCH a single regional rate row
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { regionalRateIndex } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const PatchSchema = z.object({
  indexValue: z.number().min(0.5).max(3),
  notes     : z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { id } = await params;
  const body   = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await db.update(regionalRateIndex)
    .set({ indexValue: parsed.data.indexValue, notes: parsed.data.notes ?? null, updatedBy: session.user.email ?? 'admin' })
    .where(eq(regionalRateIndex.id, id));

  return NextResponse.json({ success: true });
}
