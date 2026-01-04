import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { videosAPI } from "../services/api";
import Layout from "../components/Layout";
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  CheckCircle,
  AlertTriangle,
  Clock,
  HardDrive,
  Calendar,
  Eye,
  Loader,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);

  const fetchVideo = useCallback(async () => {
    try {
      const response = await videosAPI.getOne(id);
      setVideo(response.data.data.video);
      console.log("Video data fetched:", response.data.data.video);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load video");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this video?")) {
      return;
    }

    try {
      await videosAPI.delete(id);
      navigate("/library");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete video");
    }
  };

  const handleReprocess = async () => {
    try {
      await videosAPI.reprocess(id);
      fetchVideo();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reprocess video");
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeekChange = (e) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekMouseUp = (e) => {
    setSeeking(false);
    const value = parseFloat(e.target.value);
    const element = videoRef.current;
    if (!element || !Number.isFinite(duration) || duration <= 0) return;
    element.currentTime = value * duration;
  };

  const setPlayingState = (nextPlaying) => {
    const element = videoRef.current;
    if (!element) return;
    if (nextPlaying) {
      element.play();
    } else {
      element.pause();
    }
  };

  const toggleFullscreen = () => {
    const container = document.querySelector(".player-container");
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    }
  };

  const getStreamUrl = () => {
    const token = localStorage.getItem("token");
    const url = `${videosAPI.getStreamUrl(id)}?token=${token}`;
    console.log("Stream URL:", url);
    return url;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="card-brutal flex items-center gap-4">
            <Loader className="animate-spin" size={24} />
            <span className="font-bold uppercase">Loading Video...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="card-brutal text-center py-12">
          <AlertTriangle size={48} className="mx-auto mb-4 text-brutal-red" />
          <h3 className="text-xl font-bold mb-2">Error Loading Video</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link to="/library" className="btn-brutal">
            Back to Library
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Back Button */}
      <Link
        to="/library"
        className="inline-flex items-center gap-2 mb-6 font-bold uppercase hover:text-brutal-pink transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Library
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <div className="card-brutal p-0 overflow-hidden">
            {/* Player Container */}
            <div className="player-container relative bg-brutal-black aspect-video">
              {/* HTML5 video element (custom controls rendered below) */}
              <video
                ref={videoRef}
                src={getStreamUrl()}
                className="w-full h-full"
                controls={false}
                muted={muted}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={(e) => {
                  if (seeking) return;
                  const element = e.currentTarget;
                  if (!element.duration) return;
                  setPlayed(element.currentTime / element.duration);
                }}
                onLoadedMetadata={(e) => {
                  const element = e.currentTarget;
                  setDuration(element.duration || 0);
                  if (element.duration) {
                    setPlayed(element.currentTime / element.duration);
                  }
                }}
                onError={(e) => console.error("Video error:", e.target.error)}
              />

              {/* Play overlay when paused */}
              {!playing && (
                <button
                  onClick={() => setPlayingState(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                >
                  <div className="w-20 h-20 bg-brutal-yellow border-4 border-brutal-black flex items-center justify-center">
                    <Play size={40} fill="currentColor" />
                  </div>
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="p-4 bg-brutal-black text-white">
              {/* Progress Bar */}
              <div className="mb-3">
                <input
                  type="range"
                  min={0}
                  max={0.999999}
                  step="any"
                  value={played}
                  onMouseDown={handleSeekMouseDown}
                  onChange={handleSeekChange}
                  onMouseUp={handleSeekMouseUp}
                  className="w-full h-2 bg-gray-700 appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #FACC15 0%, #FACC15 ${
                      played * 100
                    }%, #374151 ${played * 100}%, #374151 100%)`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Play/Pause */}
                  <button
                    onClick={() => setPlayingState(!playing)}
                    className="p-2 hover:bg-white/10 transition-colors"
                  >
                    {playing ? <Pause size={24} /> : <Play size={24} />}
                  </button>

                  {/* Volume */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const nextMuted = !muted;
                        setMuted(nextMuted);
                        const element = videoRef.current;
                        if (element) element.muted = nextMuted;
                      }}
                      className="p-2 hover:bg-white/10 transition-colors"
                    >
                      {muted || volume === 0 ? (
                        <VolumeX size={20} />
                      ) : (
                        <Volume2 size={20} />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={muted ? 0 : volume}
                      onChange={(e) => {
                        const nextVolume = parseFloat(e.target.value);
                        setVolume(nextVolume);
                        setMuted(false);
                        const element = videoRef.current;
                        if (element) {
                          element.volume = nextVolume;
                          element.muted = false;
                        }
                      }}
                      className="w-20 h-1 bg-gray-700 appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Time */}
                  <span className="text-sm font-mono">
                    {formatTime(played * duration)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/10 transition-colors"
                >
                  <Maximize size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Video Title & Description */}
          <div className="card-brutal mt-6">
            <h1 className="text-2xl font-black mb-2">{video.title}</h1>
            {video.description && (
              <p className="text-gray-600">{video.description}</p>
            )}
          </div>
        </div>

        {/* Video Info Sidebar */}
        <div className="space-y-6">
          {/* Sensitivity Result */}
          <div className="card-brutal">
            <h3 className="font-bold uppercase mb-4">Sensitivity Analysis</h3>

            {video.processingStatus === "completed" &&
            video.sensitivityResult ? (
              <>
                <div
                  className={`flex items-center gap-3 p-4 border-3 mb-4 ${
                    video.sensitivityResult.status === "safe"
                      ? "bg-brutal-lime/20 border-brutal-lime"
                      : "bg-brutal-red/20 border-brutal-red"
                  }`}
                >
                  {video.sensitivityResult.status === "safe" ? (
                    <CheckCircle size={32} className="text-brutal-lime" />
                  ) : (
                    <AlertTriangle size={32} className="text-brutal-red" />
                  )}
                  <div>
                    <p className="font-black text-lg uppercase">
                      {video.sensitivityResult.status}
                    </p>
                    <p className="text-sm text-gray-600">
                      {Math.round(video.sensitivityResult.confidence * 100)}%
                      confidence
                    </p>
                  </div>
                </div>

                {video.sensitivityResult.reasons?.length > 0 && (
                  <div>
                    <p className="text-sm font-bold uppercase mb-2">
                      Analysis Details
                    </p>
                    <ul className="space-y-1">
                      {video.sensitivityResult.reasons.map((reason, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-600 flex items-start gap-2"
                        >
                          <span className="mt-1">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : video.processingStatus === "processing" ? (
              <div className="flex items-center gap-3 p-4 bg-brutal-blue/20 border-3 border-brutal-blue">
                <Loader size={24} className="animate-spin text-brutal-blue" />
                <div>
                  <p className="font-bold">Processing</p>
                  <p className="text-sm text-gray-600">
                    Analysis in progress...
                  </p>
                </div>
              </div>
            ) : video.processingStatus === "failed" ? (
              <div className="flex items-center gap-3 p-4 bg-brutal-red/20 border-3 border-brutal-red">
                <AlertTriangle size={24} className="text-brutal-red" />
                <div>
                  <p className="font-bold text-brutal-red">Processing Failed</p>
                  <button
                    onClick={handleReprocess}
                    className="text-sm underline hover:no-underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-brutal-yellow/20 border-3 border-brutal-yellow">
                <Clock size={24} />
                <div>
                  <p className="font-bold">Pending</p>
                  <p className="text-sm text-gray-600">
                    Waiting for analysis...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Video Metadata */}
          <div className="card-brutal">
            <h3 className="font-bold uppercase mb-4">Video Details</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <HardDrive size={18} className="text-gray-400" />
                <span className="text-sm">
                  <span className="font-bold">Size:</span> {video.formattedSize}
                </span>
              </div>

              {video.duration && (
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-gray-400" />
                  <span className="text-sm">
                    <span className="font-bold">Duration:</span>{" "}
                    {video.formattedDuration}
                  </span>
                </div>
              )}

              {video.resolution?.width && (
                <div className="flex items-center gap-3">
                  <Maximize size={18} className="text-gray-400" />
                  <span className="text-sm">
                    <span className="font-bold">Resolution:</span>{" "}
                    {video.resolution.width}x{video.resolution.height}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-gray-400" />
                <span className="text-sm">
                  <span className="font-bold">Uploaded:</span>{" "}
                  {format(new Date(video.createdAt), "MMM d, yyyy h:mm a")}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Eye size={18} className="text-gray-400" />
                <span className="text-sm">
                  <span className="font-bold">Views:</span> {video.views}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card-brutal">
            <h3 className="font-bold uppercase mb-4">Actions</h3>

            <div className="space-y-3">
              <button
                onClick={handleReprocess}
                className="w-full btn-brutal-white flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Reprocess Video
              </button>

              <button
                onClick={handleDelete}
                className="w-full btn-brutal-red flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Delete Video
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Watch;
