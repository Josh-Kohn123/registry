// Simple in-memory rate limiter (for demo; replace with Redis in production)
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

export function rateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  // Create new bucket or check if expired
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  // Check limit
  if (bucket.count >= limit) {
    return false;
  }

  // Increment and allow
  bucket.count++;
  return true;
}

// Clean up old buckets periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}, 60000); // Clean every minute
