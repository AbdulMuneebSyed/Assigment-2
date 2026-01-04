import { Loader } from "lucide-react";

const ProgressBar = ({
  progress = 0,
  stage = "",
  showPercentage = true,
  color = "yellow",
  size = "default",
  animated = true,
}) => {
  const colorClasses = {
    yellow: "bg-brutal-yellow",
    lime: "bg-brutal-lime",
    pink: "bg-brutal-pink",
    blue: "bg-brutal-blue",
    red: "bg-brutal-red",
  };

  const sizeClasses = {
    small: "h-4",
    default: "h-6",
    large: "h-8",
  };

  return (
    <div className="w-full">
      {/* Stage label */}
      {stage && (
        <div className="flex items-center gap-2 mb-2">
          {animated && progress < 100 && (
            <Loader size={14} className="animate-spin text-brutal-black" />
          )}
          <span className="text-sm font-medium uppercase tracking-wide">
            {stage}
          </span>
        </div>
      )}

      {/* Progress bar container */}
      <div className={`progress-brutal ${sizeClasses[size]}`}>
        <div
          className={`progress-brutal-bar ${colorClasses[color]} ${
            animated && progress < 100 ? "animate-pulse" : ""
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      {/* Percentage */}
      {showPercentage && (
        <div className="flex justify-between mt-1 text-sm font-bold">
          <span>{Math.round(progress)}%</span>
          <span className="text-gray-500">
            {progress >= 100 ? "Complete" : "Processing..."}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
