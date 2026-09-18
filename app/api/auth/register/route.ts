// app/api/auth/register/route.ts — user registration endpoint
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

const RegisterSchema = z.object({
  name    : z.string().min(1).max(255),
  email   : z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  // Rate limiting to prevent credential stuffing / bot mass registration
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
  const { success } = await checkRateLimit(`register:${ip}`, false);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many registration requests. Please try again later.' },
      { status: 429 },
    );
  }

  const body   = await req.json().catch(() => ({}));
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  // Check for existing user — avoid leaking specific existence to prevent user enumeration
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return NextResponse.json(
      { error: 'Unable to complete registration. If you already have an account, please sign in.' },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(users).values({
    id: randomUUID(), name, email, passwordHash, role: 'registered',
  }).returning({ id: users.id, email: users.email, name: users.name });

  return NextResponse.json({ user }, { status: 201 });
}
