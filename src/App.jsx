import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useEffect } from "react";

// Layouts & Components
import GlobalNavbar from "./components/GlobalNavbar"; 
import Footer from "./components/Footer";
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
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

// Student pages 
import StudentDashboard from "./pages/StudentDashboard";
import StudentMyCourses from "./pages/MyCourses";

// Faculty Pages
import FacultyDashboard from "./pages/faculty/Dashboard";
import FacultyMyCourses from "./pages/faculty/MyCourses";
import FacultyStudents from "./pages/faculty/Students";
import FacultyLive from "./pages/faculty/Live";
import FacultyAssignments from "./pages/faculty/Assignments";
import FacultyLectures from "./pages/faculty/Lectures";
import FacultySchedule from "./pages/faculty/Schedule";
import FacultyMessages from "./pages/faculty/Messages";
import FacultyAnalytics from "./pages/faculty/Analytics";
import FacultyResources from "./pages/faculty/Resources";
import FacultyAttendance from "./pages/faculty/Attendance";
import FacultyGrades from "./pages/faculty/Grades";
import FacultySupport from "./pages/faculty/Support";
import FacultySearch from "./pages/faculty/Search";
import FacultyNotifications from "./pages/faculty/Notifications";
import FacultyActivity from "./pages/faculty/Activity";
import FacultySettings from "./pages/faculty/Settings";
import CourseView from "./pages/CourseView"; 
import LiveClasses from "./pages/LiveClasses";

/**
 * AdminLockdownGuard: Sirf Admin ke liye lockdown
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
  
  // SIRF Admin ke liye lockdown
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
 * SIRF Admin ke liye redirect, student/teacher ke liye nahi
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
    const role = userProfile.role?.toLowerCase();
    
    // SIRF Admin ke liye redirect - Student/Teacher ko public pages par jaane dijiye
    if (role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    
    // Student ya Teacher hai toh public page access de do
    // Unhe login hone ke baad bhi marketplace browse karne dijiye
    return children;
  }

  return children;
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // Global Navigation Guard: SIRF Admin ko public pages se rokne ke liye
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
        "/admin/analytics",
        "/admin/settings",
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
      {/* Global Navbar: 
          - Player page par nahi
          - Dashboard pages par nahi
          - Student/Teacher ke liye baki sab jagah dikhega
      */}
      {shouldShowNavbarFooter && <GlobalNavbar />} 

      <main className="flex-1">
        {/* Global Admin Lockdown Guard - Sirf Admin ke liye */}
        <AdminLockdownGuard>
          <Routes>
            {/* --- PUBLIC MARKETPLACE ROUTES --- */}
            {/* Student/Teacher login hone ke baad bhi access kar sakte hain */}
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

            {/* --- ADMIN PANEL (Restricted & Locked) --- */}
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
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
              <Route path="live" element={<LiveClasses />} />
            </Route>

            {/* --- FACULTY HUB (No Lockdown) --- */}
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
              <Route path="courses" element={<FacultyMyCourses />} />
              <Route path="students" element={<FacultyStudents />} />
              <Route path="live" element={<FacultyLive />} />
              <Route path="assignments" element={<FacultyAssignments />} />
              <Route path="lectures" element={<FacultyLectures />} />
              <Route path="schedule" element={<FacultySchedule />} />
              <Route path="messages" element={<FacultyMessages />} />
              <Route path="analytics" element={<FacultyAnalytics />} />
              <Route path="resources" element={<FacultyResources />} />
              <Route path="attendance" element={<FacultyAttendance />} />
              <Route path="grades" element={<FacultyGrades />} />
              <Route path="support" element={<FacultySupport />} />
              <Route path="search" element={<FacultySearch />} />
              <Route path="notifications" element={<FacultyNotifications />} />
              <Route path="activity" element={<FacultyActivity />} />
              <Route path="settings" element={<FacultySettings />} />
              <Route path="courses/new" element={<FacultyMyCourses />} />
              <Route path="assignments/new" element={<FacultyAssignments />} />
              <Route path="live/start" element={<FacultyLive />} />
              <Route path="schedule/:classId" element={<FacultySchedule />} />
            </Route>

            {/* --- STUDENT PORTAL (No Lockdown) --- */}
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
              <Route path="my-courses" element={<StudentMyCourses />} />
              
              {/* Private Video Player Route */}
              <Route path="course/view/:courseId" element={<CourseView />} />
              <Route path="live" element={<LiveClasses />} />
            </Route>

            {/* Catch all route - Admin ko admin area mein hi redirect karega */}
            <Route path="*" element={
              userProfile?.role?.toLowerCase() === "admin" ? 
                <Navigate to="/admin" replace /> : 
                <Navigate to="/" replace />
            } />
          </Routes>
        </AdminLockdownGuard>
      </main>

      {/* Footer: 
          - Player page par nahi
          - Dashboard pages par nahi
          - Student/Teacher ke liye baki sab jagah dikhega
      */}
      {shouldShowNavbarFooter && <Footer />}
    </div>
  );
}

export default App;