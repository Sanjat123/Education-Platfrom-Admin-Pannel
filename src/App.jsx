import { Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import MyCourses from "./pages/MyCourses";
import CourseView from "./pages/CourseView"; // Naya Player Page

/**
 * ProtectedRoute: Yeh component user login aur role verification handle karta hai.
 */
const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-red-600 text-white font-black italic">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="tracking-widest uppercase text-xs">Verifying Credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (roleRequired && userProfile?.role !== roleRequired) {
    if (!userProfile) return null; 

    const defaultPaths = { 
      admin: "/", 
      teacher: "/faculty", 
      student: "/student" 
    };
    return <Navigate to={defaultPaths[userProfile?.role] || "/login"} replace />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* --- ADMIN PANEL --- */}
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
        <Route path="live" element={<LiveClasses />} />
        <Route path="my-courses" element={<MyCourses />} />
        {/* Course Player Route: Idhar student video playlist dekhega */}
        <Route path="course/:courseId" element={<CourseView />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;