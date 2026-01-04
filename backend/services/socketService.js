const jwt = require("jsonwebtoken");

let io = null;

/**
 * Initialize Socket.io with authentication
 */
const initializeSocket = (socketIO) => {
  io = socketIO;

  // Authentication middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user to their personal room for targeted updates
    socket.join(`user:${socket.userId}`);

    // Join role-based room
    socket.join(`role:${socket.userRole}`);

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};

/**
 * Get the Socket.io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

/**
 * Emit video processing progress to specific user
 */
const emitProcessingProgress = (userId, videoId, data) => {
  if (io) {
    io.to(`user:${userId}`).emit("video:processing:progress", {
      videoId,
      ...data,
    });
  }
};

/**
 * Emit video processing start event
 */
const emitProcessingStart = (userId, videoId, videoTitle) => {
  if (io) {
    io.to(`user:${userId}`).emit("video:processing:start", {
      videoId,
      title: videoTitle,
      message: "Processing started",
    });
  }
};

/**
 * Emit video processing complete event
 */
const emitProcessingComplete = (userId, videoId, result) => {
  if (io) {
    io.to(`user:${userId}`).emit("video:processing:complete", {
      videoId,
      ...result,
    });
  }
};

/**
 * Emit video processing error event
 */
const emitProcessingError = (userId, videoId, error) => {
  if (io) {
    io.to(`user:${userId}`).emit("video:processing:error", {
      videoId,
      error: error.message || "Processing failed",
    });
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitProcessingProgress,
  emitProcessingStart,
  emitProcessingComplete,
  emitProcessingError,
};
