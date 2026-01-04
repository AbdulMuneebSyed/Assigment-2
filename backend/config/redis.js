const Redis = require("ioredis");

// Redis client configuration
let redisClient;

try {
  // Check if REDIS_URL is provided (Redis Cloud or remote)
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL, {
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });
  } else {
    // Fallback to individual host/port configuration
    const redisConfig = {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    };
    redisClient = new Redis(redisConfig);
  }

  redisClient.on("connect", () => {
    console.log("✅ Redis: Connected successfully");
  });

  redisClient.on("error", (err) => {
    console.error("❌ Redis Error:", err.message);
  });

  redisClient.on("reconnecting", () => {
    console.log("🔄 Redis: Reconnecting...");
  });

  redisClient.on("close", () => {
    console.log("⚠️  Redis: Connection closed");
  });
} catch (error) {
  console.error("Failed to initialize Redis client:", error);
  redisClient = null;
}

// Helper: Check if Redis is available
const isRedisAvailable = () => {
  return redisClient && redisClient.status === "ready";
};

// TTL configurations (in seconds)
const TTL = {
  USER_PROFILE: 30 * 60, // 30 minutes
  VIDEO_STREAM: 15 * 60, // 15 minutes
  VIDEO_FULL: 10 * 60, // 10 minutes
  VIDEO_PROCESSING: 2 * 60, // 2 minutes
  VIDEO_LIST: 3 * 60, // 3 minutes
  VIDEO_STATS: 5 * 60, // 5 minutes
  ADMIN_STATS: 10 * 60, // 10 minutes
  ADMIN_USERS: 5 * 60, // 5 minutes
};

module.exports = {
  redisClient,
  isRedisAvailable,
  TTL,
};
