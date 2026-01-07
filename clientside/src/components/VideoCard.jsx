import { Link } from "react-router-dom";
import { useMemo } from "react";
import {
  Play,
  Clock,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  Loader,
  Trash2,
  RefreshCw,
  Film,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { useSocket } from "../context/SocketContext";

const VideoCard = ({ video, onDelete, onReprocess, showActions = true, currentUserId, isAdmin = false }) => {
  const { processingVideos } = useSocket();
  const {
    _id,
    title,
    originalName,
    size,
    duration,
    processingStatus,
    sensitivityResult,
    createdAt,
    formattedSize,
    formattedDuration,
    owner,
  } = video;

  // Display "Me" for current user's videos, otherwise show uploader name
  // owner._id comes from MongoDB populated field, currentUserId from auth context
  const uploaderName = owner?._id?.toString() === currentUserId?.toString() ? "Me" : owner?.name;

  const live = useMemo(() => processingVideos?.[_id], [processingVideos, _id]);

  const effectiveProcessingStatus = useMemo(() => {
    console.log("live data:", live, processingStatus);
    if (!live) return "completed";
    if (live.state === "pending") return "pending";
    if (live.state === "processing") return "processing";
    if (live.state === "error") return "failed";
    if (live.state === "completed") return "completed";
    return processingStatus;
  }, [live, processingStatus]);

  const effectiveSensitivityResult = useMemo(() => {
    // If the socket says we're completed and provided a result, prefer it so the card updates instantly.
    if (live?.state === "completed" && (live.status || live.confidence)) {
      return {
        ...sensitivityResult,
        status: live.status ?? sensitivityResult?.status,
        confidence: Number.isFinite(live.confidence)
          ? live.confidence
          : sensitivityResult?.confidence,
      };
    }
    return sensitivityResult;
  }, [live, sensitivityResult]);

  const effectiveDuration = useMemo(() => {
    if (live?.state === "completed" && Number.isFinite(live.duration)) {
      return live.duration;
    }
    return duration;
  }, [live, duration]);

  const getStatusBadge = () => {
    if (
      effectiveProcessingStatus === "pending" ||
      effectiveProcessingStatus === "processing"
    ) {
      return (
        <span className="badge-processing">
          <Loader size={14} className="animate-spin mr-1" />
          {effectiveProcessingStatus}
        </span>
      );
    }
    if (effectiveProcessingStatus === "failed") {
      return (
        <span className="badge-flagged">
          <AlertTriangle size={14} className="mr-1" />
          Failed
        </span>
      );
    }
    if (effectiveSensitivityResult?.status === "safe") {
      return (
        <span className="badge-safe">
          <CheckCircle size={14} className="mr-1" />
          Safe
        </span>
      );
    }
    if (effectiveSensitivityResult?.status === "flagged") {
      return (
        <span className="badge-flagged">
          <AlertTriangle size={14} className="mr-1" />
          Flagged
        </span>
      );
    }
    return <span className="badge-pending">Pending</span>;
  };

  const formatFileSize = (bytes) => {
    if (formattedSize) return formattedSize;
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (seconds) => {
    if (formattedDuration) return formattedDuration;
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isPlayable = effectiveProcessingStatus === "completed";

  return (
    <div className="video-card-brutal group">
      {/* Thumbnail / Preview Area */}
      <div className="relative video-card-brutal-thumbnail flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <Film className="text-gray-400" size={40} />

        {/* Play overlay */}
        {isPlayable && (
          <Link
            to={`/watch/${_id}`}
            className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition-all duration-200"
          >
            <div className="w-14 h-14 bg-brutal-yellow border-4 border-brutal-black flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-200">
              <Play
                className="text-brutal-black"
                size={24}
                fill="currentColor"
              />
            </div>
          </Link>
        )}

        {/* Status badge overlay */}
        <div className="absolute top-2 right-2">{getStatusBadge()}</div>

        {/* Duration badge */}
        {effectiveDuration && (
          <div className="absolute bottom-2 right-2 bg-brutal-black text-white px-2 py-1 text-xs font-bold">
            {formatDuration(effectiveDuration)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="video-card-brutal-content">
        <h3 className="font-bold text-lg truncate mb-2" title={title}>
          {title}
        </h3>

        {/* Uploader name - only shown to admins */}
        {isAdmin && uploaderName && (
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
            <User size={14} />
            <span className={uploaderName === "Me" ? "font-semibold text-brutal-blue" : ""}>
              {uploaderName}
            </span>
          </div>
        )}

        <p className="text-sm text-gray-500 truncate mb-3" title={originalName}>
          {originalName}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <span className="flex items-center gap-1">
            <HardDrive size={14} />
            {formatFileSize(size)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {format(new Date(createdAt), "MMM d, yyyy")}
          </span>
        </div>

        {/* Confidence score */}
        {effectiveSensitivityResult?.confidence && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">Confidence</span>
              <span>
                {Math.round(effectiveSensitivityResult.confidence * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 border-2 border-brutal-black">
              <div
                className={`h-full ${
                  effectiveSensitivityResult.status === "safe"
                    ? "bg-brutal-lime"
                    : "bg-brutal-red"
                }`}
                style={{
                  width: `${effectiveSensitivityResult.confidence * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 mt-4">
            {isPlayable && (
              <Link
                to={`/watch/${_id}`}
                className="flex-1 btn-brutal text-center text-sm py-2"
              >
                Watch
              </Link>
            )}
            {effectiveProcessingStatus === "failed" && onReprocess && (
              <button
                onClick={() => onReprocess(_id)}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-brutal-blue text-white border-3 border-brutal-black font-bold text-sm hover:opacity-90"
              >
                <RefreshCw size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(_id)}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-brutal-red text-white border-3 border-brutal-black font-bold text-sm hover:opacity-90"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
