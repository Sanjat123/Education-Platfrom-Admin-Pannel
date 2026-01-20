import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FiHome, FiUsers, FiBookOpen, FiSettings, FiMenu, 
  FiLogOut, FiChevronLeft, FiDollarSign, FiVideo,
  FiChevronRight, FiBell, FiUser, FiBarChart2,
  FiShield, FiCheckCircle, FiAlertCircle, FiSearch,
  FiMessageSquare, FiHelpCircle, FiExternalLink
} from "react-icons/fi";
import logoImg from "../assets/logoo.png";

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { userProfile, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Role Protection at Layout Level
  useEffect(() => {
    if (!loading && userProfile?.role !== "admin") {
      navigate("/");
    }
  }, [userProfile, loading, navigate]);

  // Mock notifications
  useEffect(() => {
    const mockNotifications = [
      { id: 1, text: "5 new student enrollments pending", type: "warning", time: "5 min ago" },
      { id: 2, text: "Course 'React Advanced' needs approval", type: "info", time: "10 min ago" },
      { id: 3, text: "₹25,000 payment received", type: "success", time: "1 hour ago" },
      { id: 4, text: "System backup completed", type: "success", time: "2 hours ago" },
    ];
    setNotifications(mockNotifications);
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: <FiHome />, badge: "Live" },
    { name: "Students", path: "/admin/students", icon: <FiUsers />, badge: "24 new" },
    { name: "Faculty", path: "/admin/teachers", icon: <FiUsers />, badge: "8 active" },
    { name: "Courses", path: "/admin/courses", icon: <FiBookOpen />, badge: "12 pending" },
    { name: "Payments", path: "/admin/payments", icon: <FiDollarSign />, badge: "₹1.2L" },
    { name: "Analytics", path: "/admin/analytics", icon: <FiBarChart2 /> },
    { name: "Live Classes", path: "/admin/live", icon: <FiVideo /> },
    { name: "Settings", path: "/admin/settings", icon: <FiSettings /> },
  ];

  const quickActions = [
    { label: "New Course", action: () => navigate("/admin/courses?action=create") },
    { label: "Add Student", action: () => navigate("/admin/students?action=add") },
    { label: "Generate Report", action: () => console.log("Generate Report") },
    { label: "View Marketplace", action: () => navigate("/") },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search logic here
      console.log("Searching for:", searchQuery);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-40 ${isCollapsed ? "w-20" : "w-72"}`}>
        
        {/* Logo Section */}
        <div className={`flex items-center ${isCollapsed ? "justify-center p-4" : "justify-between p-6"} border-b border-slate-100`}>
          {!isCollapsed && (
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-slate-100 p-1">
                <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black italic text-slate-900 tracking-tight">Nagari</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Admin Panel</p>
              </div>
            </Link>
          )}
          {isCollapsed && (
            <Link to="/admin" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-slate-100 p-1">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-lg hover:bg-slate-100 transition-colors ${isCollapsed ? "mx-auto" : ""}`}
          >
            {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        {/* Admin Profile */}
        {!isCollapsed && userProfile && (
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                  <FiUser className="text-white text-xl" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{userProfile.name || "Admin"}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <FiShield className="text-emerald-500" />
                  Super Admin
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center ${isCollapsed ? "justify-center p-3" : "justify-between px-4 py-3"} rounded-xl font-medium text-sm transition-all relative group ${
                location.pathname === item.path 
                ? "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/20" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                {!isCollapsed && <span>{item.name}</span>}
              </div>
              
              {item.badge && !isCollapsed && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  location.pathname === item.path 
                    ? "bg-white/20 text-white" 
                    : "bg-slate-100 text-slate-700"
                }`}>
                  {item.badge}
                </span>
              )}
              
              {isCollapsed && item.badge && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </Link>
          ))}
        </nav>

        {/* System Status */}
        {!isCollapsed && (
          <div className="p-4 border-t border-slate-100">
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">System Status</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-600">Live</span>
                </div>
              </div>
              <div className="text-xs text-emerald-600">
                All systems operational
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className={`flex items-center ${isCollapsed ? "justify-center p-3" : "justify-center gap-3 px-4 py-3"} w-full rounded-xl font-medium text-sm text-red-600 hover:bg-red-50 transition-all`}
          >
            <FiLogOut className="text-lg" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`transition-all duration-300 min-h-screen ${isCollapsed ? "ml-20" : "ml-72"}`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 capitalize">
                {location.pathname.split('/').pop() || 'Dashboard'}
              </h1>
              <p className="text-sm text-slate-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students, courses, payments..."
                  className="pl-10 pr-4 py-2 w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>

        {/* Admin Footer */}
        <footer className="bg-white border-t border-slate-200 px-6 py-4 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-600">
              © {new Date().getFullYear()} Nagari Learning Platform • Admin Panel v2.0 • 
              <span className="mx-2">|</span>
              <span className="text-emerald-600 font-medium">Uptime: 99.8%</span>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="/" className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1">
                <FiExternalLink size={14} />
                Visit Marketplace
              </a>
              <button className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1">
                <FiHelpCircle size={14} />
                Help
              </button>
              <button className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1">
                <FiMessageSquare size={14} />
                Support
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default AdminLayout;