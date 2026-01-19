import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FiHome, FiUsers, FiBookOpen, FiSettings, FiMenu, 
  FiLogOut, FiChevronLeft, FiDollarSign, FiVideo 
} from "react-icons/fi";
import logoImg from "../assets/logoo.png"; //

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { userProfile, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Role Protection at Layout Level
  useEffect(() => {
    if (!loading && userProfile?.role !== "admin") {
      navigate("/"); // Agar admin nahi hai toh marketplace par bhej do
    }
  }, [userProfile, loading, navigate]);

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: <FiHome /> },
    { name: "Students", path: "/admin/students", icon: <FiUsers /> },
    { name: "Teachers", path: "/admin/teachers", icon: <FiUsers /> },
    { name: "Courses", path: "/admin/courses", icon: <FiBookOpen /> },
    { name: "Payments", path: "/admin/payments", icon: <FiDollarSign /> },
    { name: "Live Classes", path: "/admin/live", icon: <FiVideo /> },
  ];

  if (loading) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-slate-200 transition-all duration-300 p-6 flex flex-col ${isCollapsed ? "w-24" : "w-72"}`}>
        
        {/* Logo Integration */}
        <div className="flex items-center gap-4 mb-10 px-2">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-slate-100 p-1">
            <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-black italic text-slate-900 tracking-tighter uppercase">Nagari</span>
          )}
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                location.pathname === item.path 
                ? "bg-red-600 text-white shadow-lg shadow-red-200" 
                : "text-slate-500 hover:bg-slate-50 hover:text-red-600"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <button onClick={logout} className="flex items-center gap-4 px-4 py-4 text-red-600 font-bold text-sm hover:bg-red-50 rounded-2xl transition-all">
          <FiLogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;