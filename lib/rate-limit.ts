// lib/rate-limit.ts — Upstash sliding window rate limiter
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// 5 estimates/hr per IP (guest)
export const guestRateLimit = new Ratelimit({
  redis,
  limiter  : Ratelimit.slidingWindow(5, '1 h'),
  analytics: true,
  prefix   : 'rl:outsyd:guest',
});

// 30 estimates/hr per authenticated user ID
export const authRateLimit = new Ratelimit({
  redis,
  limiter  : Ratelimit.slidingWindow(30, '1 h'),
  analytics: true,
  prefix   : 'rl:outsyd:auth',
});

export async function checkRateLimit(
  identifier: string,
  isAuth    : boolean,
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const limiter = isAuth ? authRateLimit : guestRateLimit;
  const result  = await limiter.limit(identifier);
  return {
    success  : result.success,
    remaining: result.remaining,
    reset    : result.reset,
  };
}
