// app/api/estimate/[id]/save/route.ts
// POST /api/estimate/:id/save — attach a guest estimate to the logged-in user's account
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { projects, estimates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const SaveSchema = z.object({
  projectName: z.string().min(1).max(200).default('Untitled Project'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id } = await params;
  const userId  = (session.user as any).id as string;
  const body    = await req.json().catch(() => ({}));
  const { projectName } = SaveSchema.parse(body);

  // Verify estimate exists
  const [estimate] = await db.select().from(estimates).where(eq(estimates.id, id)).limit(1);
  if (!estimate) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });

  // Check if the project already has a user — if not, claim it
  const [project] = await db.select().from(projects).where(eq(projects.id, estimate.projectId)).limit(1);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  if (project.userId && project.userId !== userId) {
    return NextResponse.json({ error: 'This estimate belongs to another account' }, { status: 403 });
  }

  // Attach to user account and rename
  await db.update(projects)
    .set({ userId, name: projectName, updatedAt: new Date() })
    .where(eq(projects.id, project.id));

  return NextResponse.json({ success: true, projectId: project.id });
}
