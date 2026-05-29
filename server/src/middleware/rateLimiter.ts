// server/src/middleware/rateLimiter.ts
/**
 * In-memory rate limiter using a sliding window.
 * IP-based tracking with configurable limits per route.
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter(
      (ts) => now - ts < 600_000
    );
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 600_000).unref();

/**
 * Create a rate limiter middleware for Express.
 */
export function createRateLimiter(config: RateLimitConfig) {
  
  return function rateLimiter(
    req: import("express").Request,
    res: import("express").Response,
    next: import("express").NextFunction
  ) {
    if (req.method === "OPTIONS") {
      return next();
    }
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown";

    const key = `ratelimit:${ip}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      store.set(key, entry);
    }

    // Remove expired timestamps (sliding window)
    entry.timestamps = entry.timestamps.filter(
      (ts) => now - ts < config.windowMs
    );

    // Check if rate limit exceeded
    if (entry.timestamps.length >= config.maxRequests) {
      const oldestTimestamp = entry.timestamps[0];
      const retryAfterMs = config.windowMs - (now - oldestTimestamp);
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);

      res.setHeader("Retry-After", String(retryAfterSec));
      res.status(429).json({
        error: "Too many requests. Please try again later.",
        retryAfter: retryAfterSec,
      });
      return;
    }

    // Record this request
    entry.timestamps.push(now);

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", String(config.maxRequests));
    res.setHeader(
      "X-RateLimit-Remaining",
      String(config.maxRequests - entry.timestamps.length)
    );
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(now + config.windowMs).toISOString()
    );

    next();
  };
}

// Pre-configured limiters for auth endpoints
export const authLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20,
});

export const authRegisterLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
});