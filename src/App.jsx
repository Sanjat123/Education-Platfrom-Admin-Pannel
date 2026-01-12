import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Students from "./pages/Students";
import Courses from "./pages/Courses";
import ManageLectures from "./pages/ManageLectures"; 
import Teachers from "./pages/Teachers";
import Payments from "./pages/Payments";
import LiveClasses from "./pages/LiveClasses"; // Naya import

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route 
        path="/" 
        element={
          <ProtectedRoute>
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
        
        {/* Live Classes Route */}
        <Route path="live" element={<LiveClasses />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;