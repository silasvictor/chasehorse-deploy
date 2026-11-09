/**
 * Production Rate Limiter for API Routes & Critical Endpoints.
 *
 * Implements sliding window rate limiting with per-IP, per-user, and
 * endpoint-specific controls, standard HTTP rate-limit headers (RFC 6585),
 * and automatic bucket pruning to prevent memory exhaustion.
 */

interface Bucket {
  count: number;
  resetAt: number;
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

// Periodic prune every 5 minutes to release stale buckets
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}

/**
 * Evaluates rate limit for a given key.
 *
 * @param key Unique key (e.g., "auth:192.168.1.1" or "user-123")
 * @param limit Max allowed requests in window
 * @param windowMs Time window in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    const newBucket: Bucket = {
      count: 1,
      resetAt,
      timestamps: [now],
    };
    buckets.set(key, newBucket);
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetAt,
    };
  }

  // Filter timestamps within sliding window
  const windowStart = now - windowMs;
  bucket.timestamps = bucket.timestamps.filter((ts) => ts > windowStart);
  bucket.count = bucket.timestamps.length;

  if (bucket.count >= limit) {
    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  bucket.timestamps.push(now);
  bucket.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

/**
 * Extracts a normalized client identification key from the request.
 */
export function clientKey(req: Request, userId?: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    (forwarded ? forwarded.split(",")[0].trim() : null) ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  return userId ? `${userId}:${ip}` : ip;
}

/**
 * Generates standard RFC 6585 rate limit headers.
 */
export function rateLimitHeaders(result: RateLimitResult, limit: number): HeadersInit {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };

  if (!result.allowed && result.retryAfterSeconds) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return headers;
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  prefix?: string;
  userId?: string;
}

/**
 * Pre-configured rate limiting rules.
 */
export const RateLimitPresets = {
  // Strict: 5 attempts per 15 minutes (for login, register, password reset)
  AUTH: { limit: 5, windowMs: 15 * 60 * 1000, prefix: "rl:auth" },
  // Password reset request: 3 per 30 minutes
  PASSWORD_RESET: { limit: 3, windowMs: 30 * 60 * 1000, prefix: "rl:pwreset" },
  // AI generation: 20 calls per minute
  AI_API: { limit: 20, windowMs: 60 * 1000, prefix: "rl:ai" },
  // File uploads: 15 uploads per minute
  UPLOADS: { limit: 15, windowMs: 60 * 1000, prefix: "rl:upload" },
  // General operational API: 120 calls per minute
  STANDARD_API: { limit: 120, windowMs: 60 * 1000, prefix: "rl:api" },
};

/**
 * Middleware helper: checks rate limit and returns 429 Response if exceeded.
 */
export function checkRateLimit(
  req: Request,
  options: RateLimitOptions
): { allowed: boolean; response?: Response; headers: HeadersInit } {
  const ipKey = clientKey(req, options.userId);
  const compositeKey = `${options.prefix || "rl"}:${ipKey}`;
  const result = rateLimit(compositeKey, options.limit, options.windowMs);
  const headers = rateLimitHeaders(result, options.limit);

  if (!result.allowed) {
    return {
      allowed: false,
      headers,
      response: new Response(
        JSON.stringify({
          error: "Too Many Requests",
          message: `Rate limit exceeded. Please retry in ${result.retryAfterSeconds} seconds.`,
          retryAfter: result.retryAfterSeconds,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
        }
      ),
    };
  }

  return { allowed: true, headers };
}
