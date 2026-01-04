import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Upload,
  Film,
  Settings,
  LogOut,
  Users,
  Shield,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/upload", icon: Upload, label: "Upload" },
    { to: "/library", icon: Film, label: "Library" },
  ];

  const adminItems = [{ to: "/admin", icon: Users, label: "Users" }];

  const renderNavItem = (to, IconComponent, label) => (
    <NavLink
      key={to}
      to={to}
      onClick={() => setIsMobileOpen(false)}
      className={({ isActive }) =>
        isActive ? "sidebar-link-active" : "sidebar-link"
      }
    >
      <IconComponent size={20} />
      <span>{label}</span>
    </NavLink>
  );

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b-4 border-brutal-yellow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brutal-yellow flex items-center justify-center border-3 border-white">
            <Zap className="text-brutal-black" size={24} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight">PULSEGEN</h1>
            <p className="text-xs text-gray-400 uppercase tracking-widest">
              Video Platform
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <div className="px-4 mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-widest">
            Main
          </span>
        </div>
        {navItems.map((item) => renderNavItem(item.to, item.icon, item.label))}

        {isAdmin && (
          <>
            <div className="px-4 mb-2 mt-6">
              <span className="text-xs text-gray-500 uppercase tracking-widest">
                Admin
              </span>
            </div>
            {adminItems.map((item) =>
              renderNavItem(item.to, item.icon, item.label)
            )}
          </>
        )}
      </nav>

      {/* User Info */}
      <div className="border-t-2 border-gray-800 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brutal-pink flex items-center justify-center border-3 border-white font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Shield size={12} />
              {user?.role?.toUpperCase()}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-transparent border-2 border-gray-700 text-gray-400 hover:bg-brutal-red hover:text-white hover:border-brutal-red transition-all duration-150 uppercase text-sm font-bold"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-brutal-black text-white border-3 border-brutal-yellow"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex sidebar-brutal">{sidebarContent}</aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-screen w-64 bg-brutal-black text-white flex flex-col border-r-4 border-brutal-black z-50 transform transition-transform duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
