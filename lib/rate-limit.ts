// lib/rate-limit.ts — Upstash sliding window rate limiter
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;
let guestRateLimit: Ratelimit | null = null;
let authRateLimit: Ratelimit | null = null;

function getLimiters() {
  if (!guestRateLimit) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      return null;
    }
    redis = new Redis({ url, token });
    guestRateLimit = new Ratelimit({
      redis,
      limiter  : Ratelimit.slidingWindow(5, '1 h'),
      analytics: true,
      prefix   : 'rl:outsyd:guest',
    });
    authRateLimit = new Ratelimit({
      redis,
      limiter  : Ratelimit.slidingWindow(30, '1 h'),
      analytics: true,
      prefix   : 'rl:outsyd:auth',
    });
  }
  return { guestRateLimit, authRateLimit };
}

export async function checkRateLimit(
  identifier: string,
  isAuth    : boolean,
): Promise<{ success: boolean; remaining: number; reset: number }> {
  try {
    const limiters = getLimiters();
    if (!limiters || !limiters.guestRateLimit || !limiters.authRateLimit) {
      return { success: true, remaining: 999, reset: Date.now() + 3600000 };
    }
    const limiter = isAuth ? limiters.authRateLimit : limiters.guestRateLimit;
    const result  = await limiter.limit(identifier);
    return {
      success  : result.success,
      remaining: result.remaining,
      reset    : result.reset,
    };
  } catch (error) {
    console.warn('[RateLimit] Warning: Rate limit check encountered an issue, bypassing gracefully:', error);
    return { success: true, remaining: 1, reset: Date.now() + 60000 };
  }
}
