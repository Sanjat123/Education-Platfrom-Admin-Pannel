import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FiHome, FiUsers, FiBookOpen, FiSettings, FiMenu, 
  FiLogOut, FiChevronLeft, FiDollarSign, FiVideo,
  FiChevronRight, FiBell, FiUser, FiBarChart2,
  FiShield, FiCheckCircle, FiAlertCircle, FiSearch,
  FiMessageSquare, FiHelpCircle, FiExternalLink,
  FiCreditCard, FiDatabase, FiActivity, FiTrendingUp,
  FiUserCheck, FiClock
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { 
  collection, getDocs, query, where, onSnapshot,
  doc, orderBy, limit, Timestamp 
} from "firebase/firestore";
import logoImg from "../assets/logoo.png";
import toast from "react-hot-toast";
import { format, subDays } from "date-fns";

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [realtimeStats, setRealtimeStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    activeTeachers: 0,
    totalCourses: 0,
    publishedCourses: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    systemStatus: "healthy",
    activeUsers: 0
  });
  const [pendingApprovals, setPendingApprovals] = useState({
    students: 0,
    teachers: 0,
    courses: 0,
    payments: 0
  });
  
  const { userProfile, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch stats once on mount (instead of real-time listeners that need indexes)
  useEffect(() => {
    if (!userProfile || userProfile.role !== "admin") return;

    const fetchStats = async () => {
      try {
        // Fetch students
        const studentsSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "student"))
        );
        const students = studentsSnap.docs.map(doc => doc.data());
        const activeStudents = students.filter(s => s.status === "active").length;
        const pendingStudents = students.filter(s => s.status === "pending").length;
        
        // Fetch teachers
        const teachersSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "teacher"))
        );
        const teachers = teachersSnap.docs.map(doc => doc.data());
        const activeTeachers = teachers.filter(t => t.status === "active").length;
        const pendingTeachers = teachers.filter(t => t.status === "pending").length;
        
        // Fetch courses
        const coursesSnap = await getDocs(collection(db, "courses"));
        const courses = coursesSnap.docs.map(doc => doc.data());
        const publishedCourses = courses.filter(c => c.isPublished).length;
        const pendingCourses = courses.filter(c => !c.isPublished).length;
        
        // Fetch payments
        const paymentsSnap = await getDocs(collection(db, "payments"));
        let totalRevenue = 0;
        let pendingPayments = 0;
        
        paymentsSnap.docs.forEach(doc => {
          const payment = doc.data();
          const amount = parseFloat(payment.amount) || 0;
          
          if (payment.status === "completed") {
            totalRevenue += amount;
          } else if (payment.status === "pending") {
            pendingPayments++;
          }
        });
        
        // Fetch active users (last 24 hours)
        const activeUsersSnap = await getDocs(
          query(
            collection(db, "users"),
            where("lastActive", ">", Timestamp.fromDate(subDays(new Date(), 1)))
          )
        );
        
        setRealtimeStats({
          totalStudents: students.length,
          activeStudents,
          totalTeachers: teachers.length,
          activeTeachers,
          totalCourses: courses.length,
          publishedCourses,
          pendingPayments,
          totalRevenue,
          todayRevenue: totalRevenue * 0.1, // Mock today's revenue as 10% of total
          systemStatus: "healthy",
          activeUsers: activeUsersSnap.size
        });
        
        setPendingApprovals({
          students: pendingStudents,
          teachers: pendingTeachers,
          courses: pendingCourses,
          payments: pendingPayments
        });
        
        // Set up notifications
        const newNotifications = [];
        
        if (pendingStudents > 0) {
          newNotifications.push({
            id: 1,
            text: `${pendingStudents} student(s) pending approval`,
            type: "warning",
            time: "Just now",
            action: () => navigate("/admin/students?filter=pending")
          });
        }
        
        if (pendingTeachers > 0) {
          newNotifications.push({
            id: 2,
            text: `${pendingTeachers} teacher(s) need verification`,
            type: "warning",
            time: "Just now",
            action: () => navigate("/admin/teachers?filter=pending")
          });
        }
        
        if (pendingCourses > 0) {
          newNotifications.push({
            id: 3,
            text: `${pendingCourses} course(s) awaiting publish`,
            type: "info",
            time: "Just now",
            action: () => navigate("/admin/courses?filter=draft")
          });
        }
        
        if (pendingPayments > 0) {
          newNotifications.push({
            id: 4,
            text: `${pendingPayments} payment(s) pending clearance`,
            type: "info",
            time: "Just now",
            action: () => navigate("/admin/payments?filter=pending")
          });
        }
        
        setNotifications(newNotifications);
        
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast.error("Failed to load dashboard data");
      }
    };
    
    fetchStats();
    
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [userProfile, navigate]);

  // Role Protection
  useEffect(() => {
    if (!loading && userProfile?.role !== "admin") {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
    }
  }, [userProfile, loading, navigate]);

  const menuItems = [
    { 
      name: "Dashboard", 
      path: "/admin", 
      icon: <FiHome />, 
      description: "Overview & analytics"
    },
    { 
      name: "Students", 
      path: "/admin/students", 
      icon: <FiUsers />, 
      description: "Manage student accounts"
    },
    { 
      name: "Faculty", 
      path: "/admin/teachers", 
      icon: <FiUserCheck />, 
      description: "Teacher management"
    },
    { 
      name: "Courses", 
      path: "/admin/courses", 
      icon: <FiBookOpen />, 
      description: "Course catalog & content"
    },
    { 
      name: "Payments", 
      path: "/admin/payments", 
      icon: <FiCreditCard />, 
      description: "Financial transactions"
    },
    { 
      name: "Analytics", 
      path: "/admin/analytics", 
      icon: <FiBarChart2 />, 
      description: "Reports & insights"
    },
    { 
      name: "Live Classes", 
      path: "/admin/live", 
      icon: <FiVideo />, 
      description: "Live session management"
    },
    { 
      name: "Settings", 
      path: "/admin/settings", 
      icon: <FiSettings />, 
      description: "System configuration"
    },
  ];

  const quickActions = [
    { 
      label: "New Course", 
      icon: <FiBookOpen size={16} />,
      action: () => navigate("/admin/courses?action=create"),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    { 
      label: "Add Student", 
      icon: <FiUser size={16} />,
      action: () => navigate("/admin/students?action=add"),
      color: "bg-emerald-500 hover:bg-emerald-600"
    },
    { 
      label: "View Reports", 
      icon: <FiTrendingUp size={16} />,
      action: () => navigate("/admin/analytics"),
      color: "bg-purple-500 hover:bg-purple-600"
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast(`Searching for: ${searchQuery}`);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
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
      <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-40 ${isCollapsed ? "w-20" : "w-64"}`}>
        
        {/* Logo */}
        <div className={`flex items-center ${isCollapsed ? "justify-center p-4" : "justify-between p-6"} border-b border-slate-100`}>
          {!isCollapsed && (
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-slate-100 p-1">
                <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Nagari</h1>
                <p className="text-xs text-slate-500">Admin Panel</p>
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
            className={`p-2 rounded-lg hover:bg-slate-100 ${isCollapsed ? "mx-auto" : ""}`}
          >
            {isCollapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
          </button>
        </div>

        {/* Admin Profile */}
        {!isCollapsed && userProfile && (
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                <FiUser className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{userProfile.name || "Admin"}</h3>
                <p className="text-xs text-slate-500">Super Admin</p>
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
              className={`flex items-center ${isCollapsed ? "justify-center p-3" : "justify-between px-4 py-3"} rounded-lg font-medium text-sm transition-all ${
                location.pathname === item.path 
                ? "bg-slate-900 text-white" 
                : "text-slate-600 hover:bg-slate-50"
              }`}
              title={isCollapsed ? item.name : ""}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                {!isCollapsed && <span>{item.name}</span>}
              </div>
            </Link>
          ))}
        </nav>

        {/* Stats */}
        {!isCollapsed && (
          <div className="p-4 border-t border-slate-100">
            <div className="space-y-3">
              <div className="text-xs font-medium text-slate-500 uppercase">Quick Stats</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-slate-50 rounded">
                  <div className="text-sm font-bold text-slate-900">{realtimeStats.activeUsers}</div>
                  <div className="text-xs text-slate-500">Online</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded">
                  <div className="text-sm font-bold text-emerald-600">{realtimeStats.totalStudents}</div>
                  <div className="text-xs text-slate-500">Students</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className={`flex items-center ${isCollapsed ? "justify-center p-3" : "justify-center gap-3 px-4 py-3"} w-full rounded-lg font-medium text-sm text-red-600 hover:bg-red-50`}
            title={isCollapsed ? "Logout" : ""}
          >
            <FiLogOut className="text-lg" />
            {!isCollapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 min-h-screen ${isCollapsed ? "ml-20" : "ml-64"}`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 capitalize">
                {location.pathname.split('/').pop() || 'Dashboard'}
              </h1>
              <p className="text-sm text-slate-500">
                {format(new Date(), 'EEEE, MMMM dd, yyyy')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              {/* Quick Actions */}
              <div className="flex gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`px-3 py-2 ${action.color} text-white rounded-lg text-sm font-medium flex items-center gap-2`}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet context={{ realtimeStats, pendingApprovals }} />
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 px-6 py-4 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-600">
              © {new Date().getFullYear()} Nagari Learning Platform
            </div>
            <div className="text-sm text-slate-500">
              System Status: <span className="text-emerald-600 font-medium">Operational</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default AdminLayout;