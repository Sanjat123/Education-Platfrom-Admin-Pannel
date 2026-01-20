import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useEffect } from "react";

// Layouts & Components
import GlobalNavbar from "./components/GlobalNavbar"; 
import Footer from "./components/Footer"; // Naya Footer Component
import AdminLayout from "./layouts/AdminLayout";
import StudentLayout from "./layouts/StudentLayout";
import FacultyLayout from "./layouts/FacultyLayout";

// Public Pages
import Home from "./pages/Home"; 
import CourseDetails from "./pages/CourseDetails"; 
import CategoryPage from "./pages/CategoryPage";
import Login from "./pages/Login";

// Admin Pages
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Courses from "./pages/Courses";
import ManageLectures from "./pages/ManageLectures"; 
import Teachers from "./pages/Teachers";
import Payments from "./pages/Payments";

// Student & Faculty Pages
import StudentDashboard from "./pages/StudentDashboard";
import MyCourses from "./pages/MyCourses";
import CourseView from "./pages/CourseView"; 
import FacultyDashboard from "./pages/FacultyDashboard";
import LiveClasses from "./pages/LiveClasses";

/**
 * AdminLockdownGuard: Yeh ensure karta hai ki Admin sirf Admin area mein rahe
 */
const AdminLockdownGuard = ({ children }) => {
  const { userProfile, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white text-red-600 font-black italic">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="tracking-widest uppercase text-[10px]">Verifying Access...</p>
      </div>
    );
  }
  
  // Agar user Admin hai aur wo Admin area ke bahar jane ki koshish kar raha hai
  if (userProfile?.role?.toLowerCase() === "admin") {
    const isAdminPath = location.pathname.startsWith("/admin");
    
    // Agar Admin hai aur Admin path par nahi hai, toh redirect to admin dashboard
    if (!isAdminPath) {
      return <Navigate to="/admin" replace />;
    }
  }
  
  return children;
};

/**
 * ProtectedRoute: Yeh user login aur role verification handle karta hai.
 */
const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white text-red-600 font-black italic">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="tracking-widest uppercase text-[10px]">Verifying Access...</p>
      </div>
    );
  }

  if (!user) {
    // Agar login nahi hai, toh login page par bhejein
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Case-insensitive role check
  if (roleRequired && userProfile?.role?.toLowerCase() !== roleRequired.toLowerCase()) {
    // Role mismatch hone par user ko unke sahi dashboard par bhejein
    const defaultPaths = { 
      admin: "/admin", 
      teacher: "/faculty", 
      student: "/student" 
    };
    const userRole = userProfile?.role?.toLowerCase();
    return <Navigate to={defaultPaths[userRole] || "/login"} replace />;
  }
  
  return children;
};

/**
 * PublicRoute: Agar user already login hai, toh unhe appropriate dashboard par redirect karega
 */
const PublicRoute = ({ children }) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white text-red-600 font-black italic">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="tracking-widest uppercase text-[10px]">Verifying Access...</p>
      </div>
    );
  }

  if (user && userProfile) {
    // Agar user already login hai, toh unhe unke role ke according dashboard par redirect karo
    const role = userProfile.role?.toLowerCase();
    
    // Special check: Agar admin login hai aur public page par aane ki koshish kar raha hai
    if (role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    
    // Agar koi aur logged in user hai
    const dashboardPaths = {
      admin: "/admin",
      teacher: "/faculty",
      student: "/student"
    };
    
    return <Navigate to={dashboardPaths[role] || "/login"} replace />;
  }

  return children;
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // Global Navigation Guard: Admin ko public pages se rokne ke liye
  useEffect(() => {
    if (userProfile?.role?.toLowerCase() === "admin") {
      const currentPath = location.pathname;
      const allowedPaths = [
        "/admin",
        "/admin/dashboard",
        "/admin/students", 
        "/admin/teachers",
        "/admin/courses",
        "/admin/courses/manage/",
        "/admin/payments",
        "/admin/live"
      ];
      
      // Check if current path is allowed for admin
      const isAllowed = allowedPaths.some(path => currentPath.startsWith(path));
      
      // Agar admin hai aur allowed path par nahi hai, toh redirect to admin dashboard
      if (!isAllowed && currentPath !== "/admin") {
        navigate("/admin", { replace: true });
      }
    }
  }, [location.pathname, userProfile, navigate]);

  // Video Player page par Navbar aur Footer hide karne ke liye logic
  const isPlayerPage = location.pathname.includes("/course/view/");
  
  // Dashboard pages par Navbar aur Footer hide karein
  const isDashboardPage = location.pathname.startsWith("/admin") || 
                          location.pathname.startsWith("/faculty") || 
                          location.pathname.startsWith("/student");

  // Agar player page ya dashboard page hai to navbar/footer hide karein
  const shouldShowNavbarFooter = !isPlayerPage && !isDashboardPage;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Global Navbar: Sirf non-dashboard aur non-player pages par dikhega */}
      {shouldShowNavbarFooter && <GlobalNavbar />} 

      <main className="flex-1">
        {/* Global Admin Lockdown Guard - Pure app ke liye */}
        <AdminLockdownGuard>
          <Routes>
            {/* --- PUBLIC MARKETPLACE ROUTES (No Login Required) --- */}
            {/* Public routes par bhi check karein ki agar user login hai toh redirect ho jaye */}
            <Route path="/" element={
              <PublicRoute>
                <Home />
              </PublicRoute>
            } />
            
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            <Route path="/course/:courseId" element={
              <PublicRoute>
                <CourseDetails />
              </PublicRoute>
            } />
            
            <Route path="/category/:categoryName" element={
              <PublicRoute>
                <CategoryPage />
              </PublicRoute>
            } />

            {/* --- ADMIN PANEL (Restricted) --- */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute roleRequired="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="teachers" element={<Teachers />} /> 
              <Route path="courses" element={<Courses />} />
              <Route path="courses/manage/:courseId" element={<ManageLectures />} />
              <Route path="payments" element={<Payments />} />
              <Route path="live" element={<LiveClasses />} />
            </Route>

            {/* --- FACULTY HUB --- */}
            <Route 
              path="/faculty" 
              element={
                <ProtectedRoute roleRequired="teacher">
                  <FacultyLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<FacultyDashboard />} />
              <Route path="dashboard" element={<FacultyDashboard />} />
              <Route path="live" element={<LiveClasses />} />
              <Route path="students" element={<Students />} />
            </Route>

            {/* --- STUDENT PORTAL --- */}
            <Route 
              path="/student" 
              element={
                <ProtectedRoute roleRequired="student">
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentDashboard />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="my-courses" element={<MyCourses />} />
              
              {/* Private Video Player Route */}
              <Route path="course/view/:courseId" element={<CourseView />} />
              <Route path="live" element={<LiveClasses />} />
            </Route>

            {/* Catch all route - Admin ko bhi admin area mein hi redirect karega */}
            <Route path="*" element={
              userProfile?.role?.toLowerCase() === "admin" ? 
                <Navigate to="/admin" replace /> : 
                <Navigate to="/" replace />
            } />
          </Routes>
        </AdminLockdownGuard>
      </main>

      {/* Footer: Sirf non-dashboard aur non-player pages par dikhega */}
      {shouldShowNavbarFooter && <Footer />}
    </div>
  );
}

export default App;