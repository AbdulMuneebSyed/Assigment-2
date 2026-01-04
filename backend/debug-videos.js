// Debug script to check videos and clear cache
require("dotenv").config();
const mongoose = require("mongoose");
const Video = require("./models/Video");
const { redisClient } = require("./config/redis");

async function debug() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Count total videos
    const totalVideos = await Video.countDocuments();
    console.log(`\n📊 Total videos in database: ${totalVideos}`);

    // Get videos by user
    const videosByUser = await Video.aggregate([
      {
        $group: {
          _id: "$owner",
          count: { $sum: 1 },
          videos: { $push: { title: "$title", status: "$processingStatus" } },
        },
      },
    ]);

    console.log("\n👥 Videos grouped by owner:");
    videosByUser.forEach((user) => {
      console.log(`  User ${user._id}: ${user.count} videos`);
      user.videos.forEach((v) => {
        console.log(`    - ${v.title} (${v.status})`);
      });
    });

    // Get sample video
    const sampleVideo = await Video.findOne().lean();
    if (sampleVideo) {
      console.log("\n📹 Sample video:");
      console.log(`  ID: ${sampleVideo._id}`);
      console.log(`  Owner: ${sampleVideo.owner}`);
      console.log(`  Owner type: ${typeof sampleVideo.owner}`);
      console.log(`  Title: ${sampleVideo.title}`);
      console.log(`  Status: ${sampleVideo.processingStatus}`);
      console.log(
        `  Sensitivity: ${sampleVideo.sensitivityResult?.status || "none"}`
      );
    }

    // Clear Redis cache
    if (redisClient && redisClient.status === "ready") {
      console.log("\n🗑️  Clearing Redis cache...");
      const keys = await redisClient.keys("*");
      console.log(`  Found ${keys.length} cache keys`);

      if (keys.length > 0) {
        await redisClient.del(...keys);
        console.log(`  ✅ Cleared all cache keys`);
      }
    } else {
      console.log("\n⚠️  Redis not connected, skipping cache clear");
    }

    console.log("\n✅ Debug complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

debug();
