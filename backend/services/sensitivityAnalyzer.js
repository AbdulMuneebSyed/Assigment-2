const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const {
  emitProcessingProgress,
  emitProcessingStart,
  emitProcessingComplete,
  emitProcessingError,
} = require("./socketService");
const Video = require("../models/Video");

// Delay helper for simulated processing
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Keywords that will trigger flagging (for demo purposes)
const FLAG_KEYWORDS = [
  "violence",
  "violent",
  "explicit",
  "nsfw",
  "adult",
  "danger",
  "harmful",
  "weapon",
  "gore",
  "inappropriate",
  "restricted",
  "mature",
  "18+",
  "xxx",
];

/**
 * Analyze video for sensitivity content
 * This is a simulated analysis for demo purposes
 * In production, you would integrate with actual ML/AI services
 */
const analyzeVideo = async (videoId, userId) => {
  try {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    // Emit processing start
    emitProcessingStart(userId, videoId, video.title);

    // Update video status to processing
    video.processingStatus = "processing";
    video.processingProgress = 0;
    await video.save();

    // Stage 1: File Validation (0-20%)
    await processStage(video, userId, {
      stageName: "Validating file integrity",
      startProgress: 0,
      endProgress: 20,
      duration: 1500,
    });

    // Stage 2: Metadata Extraction (20-40%)
    const metadata = await extractMetadata(video, userId);

    // Stage 3: Content Frame Analysis (40-80%)
    await processStage(video, userId, {
      stageName: "Analyzing video frames for content",
      startProgress: 40,
      endProgress: 80,
      duration: 3000,
    });

    // Stage 4: Generate Report (80-100%)
    await processStage(video, userId, {
      stageName: "Generating sensitivity report",
      startProgress: 80,
      endProgress: 95,
      duration: 1000,
    });

    // Determine sensitivity result
    const sensitivityResult = determineSensitivity(
      video.originalName,
      video.title,
      video.size
    );

    // Update video with results
    video.processingStatus = "completed";
    video.processingProgress = 100;
    video.currentStage = "Complete";
    video.sensitivityResult = sensitivityResult;
    video.processedAt = new Date();

    if (metadata.duration) video.duration = metadata.duration;
    if (metadata.resolution) video.resolution = metadata.resolution;

    await video.save();

    // Emit completion
    emitProcessingComplete(userId, videoId, {
      status: sensitivityResult.status,
      confidence: sensitivityResult.confidence,
      reasons: sensitivityResult.reasons,
      duration: video.duration,
      resolution: video.resolution,
    });

    return sensitivityResult;
  } catch (error) {
    console.error("Video analysis error:", error);

    // Update video status to failed
    await Video.findByIdAndUpdate(videoId, {
      processingStatus: "failed",
      currentStage: "Failed",
    });

    // Emit error
    emitProcessingError(userId, videoId, error);

    throw error;
  }
};

/**
 * Process a stage with progress updates
 */
const processStage = async (
  video,
  userId,
  { stageName, startProgress, endProgress, duration }
) => {
  const steps = 5;
  const stepDuration = duration / steps;
  const progressIncrement = (endProgress - startProgress) / steps;

  video.currentStage = stageName;
  await video.save();

  for (let i = 0; i <= steps; i++) {
    const progress = Math.round(startProgress + progressIncrement * i);

    emitProcessingProgress(userId, video._id.toString(), {
      stage: stageName,
      progress,
      message: `${stageName}... ${progress}%`,
    });

    video.processingProgress = progress;
    await video.save();

    if (i < steps) {
      await delay(stepDuration);
    }
  }
};

/**
 * Extract video metadata using FFmpeg
 */
const extractMetadata = async (video, userId) => {
  return new Promise(async (resolve) => {
    video.currentStage = "Extracting video metadata";
    video.processingProgress = 25;
    await video.save();

    emitProcessingProgress(userId, video._id.toString(), {
      stage: "Extracting video metadata",
      progress: 25,
      message: "Reading video information...",
    });

    // Try to get actual metadata using FFmpeg
    ffmpeg.ffprobe(video.path, async (err, metadata) => {
      let result = { duration: null, resolution: null };

      if (!err && metadata && metadata.format) {
        result.duration = Math.round(metadata.format.duration || 0);

        const videoStream = metadata.streams.find(
          (s) => s.codec_type === "video"
        );
        if (videoStream) {
          result.resolution = {
            width: videoStream.width || null,
            height: videoStream.height || null,
          };
        }
      } else {
        // Fallback: Generate random metadata for demo
        result.duration = Math.floor(Math.random() * 600) + 30; // 30s to 10min
        result.resolution = {
          width: [1280, 1920, 3840][Math.floor(Math.random() * 3)],
          height: [720, 1080, 2160][Math.floor(Math.random() * 3)],
        };
      }

      // Simulate processing time
      await delay(1500);

      video.processingProgress = 40;
      await video.save();

      emitProcessingProgress(userId, video._id.toString(), {
        stage: "Extracting video metadata",
        progress: 40,
        message: "Metadata extraction complete",
      });

      resolve(result);
    });
  });
};

/**
 * Determine video sensitivity based on filename and content analysis
 * This is a simulated analysis for demonstration purposes
 */
const determineSensitivity = (originalName, title, fileSize) => {
  const combinedText = `${originalName} ${title}`.toLowerCase();
  const reasons = [];
  let isFlagged = false;

  // Check for flagged keywords in filename/title
  for (const keyword of FLAG_KEYWORDS) {
    if (combinedText.includes(keyword)) {
      isFlagged = true;
      reasons.push(`Content may contain: ${keyword}`);
    }
  }

  // Random flagging for demo variety (10% chance if not already flagged)
  if (!isFlagged && Math.random() < 0.1) {
    isFlagged = true;
    reasons.push("Automated content analysis detected potential concerns");
  }

  // Large files have higher chance of flagging (for demo)
  if (!isFlagged && fileSize > 100 * 1024 * 1024 && Math.random() < 0.25) {
    isFlagged = true;
    reasons.push("Extended content requires additional review");
  }

  // Generate confidence score
  const confidence = isFlagged
    ? 0.75 + Math.random() * 0.2 // 0.75-0.95 for flagged
    : 0.85 + Math.random() * 0.14; // 0.85-0.99 for safe

  return {
    status: isFlagged ? "flagged" : "safe",
    confidence: Math.round(confidence * 100) / 100,
    reasons:
      reasons.length > 0 ? reasons : ["Content passed all safety checks"],
    analyzedAt: new Date(),
  };
};

module.exports = {
  analyzeVideo,
  determineSensitivity,
};
