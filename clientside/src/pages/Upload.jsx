import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { videosAPI } from "../services/api";
import { useSocket } from "../context/SocketContext";
import Layout from "../components/Layout";
import ProgressBar from "../components/ProgressBar";
import {
  Upload as UploadIcon,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Film,
} from "lucide-react";

const ALLOWED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
];
const MAX_SIZE = 500 * 1024 * 1024; // 500MB

const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("uncategorized");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { addProcessingVideo } = useSocket();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = useCallback((file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(
        "Invalid file type. Please upload MP4, WebM, MOV, AVI, or MKV files."
      );
      return false;
    }
    if (file.size > MAX_SIZE) {
      setError("File is too large. Maximum size is 500MB.");
      return false;
    }
    return true;
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      setError("");

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (validateFile(file)) {
          setSelectedFile(file);
          if (!title) {
            setTitle(file.name.replace(/\.[^/.]+$/, ""));
          }
        }
      }
    },
    [title, validateFile]
  );

  const handleFileSelect = (e) => {
    setError("");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a video file");
      return;
    }

    setIsUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("video", selectedFile);
    formData.append("title", title || selectedFile.name);
    formData.append("description", description);
    formData.append("category", category);

    try {
      const response = await videosAPI.upload(formData, (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(progress);
      });

      setUploadComplete(true);

      // Add to processing videos for real-time updates
      const video = response.data.data.video;
      addProcessingVideo(video._id, video.title);

      // Redirect after a short delay
      setTimeout(() => {
        navigate("/library");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Upload failed. Please try again."
      );
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (uploadComplete) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="card-brutal-lg text-center py-12">
            <div className="w-20 h-20 bg-brutal-lime border-4 border-brutal-black mx-auto mb-6 flex items-center justify-center">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-black uppercase mb-4">
              Upload Complete!
            </h2>
            <p className="text-gray-600 mb-6">
              Your video has been uploaded and is now being processed for
              sensitivity analysis. You'll receive real-time updates on the
              processing progress.
            </p>
            <button onClick={() => navigate("/library")} className="btn-brutal">
              Go to Library
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase mb-2">Upload Video</h1>
          <p className="text-gray-600">
            Upload a video for sensitivity analysis. Supported formats: MP4,
            WebM, MOV, AVI, MKV
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-brutal-red/10 border-4 border-brutal-red flex items-start gap-3">
            <AlertCircle
              className="text-brutal-red flex-shrink-0 mt-0.5"
              size={20}
            />
            <span className="font-bold text-brutal-red">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dropzone */}
          <div
            className={`${
              dragActive ? "dropzone-brutal-active" : "dropzone-brutal"
            } ${selectedFile ? "border-solid bg-gray-50" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="w-full">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-brutal-yellow border-3 border-brutal-black flex items-center justify-center flex-shrink-0">
                    <Film size={32} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-2 hover:bg-gray-200 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  )}
                </div>

                {isUploading && (
                  <div className="mt-4">
                    <ProgressBar
                      progress={uploadProgress}
                      stage="Uploading file"
                      color="yellow"
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-brutal-black flex items-center justify-center mb-4">
                  <UploadIcon size={40} className="text-white" />
                </div>
                <p className="text-xl font-bold mb-2">
                  Drag and drop your video here
                </p>
                <p className="text-gray-500 mb-4">or</p>
                <label className="btn-brutal cursor-pointer">
                  Browse Files
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-4">
                  Maximum file size: 500MB
                </p>
              </>
            )}
          </div>

          {/* Video Details */}
          {selectedFile && (
            <div className="card-brutal space-y-4">
              <h3 className="font-bold uppercase text-lg mb-4">
                Video Details
              </h3>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-brutal"
                  placeholder="Enter video title"
                  disabled={isUploading}
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                  Description{" "}
                  <span className="text-gray-400 normal-case">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-brutal min-h-[100px] resize-y"
                  placeholder="Enter video description"
                  disabled={isUploading}
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="select-brutal"
                  disabled={isUploading}
                >
                  <option value="uncategorized">Uncategorized</option>
                  <option value="education">Education</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="marketing">Marketing</option>
                  <option value="training">Training</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {selectedFile && (
            <button
              type="submit"
              disabled={isUploading}
              className="w-full btn-brutal-black flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <span className="animate-spin">◌</span>
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon size={20} />
                  Upload & Analyze Video
                </>
              )}
            </button>
          )}
        </form>

        {/* Info Card */}
        <div className="mt-8 card-brutal-sm bg-brutal-yellow/20">
          <h4 className="font-bold uppercase mb-2">What happens next?</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
            <li>Your video will be uploaded securely</li>
            <li>Automatic sensitivity analysis will begin</li>
            <li>You'll see real-time progress updates</li>
            <li>Results will show if content is safe or flagged</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
};

export default Upload;
