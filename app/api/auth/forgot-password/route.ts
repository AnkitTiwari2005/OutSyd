// app/api/auth/forgot-password/route.ts — forgot password request endpoint
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
  const { success } = await checkRateLimit(`forgot-password:${ip}`, false);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many password reset requests. Please try again later.' },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = ForgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email } = parsed.data;

  // Always return identical success message to prevent user enumeration
  const standardResponse = {
    success: true,
    message: 'If an account exists with this email, you will receive password reset instructions.',
  };

  try {
    const [existing] = await db.select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!existing) {
      return NextResponse.json(standardResponse, { status: 200 });
    }

    // Clean up any existing tokens for this identifier
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));

    // Generate token valid for 1 hour
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(verificationTokens).values({
      identifier: email,
      token,
      expires,
    });

    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'OUTSYD Security <onboarding@resend.dev>',
          to: email,
          subject: 'Reset your OUTSYD password',
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0F172A;">
              <h2 style="color: #1E3A5F; font-size: 20px; font-weight: 700;">Password Reset Request</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Hello ${existing.name || 'there'},<br/><br/>
                We received a request to reset your password for your OUTSYD account. Click the button below to choose a new password:
              </p>
              <div style="margin: 24px 0;">
                <a href="${resetUrl}" style="background-color: #EA580C; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="font-size: 12px; color: #64748B; line-height: 1.5;">
                This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
              <p style="font-size: 11px; color: #94A3B8;">
                OUTSYD — Construction-cost estimation and BOQ engine
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.warn('[ForgotPassword] Resend delivery failed:', emailErr);
      }
    } else if (process.env.NODE_ENV !== 'production') {
      console.log(`[ForgotPassword] RESEND_API_KEY not configured. Dev reset link for ${email}: ${resetUrl}`);
    }

    return NextResponse.json(standardResponse, { status: 200 });
  } catch (err) {
    console.error('[ForgotPassword] Error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request.' },
      { status: 500 },
    );
  }
}
