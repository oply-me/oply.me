import "server-only";

/**
 * Rate limiter behind a small interface so Redis/Upstash can replace the
 * in-memory store without touching call sites.
 *
 * The in-memory implementation is per-process: correct for a single server
 * and for local development, approximate behind several instances. Set
 * UPSTASH_REDIS_REST_URL and swap in a Redis store before scaling out.
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix ms when the current window expires. */
  reset: number;
}

export interface RateLimitStore {
  hit(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, { count: number; reset: number }>();

  async hit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.reset <= now) {
      const reset = now + windowMs;
      this.buckets.set(key, { count: 1, reset });
      this.sweep(now);
      return { success: true, limit, remaining: limit - 1, reset };
    }

    bucket.count += 1;
    return {
      success: bucket.count <= limit,
      limit,
      remaining: Math.max(0, limit - bucket.count),
      reset: bucket.reset,
    };
  }

  /** Drops expired buckets so the map cannot grow without bound. */
  private sweep(now: number) {
    if (this.buckets.size < 5000) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.reset <= now) this.buckets.delete(key);
    }
  }
}

const store: RateLimitStore = new MemoryRateLimitStore();

export const RATE_LIMITS = {
  /** AI generation is the expensive one. */
  generate: { limit: 10, windowMs: 60_000 },
  /** Payment order creation. */
  payment: { limit: 10, windowMs: 60_000 },
  /** Public form submissions. */
  contact: { limit: 5, windowMs: 300_000 },
  /** General authenticated API traffic. */
  api: { limit: 60, windowMs: 60_000 },
  /**
   * Credential-checking endpoints. Tight, because both re-verify a password
   * and would otherwise be an online guessing oracle against a known email.
   */
  credentials: { limit: 5, windowMs: 900_000 },
} as const;

export async function rateLimit(
  scope: keyof typeof RATE_LIMITS,
  identifier: string,
): Promise<RateLimitResult> {
  const { limit, windowMs } = RATE_LIMITS[scope];
  return store.hit(`${scope}:${identifier}`, limit, windowMs);
}

/** Best-effort client IP for anonymous rate limiting. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
