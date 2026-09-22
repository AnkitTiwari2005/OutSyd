// app/api/projects/route.ts — GET + POST /api/projects (auth required)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const CreateProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(200, 'Project name cannot exceed 200 characters'),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const userId = session.user.id;

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));

  return NextResponse.json({ projects: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json().catch(() => ({}));
  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid project name', details: parsed.error.issues },
      { status: 400 },
    );
  }
  const { name } = parsed.data;

  const [project] = await db.insert(projects).values({
    id       : randomUUID(),
    userId,
    name,
    updatedAt: new Date(),
  }).returning();

  return NextResponse.json({ project }, { status: 201 });
}
