import { createSlice } from "@reduxjs/toolkit";

const videoSlice = createSlice({
  name: "video",
  initialState: {
    shouldRefresh: false, // Trigger for Library/Dashboard to refetch
    lastUpdatedAt: null,
  },
  reducers: {
    triggerVideoRefresh: (state, action) => {
      state.shouldRefresh = true;
      state.lastUpdatedAt = Date.now();
    },

    clearRefreshTrigger: (state) => {
      state.shouldRefresh = false;
    },
  },
});

export const { triggerVideoRefresh, clearRefreshTrigger } = videoSlice.actions;
export default videoSlice.reducer;
