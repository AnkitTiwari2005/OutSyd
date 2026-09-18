// app/api/estimate/[id]/save/route.ts
// POST /api/estimate/:id/save — attach a guest estimate to the logged-in user's account
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { projects, estimates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const SaveSchema = z.object({
  projectName: z.string().min(1).max(200).default('Untitled Project'),
  guestToken : z.string().min(1, 'guestToken must be provided').optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;
  const body = await req.json().catch(() => ({}));

  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.issues },
      { status: 400 },
    );
  }
  const { projectName, guestToken } = parsed.data;

  // Verify estimate exists
  const [estimate] = await db.select().from(estimates).where(eq(estimates.id, id)).limit(1);
  if (!estimate) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });

  // Check project existence
  const [project] = await db.select().from(projects).where(eq(projects.id, estimate.projectId)).limit(1);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  // If already owned by someone else
  if (project.userId && project.userId !== userId) {
    return NextResponse.json({ error: 'This estimate belongs to another account' }, { status: 403 });
  }

  // If already owned by current user, just update name
  if (project.userId === userId) {
    await db.update(projects)
      .set({ name: projectName, updatedAt: new Date() })
      .where(eq(projects.id, project.id));
    return NextResponse.json({ success: true, projectId: project.id });
  }

  // Claiming a guest project: require matching guestToken
  if (!project.guestToken || !guestToken || project.guestToken !== guestToken) {
    return NextResponse.json(
      { error: 'Forbidden: Valid guestToken is required to claim this guest estimate' },
      { status: 403 },
    );
  }

  // Attach to user account, null out guestToken after successful claim, and update name
  await db.update(projects)
    .set({ userId, name: projectName, guestToken: null, updatedAt: new Date() })
    .where(eq(projects.id, project.id));

  return NextResponse.json({ success: true, projectId: project.id });
}
