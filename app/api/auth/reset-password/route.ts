// app/api/auth/reset-password/route.ts — reset password completion endpoint
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

const ResetPasswordSchema = z.object({
  email   : z.string().email('Please enter a valid email address'),
  token   : z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export async function POST(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
  const { success } = await checkRateLimit(`reset-password:${ip}`, false);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = ResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email, token, password } = parsed.data;

  try {
    const [tokenRecord] = await db.select()
      .from(verificationTokens)
      .where(and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, token),
      ))
      .limit(1);

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset link. Please request a new one.' },
        { status: 400 },
      );
    }

    if (new Date(tokenRecord.expires) < new Date()) {
      // Clean up expired token
      await db.delete(verificationTokens).where(and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, token),
      ));
      return NextResponse.json(
        { error: 'This password reset link has expired. Please request a new one.' },
        { status: 400 },
      );
    }

    // Hash new password and update user record
    const passwordHash = await bcrypt.hash(password, 12);
    await db.update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.email, email));

    // Invalidate the used token
    await db.delete(verificationTokens).where(and(
      eq(verificationTokens.identifier, email),
      eq(verificationTokens.token, token),
    ));

    return NextResponse.json(
      { message: 'Password reset successfully. You can now sign in with your new password.' },
      { status: 200 },
    );
  } catch (err) {
    console.error('[ResetPassword] Error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while resetting your password.' },
      { status: 500 },
    );
  }
}
