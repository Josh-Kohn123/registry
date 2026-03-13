import redis from "@/lib/redis";

/**
 * Redis-backed rate limiter using sliding window counters.
 * Falls back to allowing the request if Redis is unavailable.
 */
export async function rateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<boolean> {
  try {
    const redisKey = `rl:${key}`;
    const windowSec = Math.ceil(windowMs / 1000);

    const count = await redis.incr(redisKey);

    // Set expiry on first request in this window
    if (count === 1) {
      await redis.expire(redisKey, windowSec);
    }

    return count <= limit;
  } catch {
    // If Redis is down, allow the request rather than blocking everyone
    return true;
  }
}
