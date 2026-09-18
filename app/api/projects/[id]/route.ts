// app/api/projects/[id]/route.ts — GET /api/projects/:id
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { projects, estimates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id }  = await params;

  const [project] = await db.select().from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .limit(1);

  if (!project) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const projectEstimates = await db.select().from(estimates)
    .where(eq(estimates.projectId, id))
    .orderBy(estimates.createdAt);

  return NextResponse.json({ project, estimates: projectEstimates });
}
