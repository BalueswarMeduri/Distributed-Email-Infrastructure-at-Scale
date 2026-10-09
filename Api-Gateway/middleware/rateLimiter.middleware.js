import Redis from "ioredis";

let redisClient = null;
let isRedisConnected = false;

const inMemoryStore = new Map();

export const initRedisGateway = () => {
  try {
    const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
      connectTimeout: 500,
      retryStrategy(times) {
        if (times > 1) {
          console.warn("⚡ [API Gateway] Redis offline. Instant fallback to in-memory sliding window rate limiter.");
          return null;
        }
        return 100;
      }
    });

    redisClient.on("connect", () => {
      console.log("✅ API Gateway: Connected to Redis for Rate Limiting");
      isRedisConnected = true;
    });

    redisClient.on("error", () => {
      isRedisConnected = false;
    });

  } catch (err) {
    isRedisConnected = false;
  }
};

export const rateLimiter = async (req, res, next) => {
  const windowSeconds = Number(process.env.RATE_LIMIT_WINDOW_SECONDS) || 60;
  const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  const identifier = req.user?.id || req.headers["x-forwarded-for"] || req.ip || "global_client";
  const key = `gw_rate_limit:${identifier}`;

  if (isRedisConnected && redisClient && redisClient.status === "ready") {
    try {
      await redisClient.zremrangebyscore(key, 0, windowStart);
      const currentRequestCount = await redisClient.zcard(key);

      if (currentRequestCount >= maxRequests) {
        res.setHeader("Retry-After", windowSeconds);
        return res.status(429).json({
          message: "Too many requests. Please try again later.",
          retryAfterSeconds: windowSeconds
        });
      }

      await redisClient.zadd(key, now, `${now}-${Math.random()}`);
      await redisClient.expire(key, windowSeconds);

      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - currentRequestCount - 1);

      return next();
    } catch (error) {
      isRedisConnected = false;
    }
  }

  // --- In-Memory Fallback (Instant) ---
  if (!inMemoryStore.has(identifier)) {
    inMemoryStore.set(identifier, []);
  }

  const userTimestamps = inMemoryStore.get(identifier);

  while (userTimestamps.length > 0 && userTimestamps[0] < windowStart) {
    userTimestamps.shift();
  }

  if (userTimestamps.length >= maxRequests) {
    res.setHeader("Retry-After", windowSeconds);
    return res.status(429).json({
      message: "Too many requests. Please try again later.",
      retryAfterSeconds: windowSeconds
    });
  }

  userTimestamps.push(now);
  res.setHeader("X-RateLimit-Limit", maxRequests);
  res.setHeader("X-RateLimit-Remaining", maxRequests - userTimestamps.length);

  return next();
};
