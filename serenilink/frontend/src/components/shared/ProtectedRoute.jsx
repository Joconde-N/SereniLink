import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageLoader from "./PageLoader";

/**
 * Wraps a route so only logged-in users (and optional roles) can open it.
 * Example: <ProtectedRoute roles={["admin"]}><AdminLayout /></ProtectedRoute>
 */
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If roles is provided, user.role must be one of them
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    const home =
      user.role === "admin" ? "/admin" :
      user.role === "counselor" ? "/counselor" :
      "/dashboard";
    return <Navigate to={home} replace />;
  }

  return children;
}

export default ProtectedRoute;
