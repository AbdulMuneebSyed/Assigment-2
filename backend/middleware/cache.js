const cacheService = require("../services/cacheService");

/**
 * Cache middleware - wraps route handlers with caching logic
 * @param {Function} keyGenerator - Function that generates cache key from req
 * @param {Number} ttl - Time to live in seconds
 */
const cacheMiddleware = (keyGenerator, ttl = 300) => {
  return async (req, res, next) => {
    try {
      // Generate cache key
      const cacheKey = keyGenerator(req);

      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);

      if (cachedData) {
        // Cache hit
        return res.status(200).json(cachedData);
      }

      // Cache miss - store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (data) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, data, ttl).catch((err) => {
            console.error("Failed to cache response:", err);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next();
    }
  };
};

/**
 * Invalidate cache by pattern
 */
const invalidateCache = async (pattern) => {
  try {
    const deleted = await cacheService.deletePattern(pattern);
    if (deleted > 0) {
      console.log(`✅ Invalidated ${deleted} cache keys matching: ${pattern}`);
    }
    return deleted;
  } catch (error) {
    console.error("Cache invalidation error:", error);
    return 0;
  }
};

/**
 * Generate cache key for video lists with filters
 */
const generateVideoListKey = (userId, query) => {
  const filters = {
    status: query.status,
    sensitivityStatus: query.sensitivityStatus,
    category: query.category,
    fromDate: query.fromDate,
    toDate: query.toDate,
    search: query.search,
    sortBy: query.sortBy || "createdAt",
    sortOrder: query.sortOrder || "desc",
    page: query.page || 1,
    limit: query.limit || 12,
  };

  const hash = cacheService.generateHash(filters);
  return `videos:list:${userId}:${hash}`;
};

/**
 * Generate cache key for video stats
 */
const generateVideoStatsKey = (userId) => {
  return `videos:stats:${userId}`;
};

/**
 * Generate cache key for single video
 */
const generateVideoKey = (videoId) => {
  return `video:${videoId}:full`;
};

/**
 * Generate cache key for video stream metadata
 */
const generateVideoStreamKey = (videoId) => {
  return `video:${videoId}:stream`;
};

/**
 * Generate cache key for user profile
 */
const generateUserKey = (userId) => {
  return `user:${userId}:profile`;
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  generateVideoListKey,
  generateVideoStatsKey,
  generateVideoKey,
  generateVideoStreamKey,
  generateUserKey,
};
