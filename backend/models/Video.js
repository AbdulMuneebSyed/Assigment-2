const mongoose = require("mongoose");

const sensitivityResultSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["safe", "flagged"],
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    reasons: [
      {
        type: String,
      },
    ],
    analyzedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a video title"],
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot be more than 2000 characters"],
      default: "",
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number, // in seconds
      default: null,
    },
    resolution: {
      width: { type: Number, default: null },
      height: { type: Number, default: null },
    },
    thumbnail: {
      type: String,
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organization: {
      type: String,
      default: "default",
    },
    processingStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    processingProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    currentStage: {
      type: String,
      default: null,
    },
    sensitivityResult: {
      type: sensitivityResultSchema,
      default: null,
    },
    category: {
      type: String,
      trim: true,
      default: "uncategorized",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
videoSchema.index({ owner: 1, createdAt: -1 });
videoSchema.index({ organization: 1 });
videoSchema.index({ processingStatus: 1 });
videoSchema.index({ "sensitivityResult.status": 1 });

// Virtual for formatted file size
videoSchema.virtual("formattedSize").get(function () {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (this.size === 0) return "0 Bytes";
  const i = parseInt(Math.floor(Math.log(this.size) / Math.log(1024)), 10);
  return `${(this.size / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
});

// Virtual for formatted duration
videoSchema.virtual("formattedDuration").get(function () {
  if (!this.duration) return null;
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = Math.floor(this.duration % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
});

// Ensure virtuals are included in JSON output
videoSchema.set("toJSON", { virtuals: true });
videoSchema.set("toObject", { virtuals: true });

// Increment view count
videoSchema.methods.incrementViews = async function () {
  this.views += 1;
  await this.save({ validateBeforeSave: false });
};

const Video = mongoose.model("Video", videoSchema);

module.exports = Video;
