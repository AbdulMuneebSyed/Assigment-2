import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import processingReducer from "./slices/processingSlice";
import videoReducer from "./slices/videoSlice";
import {
  updateProcessingComplete,
  hideProcessingToast,
} from "./slices/processingSlice";

const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  actionCreator: updateProcessingComplete,
  effect: async (action, listenerApi) => {
    const videoId = action.payload?.videoId;
    if (!videoId) return;

    // Auto-remove completed toasts after 5 seconds.
    await listenerApi.delay(5000);
    listenerApi.dispatch(hideProcessingToast({ videoId }));
  },
});

export const store = configureStore({
  reducer: {
    processing: processingReducer,
    video: videoReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});

export default store;
