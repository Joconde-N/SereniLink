import React, { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import CounselorSidebar from "./CounselorSidebar";
import { useAuth } from "../../context/AuthContext";

function CounselorLayout() {
  const { user, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", color: "#caa38f" }}>
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "counselor") return <Navigate to="/dashboard" replace />;

  // Force password change on first login
  if (user.must_change_password && location.pathname !== "/counselor/change-password") {
    return <Navigate to="/counselor/change-password" replace />;
  }

  return (
    <div className="dashboard-shell">
      <CounselorSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}

export default CounselorLayout;
