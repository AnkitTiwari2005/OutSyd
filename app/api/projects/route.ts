// app/api/projects/route.ts — GET + POST /api/projects (auth required)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { projects, estimates } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const userId = (session.user as any).id as string;

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));

  return NextResponse.json({ projects: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { name } = await req.json().catch(() => ({ name: 'Untitled Project' }));

  const [project] = await db.insert(projects).values({
    id       : randomUUID(),
    userId,
    name     : name ?? 'Untitled Project',
    updatedAt: new Date(),
  }).returning();

  return NextResponse.json({ project }, { status: 201 });
}
