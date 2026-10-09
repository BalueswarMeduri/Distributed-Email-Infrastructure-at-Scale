import Redis from "ioredis";

let redisClient = null;
let isRedisConnected = false;

const inMemoryTimestamps = [];

export const initRedis = () => {
  try {
    const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
      connectTimeout: 500,
      retryStrategy(times) {
        if (times > 1) {
          console.warn("⚡ [Worker] Redis offline. Instant fallback to in-memory rate limiter.");
          return null;
        }
        return 100;
      }
    });

    redisClient.on("connect", () => {
      console.log("✅ [Worker] Redis connected successfully for Rate Limiting");
      isRedisConnected = true;
    });

    redisClient.on("error", () => {
      isRedisConnected = false;
    });

  } catch (err) {
    isRedisConnected = false;
  }
};

export const checkRateLimit = async () => {
  const WINDOW_SIZE_IN_SECONDS = parseInt(process.env.RATE_LIMIT_WINDOW_SEC || "10", 10);
  const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_MSGS || "30", 10);
  const now = Date.now();

  if (isRedisConnected && redisClient && redisClient.status === "ready") {
    try {
      const key = "rate_limit:email_sender";
      const windowStart = now - WINDOW_SIZE_IN_SECONDS * 1000;

      await redisClient.zremrangebyscore(key, 0, windowStart);
      const requestCount = await redisClient.zcard(key);

      if (requestCount >= MAX_REQUESTS) {
        return false;
      }

      await redisClient.zadd(key, now, `${now}-${Math.random()}`);
      await redisClient.expire(key, WINDOW_SIZE_IN_SECONDS);

      return true;
    } catch (err) {
      isRedisConnected = false;
    }
  }

  // Ultra-fast in-memory sliding window fallback
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
