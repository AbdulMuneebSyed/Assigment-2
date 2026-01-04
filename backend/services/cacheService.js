const { redisClient, isRedisAvailable } = require("../config/redis");
const crypto = require("crypto");

class CacheService {
  /**
   * Generate cache key hash for complex objects
   */
  generateHash(data) {
    return crypto
      .createHash("md5")
      .update(JSON.stringify(data))
      .digest("hex")
      .substring(0, 8);
  }

  /**
   * Get value from cache
   */
  async get(key) {
    if (!isRedisAvailable()) {
      return null;
    }

    try {
      const data = await redisClient.get(key);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttl = 300) {
    if (!isRedisAvailable()) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redisClient.setex(key, ttl, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete specific key from cache
   */
  async delete(key) {
    if (!isRedisAvailable()) {
      return false;
    }

    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error(`Cache DELETE error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete keys matching pattern
   */
  async deletePattern(pattern) {
    if (!isRedisAvailable()) {
      return 0;
    }

    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        return keys.length;
      }
      return 0;
    } catch (error) {
      console.error(
        `Cache DELETE PATTERN error for ${pattern}:`,
        error.message
      );
      return 0;
    }
  }

  /**
   * Increment counter (for view counts)
   */
  async increment(key, amount = 1) {
    if (!isRedisAvailable()) {
      return null;
    }

    try {
      const result = await redisClient.incrby(key, amount);
      return result;
    } catch (error) {
      console.error(`Cache INCREMENT error for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Get counter value
   */
  async getCounter(key) {
    if (!isRedisAvailable()) {
      return null;
    }

    try {
      const value = await redisClient.get(key);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      console.error(`Cache GET COUNTER error for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    if (!isRedisAvailable()) {
      return false;
    }

    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache EXISTS error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Set expiration on existing key
   */
  async expire(key, ttl) {
    if (!isRedisAvailable()) {
      return false;
    }

    try {
      await redisClient.expire(key, ttl);
      return true;
    } catch (error) {
      console.error(`Cache EXPIRE error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget(keys) {
    if (!isRedisAvailable() || !keys.length) {
      return [];
    }

    try {
      const values = await redisClient.mget(...keys);
      return values.map((val) => (val ? JSON.parse(val) : null));
    } catch (error) {
      console.error("Cache MGET error:", error.message);
      return [];
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!isRedisAvailable()) {
      return { available: false };
    }

    try {
      const info = await redisClient.info("stats");
      const dbSize = await redisClient.dbsize();

      return {
        available: true,
        dbSize,
        info: info,
      };
    } catch (error) {
      console.error("Cache STATS error:", error.message);
      return { available: false, error: error.message };
    }
  }

  /**
   * Flush all cache
   */
  async flushAll() {
    if (!isRedisAvailable()) {
      return false;
    }

    try {
      await redisClient.flushdb();
      return true;
    } catch (error) {
      console.error("Cache FLUSH error:", error.message);
      return false;
    }
  }
}

module.exports = new CacheService();
