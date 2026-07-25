import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import CounselorSidebar from "./CounselorSidebar";
import NotificationBell from "../user-dashboard/NotificationBell";
import ChangePasswordModal from "../shared/ChangePasswordModal";
import PageLoader from "../shared/PageLoader";
import { useAuth } from "../../context/AuthContext";
import "../user-dashboard/DashboardLayout.css";

function CounselorLayout() {
  const { user, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) return <PageLoader message="Loading counselor dashboard..." />;

  return (
    <div className="dashboard-shell">
      <CounselorSidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="dashboard-main" style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: "28px", right: "28px", zIndex: 10 }}>
          <NotificationBell notifPath="/counselor/notifications" />
        </div>
        <Outlet />
      </main>

      {/* Force password change as overlay instead of a full page */}
      {user?.must_change_password && <ChangePasswordModal />}
    </div>
  );
}

export default CounselorLayout;
