import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LuLayoutDashboard, LuBot, LuSearch, LuCalendarCheck,
  LuLayers, LuSmile, LuChartNoAxesCombined, LuLeaf,
  LuBell, LuMessageSquare, LuSettings, LuLogOut,
  LuChevronsLeft, LuChevronsRight, LuUser,
} from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";

function DashboardSidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems = [
    {
      title: "Main",
      items: [
        { label: "Dashboard", icon: <LuLayoutDashboard />, to: "/dashboard" },
        { label: "AI Support", icon: <LuBot />, to: "/dashboard/ai-support" },
        { label: "Find Counselors", icon: <LuSearch />, to: "/dashboard/counselors" },
        { label: "My Bookings", icon: <LuCalendarCheck />, to: "/dashboard/bookings" },
      ],
    },
    {
      title: "Wellness",
      items: [
        { label: "Resources", icon: <LuLayers />, to: "/resources" },
        { label: "Check-In", icon: <LuSmile />, to: "/dashboard/checkins" },
        { label: "Progress", icon: <LuChartNoAxesCombined />, to: "/dashboard/progress" },
        { label: "Exercises", icon: <LuLeaf />, to: "/dashboard/exercises" },
      ],
    },
    {
      title: "Activity",
      items: [
        { label: "Notifications", icon: <LuBell />, to: "/dashboard/notifications" },
        { label: "Messages", icon: <LuMessageSquare />, to: "/dashboard/bookings" },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Profile & Settings", icon: <LuSettings />, to: "/dashboard/settings" },
      ],
    },
  ];

  return (
    <aside className={`dashboard-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-top">
        <div className="sidebar-brand-row">
          {!collapsed && <h2 className="sidebar-brand">SereniLink</h2>}
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} type="button">
            {collapsed ? <LuChevronsRight /> : <LuChevronsLeft />}
          </button>
        </div>
        {!collapsed && <div className="sidebar-divider" />}
      </div>

      {/* User badge */}
      {!collapsed && user && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "10px 12px", marginBottom: "16px",
          background: "rgba(202,163,143,0.08)", borderRadius: "12px",
        }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "var(--accent)", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#111", fontWeight: 700, fontSize: "15px", flexShrink: 0,
          }}>
            {user.nickname?.[0]?.toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.nickname}
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize" }}>{user.role}</p>
          </div>
        </div>
      )}

      <div className="sidebar-content">
        {menuItems.map((section) => (
          <div className="sidebar-section" key={section.title}>
            {!collapsed && <p className="sidebar-section-title">{section.title}</p>}
            <div className="sidebar-links">
              {section.items.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === "/dashboard"}
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-divider" />
        <button className="logout-btn" type="button" onClick={handleLogout}>
          <span className="sidebar-icon"><LuLogOut /></span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
