import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageLoader from "./PageLoader";

const ROLE_HOME = { admin: "/admin", counselor: "/counselor", user: "/dashboard" };

/**
 * Only renders children for unauthenticated visitors.
 * Authenticated users are redirected to their role's default page.
 * Shows a loader while the session is being restored to prevent a flash.
 */
function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (user) return <Navigate to={ROLE_HOME[user.role] ?? "/dashboard"} replace />;

  return children;
}

export default PublicOnlyRoute;
