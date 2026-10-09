import Redis from "ioredis";

let redisClient = null;
let isRedisConnected = false;

// Fallback in-memory rate limiter if Redis is offline
const inMemoryTimestamps = [];

export const initRedis = () => {
  try {
    const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          console.warn("⚠️ Redis connection unavailable. Falling back to in-memory rate limiter.");
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      }
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis connected successfully");
      isRedisConnected = true;
    });

    redisClient.on("error", (err) => {
      console.warn("⚠️ Redis error:", err.message);
      isRedisConnected = false;
    });

  } catch (err) {
    console.warn("⚠️ Redis initialization error, using in-memory rate limiter fallback.");
    isRedisConnected = false;
  }
};

/**
 * Distributed Rate Limiter: 30 emails / 10 seconds
 * Returns true if allowed, false if rate limit exceeded.
 */
export const checkRateLimit = async () => {
  const WINDOW_SIZE_IN_SECONDS = 10;
  const MAX_REQUESTS = 30;
  const now = Date.now();

  if (isRedisConnected && redisClient) {
    try {
      const key = "rate_limit:email_sender";
      const windowStart = now - WINDOW_SIZE_IN_SECONDS * 1000;

      // Remove timestamps older than 10 seconds
      await redisClient.zremrangebyscore(key, 0, windowStart);

      // Count requests in the current window
      const requestCount = await redisClient.zcard(key);

      if (requestCount >= MAX_REQUESTS) {
        return false; // Limit exceeded
      }

      // Add current timestamp to sorted set
      await redisClient.zadd(key, now, `${now}-${Math.random()}`);
      await redisClient.expire(key, WINDOW_SIZE_IN_SECONDS);

      return true;
    } catch (err) {
      console.warn("Redis rate limiter check failed, falling back to in-memory check.");
    }
  }

  // In-memory fallback
  const windowStart = now - WINDOW_SIZE_IN_SECONDS * 1000;
  while (inMemoryTimestamps.length > 0 && inMemoryTimestamps[0] < windowStart) {
    inMemoryTimestamps.shift();
  }

  if (inMemoryTimestamps.length >= MAX_REQUESTS) {
    return false;
  }

  inMemoryTimestamps.push(now);
  return true;
};

export default initRedis;
