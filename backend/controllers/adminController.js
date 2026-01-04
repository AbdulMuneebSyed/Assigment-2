const User = require("../models/User");
const Video = require("../models/Video");

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Get video counts for each user
    const userIds = users.map((u) => u._id);
    const videoCounts = await Video.aggregate([
      { $match: { owner: { $in: userIds } } },
      { $group: { _id: "$owner", count: { $sum: 1 } } },
    ]);

    const videoCountMap = videoCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const usersWithStats = users.map((user) => ({
      ...user.toObject(),
      videoCount: videoCountMap[user._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin only)
 */
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's video stats
    const videoStats = await Video.aggregate([
      { $match: { owner: user._id } },
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
          totalSize: { $sum: "$size" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        user,
        stats: videoStats[0] || {
          totalVideos: 0,
          safeVideos: 0,
          flaggedVideos: 0,
          totalSize: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private (Admin only)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!["viewer", "editor", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be viewer, editor, or admin",
      });
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle user active status
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private (Admin only)
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    // Prevent admin from deactivating themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin only)
 */
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Optional: Delete all user's videos
    // await Video.deleteMany({ owner: user._id });

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get system statistics
 * @route   GET /api/admin/stats
 * @access  Private (Admin only)
 */
const getSystemStats = async (req, res, next) => {
  try {
    // User stats
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    // Video stats
    const videoStats = await Video.aggregate([
      {
        $group: {
          _id: null,
          totalVideos: { $sum: 1 },
          totalSize: { $sum: "$size" },
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
          pendingVideos: {
            $sum: { $cond: [{ $eq: ["$processingStatus", "pending"] }, 1, 0] },
          },
          processingVideos: {
            $sum: {
              $cond: [{ $eq: ["$processingStatus", "processing"] }, 1, 0],
            },
          },
          failedVideos: {
            $sum: { $cond: [{ $eq: ["$processingStatus", "failed"] }, 1, 0] },
          },
        },
      },
    ]);

    // Recent uploads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUploads = await Video.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    res.status(200).json({
      success: true,
      data: {
        users: userStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          acc.total = (acc.total || 0) + curr.count;
          return acc;
        }, {}),
        videos: videoStats[0] || {
          totalVideos: 0,
          totalSize: 0,
          safeVideos: 0,
          flaggedVideos: 0,
          pendingVideos: 0,
          processingVideos: 0,
          failedVideos: 0,
        },
        recentUploads,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getSystemStats,
};
