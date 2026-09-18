// app/api/admin/rates/route.ts — GET all regional rate index rows (admin only)
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { regionalRateIndex } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const rates = await db.select().from(regionalRateIndex).orderBy(asc(regionalRateIndex.regionName));
  return NextResponse.json({ rates });
}
