import { useState, useEffect, useCallback } from "react";
import { adminAPI } from "../services/api";
import Layout from "../components/Layout";
import {
  Users,
  Film,
  HardDrive,
  Shield,
  Loader,
  Search,
  ChevronDown,
  Check,
  X,
  TrendingUp,
} from "lucide-react";

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminAPI.getUsers({ search, role: roleFilter }),
        adminAPI.getStats(),
      ]);
      setUsers(usersRes.data.data.users);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setEditingRole(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update status");
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const StatCard = (props) => {
    const { icon: Icon, label, value, color = "yellow" } = props;
    return (
      <div className="card-brutal">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-1">
              {label}
            </p>
            <p className="text-2xl font-black">{value}</p>
          </div>
          <div
            className={`w-10 h-10 bg-brutal-${color} border-3 border-brutal-black flex items-center justify-center`}
          >
            <Icon
              size={20}
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
            <span className="font-bold uppercase">Loading Admin Panel...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage users and view system statistics</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats?.users?.total || 0}
          color="yellow"
        />
        <StatCard
          icon={Film}
          label="Total Videos"
          value={stats?.videos?.totalVideos || 0}
          color="pink"
        />
        <StatCard
          icon={HardDrive}
          label="Storage Used"
          value={formatBytes(stats?.videos?.totalSize || 0)}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Recent Uploads"
          value={stats?.recentUploads || 0}
          color="lime"
        />
      </div>

      {/* Video Stats */}
      <div className="card-brutal mb-8">
        <h3 className="font-bold uppercase mb-4">Video Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-brutal-lime/20 border-3 border-brutal-lime text-center">
            <p className="text-2xl font-black">
              {stats?.videos?.safeVideos || 0}
            </p>
            <p className="text-sm font-bold uppercase">Safe</p>
          </div>
          <div className="p-4 bg-brutal-red/20 border-3 border-brutal-red text-center">
            <p className="text-2xl font-black">
              {stats?.videos?.flaggedVideos || 0}
            </p>
            <p className="text-sm font-bold uppercase">Flagged</p>
          </div>
          <div className="p-4 bg-brutal-yellow/20 border-3 border-brutal-yellow text-center">
            <p className="text-2xl font-black">
              {stats?.videos?.pendingVideos || 0}
            </p>
            <p className="text-sm font-bold uppercase">Pending</p>
          </div>
          <div className="p-4 bg-brutal-blue/20 border-3 border-brutal-blue text-center">
            <p className="text-2xl font-black">
              {stats?.videos?.processingVideos || 0}
            </p>
            <p className="text-sm font-bold uppercase">Processing</p>
          </div>
          <div className="p-4 bg-gray-100 border-3 border-gray-300 text-center">
            <p className="text-2xl font-black">
              {stats?.videos?.failedVideos || 0}
            </p>
            <p className="text-sm font-bold uppercase">Failed</p>
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="card-brutal">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="font-bold uppercase text-lg">User Management</h3>

          <div className="flex gap-4">
            <div className="relative flex-1 md:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="input-brutal pl-10 py-2"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="select-brutal w-32 py-2"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="table-brutal">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Videos</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brutal-pink flex items-center justify-center border-2 border-brutal-black font-bold text-white">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold">{user.name}</p>
                        <p className="text-xs text-gray-500">
                          {user.organization}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm">{user.email}</td>
                  <td>
                    {editingRole === user._id ? (
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue={user.role}
                          onChange={(e) =>
                            handleRoleChange(user._id, e.target.value)
                          }
                          className="select-brutal py-1 px-2 text-sm w-24"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => setEditingRole(null)}
                          className="p-1 hover:bg-gray-100"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingRole(user._id)}
                        className={`badge-brutal ${
                          user.role === "admin"
                            ? "bg-brutal-purple text-white"
                            : user.role === "editor"
                            ? "bg-brutal-blue text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        <Shield size={12} className="mr-1" />
                        {user.role}
                      </button>
                    )}
                  </td>
                  <td>
                    <span className="font-bold">{user.videoCount}</span>
                  </td>
                  <td>
                    <span
                      className={`badge-brutal ${
                        user.isActive ? "bg-brutal-lime" : "bg-gray-300"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleStatus(user._id)}
                      className={`px-3 py-1 border-2 border-brutal-black font-bold text-sm ${
                        user.isActive
                          ? "bg-gray-200 hover:bg-brutal-red hover:text-white"
                          : "bg-brutal-lime hover:bg-brutal-lime/80"
                      }`}
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
