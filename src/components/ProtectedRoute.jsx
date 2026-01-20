import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && userProfile.role !== requiredRole) {
    // Redirect based on role
    switch (userProfile.role) {
      case "admin":
        return <Navigate to="/admin" />;
      case "teacher":
        return <Navigate to="/faculty" />;
      case "student":
        return <Navigate to="/student" />;
      default:
        return <Navigate to="/" />;
    }
  }

  return children;
};

export default ProtectedRoute;