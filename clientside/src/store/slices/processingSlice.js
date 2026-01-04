import { createSlice } from "@reduxjs/toolkit";

const processingSlice = createSlice({
  name: "processing",
  initialState: {
    videos: {}, // { videoId: { videoId, title, progress, state, status, confidence, ... } }
  },
  reducers: {
    addProcessingVideo: (state, action) => {
      const { videoId, title } = action.payload;
      state.videos[videoId] = {
        videoId,
        title,
        progress: 0,
        state: "pending",
        stage: "Queued for processing",
        toastHidden: false,
      };
    },

    updateProcessingStart: (state, action) => {
      const { videoId, title } = action.payload;
      if (state.videos[videoId]) {
        state.videos[videoId].state = "processing";
        state.videos[videoId].progress = 0;
        state.videos[videoId].stage = "Starting...";
        state.videos[videoId].toastHidden = false;
      } else {
        state.videos[videoId] = {
          videoId,
          title: title || "Processing Video",
          progress: 0,
          state: "processing",
          stage: "Starting...",
          toastHidden: false,
        };
      }
    },

    updateProcessingProgress: (state, action) => {
      const { videoId, stage, progress, message } = action.payload;
      if (state.videos[videoId]) {
        state.videos[videoId].state = "processing";
        if (Number.isFinite(progress)) {
          state.videos[videoId].progress = progress;
        }
        state.videos[videoId].stage = stage || state.videos[videoId].stage;
        state.videos[videoId].message = message;
        state.videos[videoId].toastHidden = false;
      }
    },

    updateProcessingComplete: (state, action) => {
      const { videoId, status, confidence, reasons, duration, resolution } =
        action.payload;
      if (state.videos[videoId]) {
        state.videos[videoId].state = "completed";
        state.videos[videoId].progress = 100;
        state.videos[videoId].status = status;
        state.videos[videoId].confidence = confidence;
        state.videos[videoId].reasons = reasons;
        state.videos[videoId].duration = duration;
        state.videos[videoId].resolution = resolution;
        state.videos[videoId].toastHidden = false;
      }
    },

    updateProcessingError: (state, action) => {
      const { videoId, error } = action.payload;
      if (state.videos[videoId]) {
        state.videos[videoId].state = "error";
        state.videos[videoId].error = error;
        state.videos[videoId].toastHidden = false;
      }
    },

    hideProcessingToast: (state, action) => {
      const { videoId } = action.payload;
      if (state.videos[videoId]) {
        state.videos[videoId].toastHidden = true;
      }
    },

    removeProcessingVideo: (state, action) => {
      const { videoId } = action.payload;
      delete state.videos[videoId];
    },
  },
});

export const {
  addProcessingVideo,
  updateProcessingStart,
  updateProcessingProgress,
  updateProcessingComplete,
  updateProcessingError,
  hideProcessingToast,
  removeProcessingVideo,
} = processingSlice.actions;

export default processingSlice.reducer;
