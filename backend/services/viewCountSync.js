const cacheService = require("./cacheService");
const Video = require("../models/Video");

/**
 * Sync view counts from Redis to MongoDB
 * This runs periodically to persist Redis counters to the database
 */
const syncViewCounts = async () => {
  try {
    console.log("🔄 Starting view count sync from Redis to MongoDB...");

    // Get all video view count keys from Redis
    const pattern = "video:*:views";
    const { redisClient } = require("../config/redis");

    if (!redisClient || redisClient.status !== "ready") {
      console.log("⚠️  Redis not available, skipping view count sync");
      return;
    }

    const keys = await redisClient.keys(pattern);

    if (keys.length === 0) {
      console.log("✅ No view counts to sync");
      return;
    }

    let syncedCount = 0;
    let errorCount = 0;

    // Process each key
    for (const key of keys) {
      try {
        // Extract video ID from key: "video:VIDEO_ID:views"
        const videoId = key.split(":")[1];

        // Get view count from Redis
        const redisViews = await cacheService.getCounter(key);

        if (redisViews === null || redisViews === 0) {
          continue;
        }

        // Update MongoDB
        const video = await Video.findById(videoId);

        if (video) {
          // Increment views in MongoDB by the Redis count
          video.views = (video.views || 0) + redisViews;
          await video.save();

          // Reset Redis counter after successful sync
          await redisClient.set(key, "0");

          syncedCount++;
          console.log(`  ✓ Synced ${redisViews} views for video ${videoId}`);
        } else {
          // Video doesn't exist, clean up Redis key
          await redisClient.del(key);
          console.log(`  ⚠️  Video ${videoId} not found, cleaned up Redis key`);
        }
      } catch (err) {
        errorCount++;
        console.error(`  ✗ Error syncing ${key}:`, err.message);
      }
    }

    console.log(
      `✅ View count sync complete: ${syncedCount} synced, ${errorCount} errors`
    );
  } catch (error) {
    console.error("❌ View count sync failed:", error);
  }
};

/**
 * Start periodic sync job
 * @param {Number} intervalMinutes - Sync interval in minutes
 */
const startViewCountSync = (intervalMinutes = 5) => {
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(
    `🚀 Starting view count sync job (every ${intervalMinutes} minutes)`
  );

  // Run immediately on start
  syncViewCounts();

  // Then run periodically
  setInterval(syncViewCounts, intervalMs);
};

module.exports = {
  syncViewCounts,
  startViewCountSync,
};
