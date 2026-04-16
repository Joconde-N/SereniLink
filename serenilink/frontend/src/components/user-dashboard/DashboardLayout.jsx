import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import DashboardSidebar from "./DahboardSidebar";
import NotificationBell from "./NotificationBell";
import { useAuth } from "../../context/AuthContext";
import "./DashboardLayout.css";

function DashboardLayout() {
  const { user, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", color: "#caa38f" }}>
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="dashboard-shell">
      <DashboardSidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className={`dashboard-main ${collapsed ? "expanded" : ""}`} style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: "28px", right: "28px", zIndex: 10 }}>
          <NotificationBell notifPath="/dashboard/notifications" />
        </div>
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
