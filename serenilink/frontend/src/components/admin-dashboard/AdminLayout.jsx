import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import PageLoader from "../shared/PageLoader";
import { useAuth } from "../../context/AuthContext";
import "../user-dashboard/DashboardLayout.css";

function AdminLayout() {
  const { loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) return <PageLoader message="Loading admin dashboard..." />;

  return (
    <div className="dashboard-shell">
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
