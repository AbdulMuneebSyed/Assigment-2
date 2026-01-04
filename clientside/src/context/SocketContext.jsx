/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  removeProcessingVideo,
  addProcessingVideo,
} from "../store/slices/processingSlice";

const SocketContext = createContext(null);

export const useSocket = () => {
  const processingVideos = useSelector((state) => state.processing.videos);
  const shouldRefresh = useSelector((state) => state.video.shouldRefresh);
  const dispatch = useDispatch();

  const removeVideo = useCallback(
    (videoId) => {
      dispatch(removeProcessingVideo({ videoId }));
    },
    [dispatch]
  );

  const addVideo = useCallback(
    (videoId, title) => {
      dispatch(addProcessingVideo({ videoId, title }));
    },
    [dispatch]
  );

  return {
    processingVideos,
    removeProcessingVideo: removeVideo,
    addProcessingVideo: addVideo,
    shouldRefresh,
  };
};

export const SocketProvider = ({ children }) => {
  return (
    <SocketContext.Provider value={null}>{children}</SocketContext.Provider>
  );
};

export default SocketContext;
