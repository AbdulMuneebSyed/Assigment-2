import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { videosAPI } from "../services/api";
import Layout from "../components/Layout";
import VideoCard from "../components/VideoCard";
import {
  Film,
  Upload,
  CheckCircle,
  AlertTriangle,
  Loader,
  HardDrive,
  TrendingUp,
  Clock,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refetch when processing completes/errors (triggered by socket -> Redux)
  const lastUpdatedAt = useSelector((state) => state.video.lastUpdatedAt);

  useEffect(() => {
    if (!lastUpdatedAt) return;
    fetchDashboardData();
  }, [lastUpdatedAt]);

  const fetchDashboardData = async () => {
    try {
      const response = await videosAPI.getAll({
        limit: 4,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setStats(response.data.data.stats);
      setRecentVideos(response.data.data.videos);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const StatCard = (props) => {
    const { icon: Icon, label, value, color = "yellow", subtext } = props;
    return (
      <div className="card-brutal">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-1">
              {label}
            </p>
            <p className="text-3xl font-black">{value}</p>
            {subtext && <p className="text-sm text-gray-500 mt-1">{subtext}</p>}
          </div>
          <div
            className={`w-12 h-12 bg-brutal-${color} border-3 border-brutal-black flex items-center justify-center`}
          >
            <Icon
              size={24}
              className={
                color === "yellow" || color === "lime"
                  ? "text-brutal-black"
                  : "text-white"
              }
            />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="card-brutal flex items-center gap-4">
            <Loader className="animate-spin" size={24} />
            <span className="font-bold uppercase">Loading Dashboard...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase mb-2">
          Welcome back, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of your video library and processing status.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Film}
          label="Total Videos"
          value={stats?.totalVideos || 0}
          color="yellow"
        />
        <StatCard
          icon={CheckCircle}
          label="Safe Videos"
          value={stats?.safeVideos || 0}
          color="lime"
        />
        <StatCard
          icon={AlertTriangle}
          label="Flagged Videos"
          value={stats?.flaggedVideos || 0}
          color="red"
        />
        <StatCard
          icon={HardDrive}
          label="Storage Used"
          value={formatBytes(stats?.totalSize || 0)}
          color="blue"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          to="/upload"
          className="card-brutal hover:shadow-brutal-lg transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brutal-yellow border-4 border-brutal-black flex items-center justify-center group-hover:scale-105 transition-transform">
              <Upload size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase">Upload New Video</h3>
              <p className="text-gray-600">
                Add videos for sensitivity analysis
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/library"
          className="card-brutal hover:shadow-brutal-lg transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brutal-pink border-4 border-brutal-black flex items-center justify-center group-hover:scale-105 transition-transform">
              <Film size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase">Video Library</h3>
              <p className="text-gray-600">Browse and manage your videos</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Processing Status */}
      {stats?.processingVideos > 0 && (
        <div className="card-brutal bg-brutal-blue/10 border-brutal-blue mb-8">
          <div className="flex items-center gap-4">
            <Loader className="animate-spin text-brutal-blue" size={24} />
            <div>
              <p className="font-bold text-brutal-blue">
                {stats.processingVideos} video
                {stats.processingVideos > 1 ? "s" : ""} currently processing
              </p>
              <p className="text-sm text-gray-600">
                You'll receive real-time updates as processing completes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Videos */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black uppercase">Recent Uploads</h2>
          <Link to="/library" className="btn-brutal-outline text-sm py-2 px-4">
            View All
          </Link>
        </div>

        {recentVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentVideos.map((video) => (
              <VideoCard key={video._id} video={video} showActions={false} />
            ))}
          </div>
        ) : (
          <div className="card-brutal text-center py-12">
            <Film size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold mb-2">No Videos Yet</h3>
            <p className="text-gray-600 mb-4">
              Upload your first video to get started
            </p>
            <Link
              to="/upload"
              className="btn-brutal inline-flex items-center gap-2"
            >
              <Upload size={20} />
              Upload Video
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
