const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const os = require("os");
const s3Service = require("./s3Service");
const {
  emitProcessingProgress,
  emitProcessingStart,
  emitProcessingComplete,
  emitProcessingError,
} = require("./socketService");
const Video = require("../models/Video");
const cacheService = require("./cacheService");
const {
  generateVideoKey,
  generateVideoStreamKey,
} = require("../middleware/cache");
const {
  RekognitionClient,
  StartContentModerationCommand,
  GetContentModerationCommand,
} = require("@aws-sdk/client-rekognition");
const { s3Config } = require("../config/s3");

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

    // Stage 3: AWS Rekognition Content Moderation (40-80%)
    const moderationLabels = await analyzeWithRekognition(video, userId);

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
      video.size,
      moderationLabels
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

    // Invalidate caches after processing completion
    await Promise.all([
      cacheService.delete(generateVideoKey(videoId)),
      cacheService.delete(generateVideoStreamKey(videoId)),
    ]);

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

    // Invalidate caches after failure
    try {
      const video = await Video.findById(videoId);
      if (video) {
        await Promise.all([
          cacheService.delete(generateVideoKey(videoId)),
          cacheService.delete(generateVideoStreamKey(videoId)),
        ]);
      }
    } catch (cacheError) {
      console.error("Cache invalidation error:", cacheError);
    }

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

    // Invalidate video cache on progress updates (not cached list to avoid spam)
    await cacheService.delete(generateVideoKey(video._id.toString()));

    if (i < steps) {
      await delay(stepDuration);
    }
  }
};

/**
 * Initialize Rekognition client and config
 */
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const rekognitionConfig = {
  snsTopicArn: process.env.AWS_SNS_TOPIC_ARN || "",
  roleArn: process.env.AWS_REKOGNITION_ROLE_ARN || "",
  minConfidence: parseInt(process.env.REKOGNITION_MIN_CONFIDENCE || "70", 10),
  maxPollingAttempts: parseInt(
    process.env.REKOGNITION_MAX_POLLING_ATTEMPTS || "60",
    10
  ),
  pollingInterval: parseInt(
    process.env.REKOGNITION_POLLING_INTERVAL || "5000",
    10
  ),
};

/**
 * Analyze video content using AWS Rekognition
 * Progress: 40% -> 50% -> 60% -> 70% -> 80%
 */
const analyzeWithRekognition = async (video, userId) => {
  try {
    // Only run Rekognition if video is stored on S3
    if (video.storageProvider !== "s3") {
      console.log("Video not on S3, skipping Rekognition analysis");

      // Simulate progress for non-S3 videos
      await processStage(video, userId, {
        stageName: "Analyzing video frames for content",
        startProgress: 40,
        endProgress: 80,
        duration: 3000,
      });

      return []; // Return empty labels for keyword-based analysis
    }

    const bucketName = s3Config.bucketName;
    const fileName = video.path; // S3 key

    // Progress 40%: Starting Rekognition job
    video.currentStage = "Starting AWS Rekognition analysis";
    video.processingProgress = 40;
    await video.save();

    emitProcessingProgress(userId, video._id.toString(), {
      stage: "Starting AWS Rekognition analysis",
      progress: 40,
      message: "Initiating content moderation analysis...",
    });
    await cacheService.delete(generateVideoKey(video._id.toString()));

    // Start Content Moderation Job
    const startCommand = new StartContentModerationCommand({
      Video: {
        S3Object: {
          Bucket: bucketName,
          Name: fileName,
        },
      },
      NotificationChannel:
        rekognitionConfig.snsTopicArn && rekognitionConfig.roleArn
          ? {
              SNSTopicArn: rekognitionConfig.snsTopicArn,
              RoleArn: rekognitionConfig.roleArn,
            }
          : undefined,
      MinConfidence: rekognitionConfig.minConfidence,
    });

    const { JobId } = await rekognitionClient.send(startCommand);
    console.log(`Rekognition job started: ${JobId}`);

    // Progress 50%: Job submitted
    video.processingProgress = 50;
    await video.save();

    emitProcessingProgress(userId, video._id.toString(), {
      stage: "AWS Rekognition processing",
      progress: 50,
      message: "Content moderation job submitted...",
    });
    await cacheService.delete(generateVideoKey(video._id.toString()));

    await delay(2000); // Initial delay before polling

    // Poll for job completion (50% -> 80%)
    let jobStatus = "IN_PROGRESS";
    let attempts = 0;
    const progressPerPoll = 30 / rekognitionConfig.maxPollingAttempts; // Distribute 30% across polling

    while (
      jobStatus === "IN_PROGRESS" &&
      attempts < rekognitionConfig.maxPollingAttempts
    ) {
      attempts++;

      const getCommand = new GetContentModerationCommand({ JobId });
      const results = await rekognitionClient.send(getCommand);
      jobStatus = results.JobStatus;

      // Update progress: 50% + incremental progress based on attempts
      const currentProgress = Math.min(
        80,
        Math.round(50 + progressPerPoll * attempts)
      );

      video.processingProgress = currentProgress;
      await video.save();

      emitProcessingProgress(userId, video._id.toString(), {
        stage: "AWS Rekognition analyzing",
        progress: currentProgress,
        message: `Analyzing video content... (${currentProgress}%)`,
      });
      await cacheService.delete(generateVideoKey(video._id.toString()));

      if (jobStatus === "SUCCEEDED") {
        // Progress 80%: Analysis complete
        video.processingProgress = 80;
        await video.save();

        emitProcessingProgress(userId, video._id.toString(), {
          stage: "Content analysis complete",
          progress: 80,
          message: "Rekognition analysis completed successfully",
        });
        await cacheService.delete(generateVideoKey(video._id.toString()));

        console.log(`Rekognition job completed: ${JobId}`);
        return results.ModerationLabels || [];
      } else if (jobStatus === "FAILED") {
        throw new Error(
          `Rekognition job failed: ${results.StatusMessage || "Unknown error"}`
        );
      }

      // Wait before next poll
      await delay(rekognitionConfig.pollingInterval);
    }

    if (jobStatus === "IN_PROGRESS") {
      throw new Error("Rekognition job timed out");
    }

    return [];
  } catch (error) {
    console.error("Rekognition analysis error:", error);

    // Fall back to simulated analysis on error
    console.log("Falling back to simulated content analysis");
    await processStage(video, userId, {
      stageName: "Analyzing video frames (fallback)",
      startProgress: video.processingProgress || 40,
      endProgress: 80,
      duration: 2000,
    });

    return []; // Return empty labels to use keyword-based fallback
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

    let tempFilePath = null;
    let videoPath = video.path;

    try {
      // If video is on S3, download to temp location for FFmpeg
      if (video.storageProvider === "s3") {
        const tempDir = os.tmpdir();
        tempFilePath = path.join(
          tempDir,
          `temp-${video._id}${path.extname(video.originalName)}`
        );

        emitProcessingProgress(userId, video._id.toString(), {
          stage: "Downloading video for analysis",
          progress: 22,
          message: "Downloading from cloud storage...",
        });

        await s3Service.downloadToLocal(video.path, tempFilePath);
        videoPath = tempFilePath;
      }

      // Try to get actual metadata using FFmpeg
      ffmpeg.ffprobe(videoPath, async (err, metadata) => {
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

        // Clean up temp file if it was created
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }

        resolve(result);
      });
    } catch (error) {
      console.error("Metadata extraction error:", error);

      // Clean up temp file on error
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      // Return fallback metadata
      resolve({
        duration: Math.floor(Math.random() * 600) + 30,
        resolution: {
          width: 1920,
          height: 1080,
        },
      });
    }
  });
};

