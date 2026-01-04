import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { videosAPI } from "../services/api";
import Layout from "../components/Layout";
import VideoCard from "../components/VideoCard";
import {
  Search,
  Filter,
  Film,
  Loader,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";

const Library = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    sensitivityStatus: "",
    status: "",
    category: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [activeTab, setActiveTab] = useState("all");

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      // Apply tab filter
      if (activeTab === "safe") {
        params.sensitivityStatus = "safe";
      } else if (activeTab === "flagged") {
        params.sensitivityStatus = "flagged";
      } else if (activeTab === "processing") {
        params.status = "processing";
      }

      const response = await videosAPI.getAll(params);
      setVideos(response.data.data.videos);
      setPagination(response.data.data.pagination);
      setStats(response.data.data.stats);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, activeTab]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Refetch when processing completes/errors (triggered by socket -> Redux)
  const lastUpdatedAt = useSelector((state) => state.video.lastUpdatedAt);

  useEffect(() => {
    if (!lastUpdatedAt) return;
    fetchVideos();
  }, [lastUpdatedAt, fetchVideos]);

  const handleDelete = async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this video?")) {
      return;
    }

    try {
      await videosAPI.delete(videoId);
      fetchVideos();
    } catch (error) {
      console.error("Failed to delete video:", error);
      alert(error.response?.data?.message || "Failed to delete video");
    }
  };

  const handleReprocess = async (videoId) => {
    try {
      await videosAPI.reprocess(videoId);
      fetchVideos();
    } catch (error) {
      console.error("Failed to reprocess video:", error);
      alert(error.response?.data?.message || "Failed to reprocess video");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchVideos();
  };

  const tabs = [
    { id: "all", label: "All Videos", count: stats?.totalVideos },
    { id: "safe", label: "Safe", count: stats?.safeVideos },
    { id: "flagged", label: "Flagged", count: stats?.flaggedVideos },
    { id: "processing", label: "Processing", count: stats?.processingVideos },
  ];

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase mb-2">Video Library</h1>
          <p className="text-gray-600">
            Manage and browse your uploaded videos
          </p>
        </div>
        <Link
          to="/upload"
          className="btn-brutal inline-flex items-center gap-2"
        >
          <Upload size={20} />
          Upload New
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={`px-4 py-2 border-3 border-brutal-black font-bold uppercase text-sm transition-all ${
              activeTab === tab.id
                ? "bg-brutal-yellow shadow-brutal-sm"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 px-2 py-0.5 bg-brutal-black text-white text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="card-brutal mb-6">
        <form
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="Search videos..."
                className="input-brutal pl-12"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={filters.category}
              onChange={(e) => {
                setFilters({ ...filters, category: e.target.value });
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="select-brutal w-40"
            >
              <option value="">All Categories</option>
              <option value="education">Education</option>
              <option value="entertainment">Entertainment</option>
              <option value="marketing">Marketing</option>
              <option value="training">Training</option>
              <option value="uncategorized">Uncategorized</option>
            </select>

            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split("-");
                setFilters({ ...filters, sortBy, sortOrder });
              }}
              className="select-brutal w-44"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="size-desc">Largest First</option>
              <option value="size-asc">Smallest First</option>
            </select>
          </div>
        </form>
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="card-brutal flex items-center gap-4">
            <Loader className="animate-spin" size={24} />
            <span className="font-bold uppercase">Loading Videos...</span>
          </div>
        </div>
      ) : videos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video._id}
                video={video}
                onDelete={handleDelete}
                onReprocess={handleReprocess}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="btn-brutal-outline py-2 px-4 disabled:opacity-50"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter((page) => {
                    const current = pagination.page;
                    return (
                      page === 1 ||
                      page === pagination.pages ||
                      Math.abs(page - current) <= 1
                    );
                  })
                  .map((page, idx, arr) => (
                    <span key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="px-2">...</span>
                      )}
                      <button
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page }))
                        }
                        className={`w-10 h-10 border-3 border-brutal-black font-bold ${
                          pagination.page === page
                            ? "bg-brutal-yellow"
                            : "bg-white hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  ))}
              </div>

              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page === pagination.pages}
                className="btn-brutal-outline py-2 px-4 disabled:opacity-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card-brutal text-center py-12">
          <Film size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold mb-2">No Videos Found</h3>
          <p className="text-gray-600 mb-4">
            {filters.search || activeTab !== "all"
              ? "Try adjusting your filters or search query"
              : "Upload your first video to get started"}
          </p>
          {activeTab === "all" && !filters.search && (
            <Link
              to="/upload"
              className="btn-brutal inline-flex items-center gap-2"
            >
              <Upload size={20} />
              Upload Video
            </Link>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Library;
