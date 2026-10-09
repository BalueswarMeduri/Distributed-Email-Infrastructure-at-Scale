import Redis from "ioredis";

let redisClient = null;
let isRedisConnected = false;

// Fallback in-memory rate limiter per IP/User
const inMemoryStore = new Map();

export const initRedisGateway = () => {
  try {
    const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          console.warn("⚠️ API Gateway: Redis unavailable. Using in-memory sliding window rate limiter.");
          return null;
        }
        return Math.min(times * 100, 3000);
      }
    });

    redisClient.on("connect", () => {
      console.log("✅ API Gateway: Connected to Redis for Sliding Window Rate Limiting");
      isRedisConnected = true;
    });

    redisClient.on("error", (err) => {
      console.warn("⚠️ API Gateway Redis Error:", err.message);
      isRedisConnected = false;
    });

  } catch (err) {
    console.warn("⚠️ API Gateway: Redis initialization error, using in-memory rate limiter.");
    isRedisConnected = false;
  }
};

/**
 * Sliding Window Rate Limiter Middleware
 */
export const rateLimiter = async (req, res, next) => {
  const windowSeconds = Number(process.env.RATE_LIMIT_WINDOW_SECONDS) || 60;
  const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Identify request by user ID (if auth token present) or IP address
  const identifier = req.user?.id || req.headers["x-forwarded-for"] || req.ip || "global_client";
  const key = `gw_rate_limit:${identifier}`;

  if (isRedisConnected && redisClient) {
    try {
      // 1. Remove timestamps older than the sliding window
      await redisClient.zremrangebyscore(key, 0, windowStart);

      // 2. Count current requests in window
      const currentRequestCount = await redisClient.zcard(key);

      if (currentRequestCount >= maxRequests) {
        res.setHeader("Retry-After", windowSeconds);
        return res.status(429).json({
          message: "Too many requests. Please try again later.",
          retryAfterSeconds: windowSeconds
        });
      }

      // 3. Add current request timestamp
      await redisClient.zadd(key, now, `${now}-${Math.random()}`);
      await redisClient.expire(key, windowSeconds);

      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - currentRequestCount - 1);

      return next();
    } catch (error) {
      console.warn("Redis rate limit error, using in-memory fallback:", error.message);
    }
  }

  // --- In-Memory Fallback ---
  if (!inMemoryStore.has(identifier)) {
    inMemoryStore.set(identifier, []);
  }

  const userTimestamps = inMemoryStore.get(identifier);

  // Clean old entries
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
