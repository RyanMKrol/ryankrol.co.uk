// Per-serverless-instance rate limiter: a fixed-window counter kept in a module-level Map.
// Deliberately zero-new-infra (same spirit as apiCache.js's NodeCache), but this is NOT a
// cross-instance guarantee — on Vercel each serverless instance has its own Map, so it does
// NOT coordinate across instances (same gotcha as apiCache.js's per-instance cache, documented
// in root CLAUDE.md's Architecture section). A true cross-instance limiter would need a shared
// store (e.g. Upstash Redis via the Vercel Marketplace, or a DynamoDB counter table), but that's
// new infra this personal site doesn't need yet — this still stops a single client hammering a
// single instance, which is the common case for a low-traffic site.

const buckets = new Map();

/**
 * Fixed-window rate limiter keyed by an arbitrary string.
 * @param {string} key - Identifier to rate limit on (e.g. an IP address)
 * @param {Object} [options]
 * @param {number} [options.windowMs=60000] - Window length in milliseconds
 * @param {number} [options.max=20] - Max allowed calls per window
 * @returns {{allowed: boolean, retryAfterSeconds: number}}
 */
export function checkRateLimit(key, { windowMs = 60_000, max = 20 } = {}) {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    console.log(`🚦 [RateLimit] Blocked key=${key} retryAfterSeconds=${retryAfterSeconds}`);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Best-effort client IP extraction for use as a rate-limit key.
 * @param {Object} req - Next.js API request object
 * @returns {string} The client IP, or 'unknown' if it can't be determined
 */
export function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || 'unknown';
}
