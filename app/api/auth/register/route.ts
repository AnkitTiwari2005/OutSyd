// app/api/auth/register/route.ts — user registration endpoint
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const RegisterSchema = z.object({
  name    : z.string().min(1).max(255),
  email   : z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  const body   = await req.json().catch(() => ({}));
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  // Check for existing user
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(users).values({
    id: randomUUID(), name, email, passwordHash, role: 'registered',
  }).returning({ id: users.id, email: users.email, name: users.name });

  return NextResponse.json({ user }, { status: 201 });
}
