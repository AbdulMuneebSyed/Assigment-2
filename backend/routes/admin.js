const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getUsers,
  getUser,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getSystemStats,
} = require("../controllers/adminController");

// All routes require admin authentication
router.use(protect);
router.use(authorize("admin"));

// System statistics
router.get("/stats", getSystemStats);

// User management routes
router.get("/users", getUsers);
router.get("/users/:id", getUser);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", toggleUserStatus);
router.delete("/users/:id", deleteUser);

module.exports = router;
