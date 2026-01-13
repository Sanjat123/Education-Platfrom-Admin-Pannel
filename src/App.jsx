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

/**
 * ProtectedRoute: Yeh component check karta hai ki user logged in hai 
 * aur uska role wahi hai jo us page ke liye zaroori hai.
 */
const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  // 1. Loading state: Jab tak Firebase se user profile load na ho jaye, wait karein
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-red-600 text-white font-black italic">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="tracking-widest uppercase text-xs">Verifying Your Access...</p>
      </div>
    );
  }

  // 2. No User: Agar user login nahi hai, toh use login page par bhej dein
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 3. Role Verification: Agar user ka role (student/teacher/admin) mismatch hai
  if (roleRequired && userProfile?.role !== roleRequired) {
    console.log(`Access Denied. Required: ${roleRequired}, Found: ${userProfile?.role}`);
    
    // Agar profile load nahi hui (rare case), dashboard par access allow nahi karein
    if (!userProfile) return null; 

    // Galat role hone par user ko uske apne dashboard par redirect kar dein
    const defaultPaths = { 
      admin: "/", 
      teacher: "/faculty", 
      student: "/student" 
    };
    return <Navigate to={defaultPaths[userProfile?.role] || "/login"} replace />;
  }
  
  // Agar sab theek hai, toh dashboard dikhayein
  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Route: Login hamesha accessible rahega */}
      <Route path="/login" element={<Login />} />

      {/* --- PHASE 1: ADMIN PANEL --- */}
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

      {/* --- PHASE 2: FACULTY HUB --- */}
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
        {/* Future routes like Attendance can be added here */}
      </Route>

      {/* --- PHASE 3: STUDENT PORTAL --- */}
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
      </Route>

      {/* Global Redirect: Agar koi galat URL dale, toh /login par bhej dein */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;