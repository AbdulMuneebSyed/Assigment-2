const jwt = require("jsonwebtoken");
const User = require("../models/User");
const cacheService = require("../services/cacheService");
const { TTL } = require("../config/redis");
const { generateUserKey } = require("./cache");

/**
 * Protect routes - Verify JWT token
 */
const protect = async (req, res, next) => {
  let token;
  console.log("Protect middleware invoked");
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try to get user from cache first
    const cacheKey = generateUserKey(decoded.id);
    let user = await cacheService.get(cacheKey);

    if (!user) {
      // Cache miss - fetch from database
      user = await User.findById(decoded.id).select("-password");

      if (user) {
        // Store in cache for future requests
        await cacheService.set(cacheKey, user.toObject(), TTL.USER_PROFILE);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

/**
 * Protect stream routes - accepts JWT via query string OR Authorization header.
 * Required because <video> elements cannot send custom headers.
 */
const protectStream = async (req, res, next) => {
  let token;

  // Check Authorization header first
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // Fall back to query string token (for <video> src requests)
  else if (req.query && typeof req.query.token === "string") {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try to get user from cache first
    const cacheKey = generateUserKey(decoded.id);
    let user = await cacheService.get(cacheKey);

    if (!user) {
      // Cache miss - fetch from database
      user = await User.findById(decoded.id).select("-password");

      if (user) {
        // Store in cache for future requests
        await cacheService.set(cacheKey, user.toObject(), TTL.USER_PROFILE);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

/**
 * Role-based access control middleware
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

/**
 * Check if user owns the resource or is admin
 */
const ownerOrAdmin = (resourceUserIdField = "owner") => {
  return (req, res, next) => {
    // Admin can access everything
    if (req.user.role === "admin") {
      return next();
    }

    // For resources attached to req (like after fetching a video)
    if (req.resource && req.resource[resourceUserIdField]) {
      if (
        req.resource[resourceUserIdField].toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access this resource",
        });
      }
    }

    next();
  };
};

module.exports = { protect, protectStream, authorize, ownerOrAdmin };
