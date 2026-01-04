import { useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useAuth } from "../context/AuthContext";
import {
  updateProcessingStart,
  updateProcessingProgress,
  updateProcessingComplete,
  updateProcessingError,
} from "../store/slices/processingSlice";
import { triggerVideoRefresh } from "../store/slices/videoSlice";
import { connectSocket, disconnectSocket } from "../services/socket";

export const useSocketListener = () => {
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();

  const log = useCallback((...args) => {
    console.log("[socket]", ...args);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem("token");
      if (token) {
        const socket = connectSocket(token);

        const handleStart = (data) => {
          log("video:processing:start", data);
          dispatch(
            updateProcessingStart({
              videoId: data.videoId,
              title: data.title,
            })
          );
        };

        const handleProgress = (data) => {
          log("video:processing:progress", data);
          dispatch(
            updateProcessingProgress({
              videoId: data.videoId,
              stage: data.stage,
              progress: data.progress,
              message: data.message,
            })
          );
        };

        const handleComplete = (data) => {
          log("video:processing:complete", data);
          dispatch(
            updateProcessingComplete({
              videoId: data.videoId,
              status: data.status,
              confidence: data.confidence,
              reasons: data.reasons,
              duration: data.duration,
              resolution: data.resolution,
            })
          );
          // Trigger refetch after a small delay to let backend persist
          setTimeout(() => {
            dispatch(triggerVideoRefresh());
          }, 300);
        };

        const handleError = (data) => {
          log("video:processing:error", data);
          dispatch(
            updateProcessingError({
              videoId: data.videoId,
              error: data.error,
            })
          );
          // Trigger refetch after a small delay
          setTimeout(() => {
            dispatch(triggerVideoRefresh());
          }, 300);
        };

        socket.on("connect", () => {
          log("connected", { id: socket.id });
        });

        socket.on("disconnect", (reason) => {
          log("disconnected", { reason });
        });

        socket.on("connect_error", (error) => {
          log("connect_error", { message: error?.message });
        });

        socket.on("video:processing:start", handleStart);
        socket.on("video:processing:progress", handleProgress);
        socket.on("video:processing:complete", handleComplete);
        socket.on("video:processing:error", handleError);

        if (socket.connected) {
          log("connected (already)", { id: socket.id });
        }

        return () => {
          try {
            socket.off("video:processing:start", handleStart);
            socket.off("video:processing:progress", handleProgress);
            socket.off("video:processing:complete", handleComplete);
            socket.off("video:processing:error", handleError);
          } finally {
            disconnectSocket();
          }
        };
      }
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, dispatch, log]);
};

export default useSocketListener;
