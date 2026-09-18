// lib/env.ts — Runtime environment validation via Zod
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection URL'),
  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET must be at least 16 characters long'),
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL').optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN cannot be empty').optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

let _env: Env | null = null;

export function validateEnv(): Env {
  if (_env) return _env;

  const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  const result = EnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: authSecret,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!result.success) {
    const errorMessages = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`❌ Invalid environment variables:\n${errorMessages}`);
    throw new Error(`Invalid environment configuration:\n${errorMessages}`);
  }

  _env = result.data;
  return _env;
}
