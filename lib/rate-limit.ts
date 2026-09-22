// lib/rate-limit.ts — Upstash sliding window rate limiter
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;
let guestRateLimit: Ratelimit | null = null;
let authRateLimit: Ratelimit | null = null;
let hasWarnedMissingConfig = false;

function warnMissingConfigOnce() {
  if (!hasWarnedMissingConfig) {
    hasWarnedMissingConfig = true;
    console.error(
      '[RateLimit] CRITICAL CONFIGURATION NOTICE: Upstash Redis credentials (UPSTASH_REDIS_REST_URL and/or UPSTASH_REDIS_REST_TOKEN) are missing. Rate limiting is running in UNPROTECTED FAIL-OPEN mode. All requests will be permitted without throttling.',
    );
  }
}

// Startup-time configuration check
if (typeof process !== 'undefined' && process.env) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    warnMissingConfigOnce();
  }
}

function getLimiters() {
  if (!guestRateLimit) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      warnMissingConfigOnce();
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
    console.error(
      '[RateLimit] ERROR: Upstash Redis rate limit check failed, failing open for availability:',
      error,
    );
    return { success: true, remaining: 1, reset: Date.now() + 60000 };
  }
}
