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

// Faculty Pages (Real Implementation Modules)
import FacultyDashboard from "./pages/faculty/Dashboard";
import FacultyMyCourses from "./pages/faculty/MyCourses";
import FacultyStudents from "./pages/faculty/Students";
import FacultyLive from "./pages/faculty/Live";
import FacultyAssignments from "./pages/faculty/Assignments";
import FacultyAttendance from "./pages/faculty/Attendance";
import FacultyGrades from "./pages/faculty/Grades";
import FacultySettings from "./pages/faculty/Settings";
import FacultyAnalytics from "./pages/faculty/Analytics";
import FacultySchedule from "./pages/faculty/Schedule";
import FacultyMessages from "./pages/faculty/Messages";
import FacultySupport from "./pages/faculty/Support";
import FacultyNotes from "./pages/faculty/Notes";
import FacultyActivity from "./pages/faculty/Activity";

// Common Pages
import CourseView from "./pages/CourseView"; 
import LiveClasses from "./pages/LiveClasses";

/**
 * AdminLockdownGuard: Admin ko unke dashboard ke bahar nahi jane deta
 */
const AdminLockdownGuard = ({ children }) => {
  const { userProfile, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <LoadingSpinner />;
  
  if (userProfile?.role?.toLowerCase() === "admin") {
    const isAdminPath = location.pathname.startsWith("/admin");
    if (!isAdminPath) return <Navigate to="/admin" replace />;
  }
  return children;
};

/**
 * FacultyLockdownGuard: Teacher ko faculty area ke bahar jane se rokta hai
 */
const FacultyLockdownGuard = ({ children }) => {
  const { userProfile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile?.role?.toLowerCase() === "teacher") {
      const currentPath = location.pathname;
      
      // Allowed paths for teacher (Strict Lockdown)
      const allowedPaths = [
        "/",                    // Home page
        "/login",              // Login page
        "/course/",            // Course details
        "/category/",          // Category pages
        "/faculty",            // Faculty base
      ];
      
      const isAllowed = allowedPaths.some(path => currentPath.startsWith(path));
      
      // Agar teacher admin ya student area mein jane ki koshish kare
      if (!isAllowed) {
        if (currentPath !== "/login" && currentPath !== "/") {
          navigate("/faculty/dashboard", { replace: true });
        }
      }
    }
  }, [location.pathname, userProfile, navigate]);

  if (loading) return <LoadingSpinner />;
  
  return children;
};

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  
  if (roleRequired && userProfile?.role?.toLowerCase() !== roleRequired.toLowerCase()) {
    const defaultPaths = { admin: "/admin", teacher: "/faculty", student: "/student" };
    return <Navigate to={defaultPaths[userProfile?.role?.toLowerCase()] || "/login"} replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, userProfile, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user && userProfile?.role?.toLowerCase() === "admin") return <Navigate to="/admin" replace />;
  return children;
};

const LoadingSpinner = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-white">
    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="tracking-widest uppercase text-[10px] font-black text-slate-400">Verifying Permissions...</p>
  </div>
);

function App() {
  const location = useLocation();
  
  const isPlayerPage = location.pathname.includes("/course/view/");
  const isDashboardPage = location.pathname.startsWith("/admin") || 
                          location.pathname.startsWith("/faculty") || 
                          location.pathname.startsWith("/student");

  const shouldShowNavbarFooter = !isPlayerPage && !isDashboardPage;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {shouldShowNavbarFooter && <GlobalNavbar />} 

      <main className="flex-1">
        {/* Enforce Double Guard System */}
        <AdminLockdownGuard>
          <FacultyLockdownGuard>
            <Routes>
              {/* --- PUBLIC ROUTES --- */}
              <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/course/:courseId" element={<PublicRoute><CourseDetails /></PublicRoute>} />
              <Route path="/category/:categoryName" element={<PublicRoute><CategoryPage /></PublicRoute>} />

              {/* --- ADMIN PANEL --- */}
              <Route path="/admin" element={<ProtectedRoute roleRequired="admin"><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="students" element={<Students />} />
                <Route path="teachers" element={<Teachers />} /> 
                <Route path="courses" element={<Courses />} />
                <Route path="courses/manage/:courseId" element={<ManageLectures />} />
                <Route path="payments" element={<Payments />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
                <Route path="live" element={<LiveClasses />} />
              </Route>

              {/* --- FACULTY HUB (15+ Real Modules) --- */}
              <Route path="/faculty" element={<ProtectedRoute roleRequired="teacher"><FacultyLayout /></ProtectedRoute>}>
                <Route index element={<FacultyDashboard />} />
                <Route path="dashboard" element={<FacultyDashboard />} />
                <Route path="analytics" element={<FacultyAnalytics />} />
                <Route path="courses" element={<FacultyMyCourses />} />
                <Route path="assignments" element={<FacultyAssignments />} />
                <Route path="notes" element={<FacultyNotes />} />
                <Route path="grades" element={<FacultyGrades />} />
                <Route path="live" element={<FacultyLive />} />
                <Route path="attendance" element={<FacultyAttendance />} />
                <Route path="schedule" element={<FacultySchedule />} />
                <Route path="messages" element={<FacultyMessages />} />
                <Route path="students" element={<FacultyStudents />} />
                <Route path="activity" element={<FacultyActivity />} />
                <Route path="support" element={<FacultySupport />} />
                <Route path="settings" element={<FacultySettings />} />
              </Route>

              {/* --- STUDENT PORTAL --- */}
              <Route path="/student" element={<ProtectedRoute roleRequired="student"><StudentLayout /></ProtectedRoute>}>
                <Route index element={<StudentDashboard />} />
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="my-courses" element={<StudentMyCourses />} />
                <Route path="course/view/:courseId" element={<CourseView />} />
                <Route path="live" element={<LiveClasses />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </FacultyLockdownGuard>
        </AdminLockdownGuard>
      </main>

      {shouldShowNavbarFooter && <Footer />}
    </div>
  );
}

export default App;