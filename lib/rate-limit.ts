/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for a single Node process (local / one Vercel instance).
 * For multi-instance production, replace with Redis / Upstash.
 */

type Bucket = { timestamps: number[] };

const stores = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

export function rateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): RateLimitResult {
  const now = options.now ?? Date.now();
  const windowStart = now - options.windowMs;
  let bucket = stores.get(options.key);
  if (!bucket) {
    bucket = { timestamps: [] };
    stores.set(options.key, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);

  if (bucket.timestamps.length >= options.limit) {
    const oldest = bucket.timestamps[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, oldest + options.windowMs - now),
    };
  }

  bucket.timestamps.push(now);
  return {
    allowed: true,
    remaining: Math.max(0, options.limit - bucket.timestamps.length),
    retryAfterMs: 0,
  };
}

/** Test helper — clears all buckets. */
export function resetRateLimitStores() {
  stores.clear();
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}
