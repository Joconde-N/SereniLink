import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import NotificationBell from "./NotificationBell";
import PageLoader from "../shared/PageLoader";
import { useAuth } from "../../context/AuthContext";
import "./DashboardLayout.css";

function DashboardLayout() {
  const { loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) return <PageLoader message="Loading dashboard..." />;

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
