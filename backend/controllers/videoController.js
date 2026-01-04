const Video = require("../models/Video");
const { analyzeVideo } = require("../services/sensitivityAnalyzer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

/**
 * @desc    Upload a new video
 * @route   POST /api/videos/upload
 * @access  Private (Editor, Admin)
 */
const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a video file",
      });
    }

    const { title, description, category, tags } = req.body;

    // Create video record
    const video = await Video.create({
      title: title || req.file.originalname.replace(/\.[^/.]+$/, ""),
      description: description || "",
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      owner: req.user._id,
      organization: req.user.organization,
      category: category || "uncategorized",
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      processingStatus: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Video uploaded successfully. Processing will begin shortly.",
      data: { video },
    });

    // Start async processing (don't await - let it run in background)
    setImmediate(() => {
      analyzeVideo(video._id.toString(), req.user._id.toString()).catch((err) =>
        console.error("Background processing error:", err)
      );
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
};

/**
 * @desc    Get all videos for current user
 * @route   GET /api/videos
 * @access  Private
 */
const getVideos = async (req, res, next) => {
  try {
    const {
      status,
      sensitivityStatus,
      category,
      fromDate,
      toDate,
      minSize,
      maxSize,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 12,
    } = req.query;

    // Build query
    const query = {};

    // User isolation - viewers/editors see only their own videos
    if (req.user.role === "admin") {
      // Admin can optionally filter by owner
      if (req.query.owner) {
        query.owner = req.query.owner;
      }
    } else {
      query.owner = req.user._id;
    }

    // Filter by processing status
    if (status) {
      query.processingStatus = status;
    }

    // Filter by sensitivity status
    if (sensitivityStatus) {
      query["sensitivityResult.status"] = sensitivityStatus;
    }

    // Filter by category
    if (category && category !== "all") {
      query.category = category;
    }

    // Date range filter
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    // Size range filter
    if (minSize || maxSize) {
      query.size = {};
      if (minSize) query.size.$gte = parseInt(minSize);
      if (maxSize) query.size.$lte = parseInt(maxSize);
    }

    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { originalName: { $regex: search, $options: "i" } },
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const videos = await Video.find(query)
      .populate("owner", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Video.countDocuments(query);

    // Get stats
    const stats = await Video.aggregate([
      { $match: { owner: req.user._id } },
      {
        $group: {
          _id: null,
          totalVideos: { $sum: 1 },
          safeVideos: {
            $sum: {
              $cond: [{ $eq: ["$sensitivityResult.status", "safe"] }, 1, 0],
            },
          },
          flaggedVideos: {
            $sum: {
              $cond: [{ $eq: ["$sensitivityResult.status", "flagged"] }, 1, 0],
            },
          },
          processingVideos: {
            $sum: {
              $cond: [
                { $in: ["$processingStatus", ["pending", "processing"]] },
                1,
                0,
              ],
            },
          },
          totalSize: { $sum: "$size" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        videos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
        stats: stats[0] || {
          totalVideos: 0,
          safeVideos: 0,
          flaggedVideos: 0,
          processingVideos: 0,
          totalSize: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single video by ID
 * @route   GET /api/videos/:id
 * @access  Private
 */
const getVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id).populate(
      "owner",
      "name email"
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Check ownership (unless admin)
    if (
      req.user.role !== "admin" &&
      video.owner._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this video",
      });
    }

    res.status(200).json({
      success: true,
      data: { video },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Stream video with range request support
 * @route   GET /api/videos/stream/:id
 * @access  Private
 */
const streamVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Check ownership (unless admin)
    if (
      req.user.role !== "admin" &&
      video.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this video",
      });
    }

    // Check if file exists
    if (!fs.existsSync(video.path)) {
      return res.status(404).json({
        success: false,
        message: "Video file not found",
      });
    }

    const stat = fs.statSync(video.path);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const file = fs.createReadStream(video.path, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": video.mimeType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Range",
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // No range header - send entire file
      const head = {
        "Content-Length": fileSize,
        "Content-Type": video.mimeType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      };

      res.writeHead(200, head);
      fs.createReadStream(video.path).pipe(res);
    }

    // Increment view count (async, don't wait)
    video.incrementViews().catch(() => {});
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update video metadata
 * @route   PUT /api/videos/:id
 * @access  Private (Editor, Admin)
 */
const updateVideo = async (req, res, next) => {
  try {
    let video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Check ownership (unless admin)
    if (
      req.user.role !== "admin" &&
      video.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this video",
      });
    }

    const { title, description, category, tags, isPublic } = req.body;

    const updateFields = {};
    if (title) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (category) updateFields.category = category;
    if (tags) updateFields.tags = tags.split(",").map((t) => t.trim());
    if (isPublic !== undefined) updateFields.isPublic = isPublic;

    video = await Video.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    }).populate("owner", "name email");

    res.status(200).json({
      success: true,
      message: "Video updated successfully",
      data: { video },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete video
 * @route   DELETE /api/videos/:id
 * @access  Private (Editor, Admin)
 */
const deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Check ownership (unless admin)
    if (
      req.user.role !== "admin" &&
      video.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this video",
      });
    }

    // Delete file from storage
    if (fs.existsSync(video.path)) {
      fs.unlinkSync(video.path);
    }

    // Delete thumbnail if exists
    if (video.thumbnail && fs.existsSync(video.thumbnail)) {
      fs.unlinkSync(video.thumbnail);
    }

    await video.deleteOne();

    res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reprocess video (retry sensitivity analysis)
 * @route   POST /api/videos/:id/reprocess
 * @access  Private (Editor, Admin)
 */
const reprocessVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Check ownership
    if (
      req.user.role !== "admin" &&
      video.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Reset processing status
    video.processingStatus = "pending";
    video.processingProgress = 0;
    video.currentStage = null;
    video.sensitivityResult = null;
    await video.save();

    res.status(200).json({
      success: true,
      message: "Video reprocessing started",
    });

    // Start processing
    setImmediate(() => {
      analyzeVideo(video._id.toString(), req.user._id.toString()).catch((err) =>
        console.error("Reprocessing error:", err)
      );
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadVideo,
  getVideos,
  getVideo,
  streamVideo,
  updateVideo,
  deleteVideo,
  reprocessVideo,
};
