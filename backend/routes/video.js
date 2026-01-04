const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { protect, protectStream, authorize } = require("../middleware/auth");
const {
  uploadVideo,
  getVideos,
  getVideo,
  streamVideo,
  updateVideo,
  deleteVideo,
  reprocessVideo,
} = require("../controllers/videoController");

// Multer configuration for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept video files only
  const allowedTypes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only video files are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024, // 500MB default
  },
});

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size too large. Maximum size is 500MB",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

// Routes

// Get all videos (with filtering)
router.get("/", protect, getVideos);

// Upload a new video (editors and admins only)
router.post(
  "/upload",
  protect,
  authorize("editor", "admin"),
  upload.single("video"),
  handleMulterError,
  uploadVideo
);

// Stream video (uses protectStream to accept token via query string for <video> elements)
router.get("/stream/:id", protectStream, streamVideo);

// Get single video
router.get("/:id", protect, getVideo);

// Update video metadata (editors and admins only)
router.put("/:id", protect, authorize("editor", "admin"), updateVideo);

// Delete video (editors and admins only)
router.delete("/:id", protect, authorize("editor", "admin"), deleteVideo);

// Reprocess video (retry sensitivity analysis)
router.post(
  "/:id/reprocess",
  protect,
  authorize("editor", "admin"),
  reprocessVideo
);

module.exports = router;