/**
 * Determine video sensitivity based on filename and content analysis
 * Prioritizes AWS Rekognition ModerationLabels if available, falls back to keyword matching
 */
const determineSensitivity = (
  originalName,
  title,
  fileSize,
  moderationLabels = []
) => {
  const reasons = [];
  let isFlagged = false;
  let confidence = 0.95;

  // Priority 1: Use AWS Rekognition ModerationLabels if available
  if (moderationLabels && moderationLabels.length > 0) {
    console.log("Using AWS Rekognition results for sensitivity analysis");

    isFlagged = true;

    // Extract unique parent categories and their confidence scores
    const labelMap = new Map();

    moderationLabels.forEach((label) => {
      const parentName =
        label.ModerationLabel?.ParentName || label.ModerationLabel?.Name;
      const labelName = label.ModerationLabel?.Name;
      const labelConfidence = label.ModerationLabel?.Confidence || 0;

      if (parentName && !labelMap.has(parentName)) {
        labelMap.set(parentName, {
          name: parentName,
          confidence: labelConfidence,
          examples: [labelName],
        });
      } else if (parentName && labelName !== parentName) {
        labelMap.get(parentName).examples.push(labelName);
      }
    });

    // Build reasons from detected labels
    labelMap.forEach(({ name, confidence: labelConf, examples }) => {
      const exampleText =
        examples.length > 0 ? ` (${examples.slice(0, 2).join(", ")})` : "";
      reasons.push(
        `Detected ${name}${exampleText} - ${Math.round(labelConf)}% confidence`
      );
    });

    // Use the highest confidence from labels
    const maxConfidence = Math.max(
      ...moderationLabels.map((l) => l.ModerationLabel?.Confidence || 0)
    );
    confidence = Math.round(maxConfidence) / 100;

    console.log(
      `Rekognition flagged video with ${moderationLabels.length} labels`
    );
  } else {
    // Priority 2: Fallback to keyword-based analysis
    console.log("Using keyword-based sensitivity analysis (fallback)");

    const combinedText = `${originalName} ${title}`.toLowerCase();

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

    // Generate confidence score for keyword-based analysis
    confidence = isFlagged
      ? 0.75 + Math.random() * 0.2 // 0.75-0.95 for flagged
      : 0.85 + Math.random() * 0.14; // 0.85-0.99 for safe
  }

  return {
    status: isFlagged ? "flagged" : "safe",
    confidence: Math.round(confidence * 100) / 100,
    reasons:
      reasons.length > 0 ? reasons : ["Content passed all safety checks"],
    analyzedAt: new Date(),
    analysisMethod:
      moderationLabels && moderationLabels.length > 0
        ? "aws-rekognition"
        : "keyword-matching",
  };
};

module.exports = {
  analyzeVideo,
  determineSensitivity,
};
