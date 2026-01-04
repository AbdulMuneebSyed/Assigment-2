import { useSocket } from "../context/SocketContext";
import ProgressBar from "./ProgressBar";
import { CheckCircle, AlertTriangle, X } from "lucide-react";

const ProcessingStatus = () => {
  const { processingVideos, removeProcessingVideo } = useSocket();
  const processingList = Object.values(processingVideos).filter(
    (v) => !v?.toastHidden
  );

  if (processingList.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-96 max-w-[calc(100vw-2rem)] space-y-3">
      {processingList.map((video) => (
        <div
          key={video.videoId}
          className={`card-brutal-sm animate-slide-up ${
            video.state === "completed"
              ? video.status === "flagged"
                ? "border-brutal-red"
                : "border-brutal-lime"
              : video.state === "error"
              ? "border-brutal-red"
              : ""
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm truncate">
                {video.title || "Processing Video"}
              </h4>
              <p className="text-xs text-gray-500 uppercase">
                {video.state === "completed" ? (
                  <span
                    className={`flex items-center gap-1 ${
                      video.status === "flagged"
                        ? "text-brutal-red"
                        : "text-brutal-lime"
                    }`}
                  >
                    {video.status === "flagged" ? (
                      <AlertTriangle size={12} />
                    ) : (
                      <CheckCircle size={12} />
                    )}
                    {video.status === "safe"
                      ? "Safe"
                      : video.status === "flagged"
                      ? "Flagged"
                      : "Complete"}{" "}
                    - Complete
                  </span>
                ) : video.state === "error" ? (
                  <span className="flex items-center gap-1 text-brutal-red">
                    <AlertTriangle size={12} />
                    Processing Failed
                  </span>
                ) : (
                  video.stage || "Starting..."
                )}
              </p>
            </div>
            <button
              onClick={() => removeProcessingVideo(video.videoId)}
              className="p-1 hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {video.state !== "error" && (
            <ProgressBar
              progress={video.progress || 0}
              showPercentage={true}
              size="small"
              color={video.state === "completed" ? "lime" : "yellow"}
              animated={video.state !== "completed"}
            />
          )}

          {video.state === "completed" && Number.isFinite(video.confidence) && (
            <div className="mt-2 text-xs">
              <span
                className={`font-bold ${
                  video.status === "flagged"
                    ? "text-brutal-red"
                    : "text-brutal-lime"
                }`}
              >
                Confidence: {Math.round(video.confidence * 100)}%
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProcessingStatus;
