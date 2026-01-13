import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import StudentLayout from "./layouts/StudentLayout";
import FacultyLayout from "./layouts/FacultyLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Students from "./pages/Students";
import Courses from "./pages/Courses";
import ManageLectures from "./pages/ManageLectures"; 
import Teachers from "./pages/Teachers";
import Payments from "./pages/Payments";
import LiveClasses from "./pages/LiveClasses";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import MyCourses from "./pages/MyCourses"; // Naya page for students

// Role-based Protection Logic
const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, userProfile, loading } = useAuth();

  // Loading state handling
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-red-600 text-white font-black italic animate-pulse">
        NAGARI SYSTEM INITIALIZING...
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) return <Navigate to="/login" />;
  
  // Redirect to respective dashboard if role doesn't match
  if (roleRequired && userProfile?.role !== roleRequired) {
    const defaultPaths = { 
      admin: "/", 
      teacher: "/faculty", 
      student: "/student" 
    };
    return <Navigate to={defaultPaths[userProfile?.role] || "/login"} />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* --- PHASE 1: ADMIN PANEL (Email/Pass Access) --- */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute roleRequired="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="teachers" element={<Teachers />} /> 
        <Route path="courses" element={<Courses />} />
        <Route path="courses/manage/:courseId" element={<ManageLectures />} />
        <Route path="payments" element={<Payments />} />
        <Route path="live" element={<LiveClasses />} />
      </Route>

      {/* --- PHASE 2: FACULTY HUB (OTP Only Access) --- */}
      <Route 
        path="/faculty" 
        element={
          <ProtectedRoute roleRequired="teacher">
            <FacultyLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FacultyDashboard />} />
        <Route path="live" element={<LiveClasses />} />
        <Route path="students" element={<Students />} />
        {/* Future: Route for Assignments/Attendance */}
      </Route>

      {/* --- PHASE 3: STUDENT PORTAL (OTP/Pass Access) --- */}
      <Route 
        path="/student" 
        element={
          <ProtectedRoute roleRequired="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="live" element={<LiveClasses />} />
        <Route path="my-courses" element={<MyCourses />} />
        {/* Future: Route for Course Player */}
      </Route>

      {/* Global Redirect */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;