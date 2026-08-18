import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuCalendarPlus,
  LuInbox,
  LuCalendarCheck,
  LuUsers,
  LuMessageSquare,
  LuBell,
  LuUser,
  LuSettings,
  LuLogOut,
  LuChevronsLeft,
  LuChevronsRight,
} from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import MobileSidebarDrawer from "../user-dashboard/MobileSidebarDrawer";
import { useUnreadCount } from "../../hooks/useUnreadCount";

function CounselorSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unread } = useUnreadCount();

  const handleLogout = () => { logout(); navigate("/login"); };

  const sections = [
    {
      title: "Main",
      items: [
        { label: "Dashboard",        icon: <LuLayoutDashboard />, to: "/counselor" },
        { label: "My Availability",  icon: <LuCalendarPlus />,   to: "/counselor/availability" },
        { label: "Booking Requests", icon: <LuInbox />,          to: "/counselor/requests" },
        { label: "My Sessions",      icon: <LuCalendarCheck />,  to: "/counselor/sessions" },
        { label: "My Clients",       icon: <LuUsers />,          to: "/counselor/clients" },
      ],
    },
    {
      title: "Communication",
      items: [
        { label: "Messages",      icon: <LuMessageSquare />, to: "/counselor/messages" },
        { label: "Notifications", icon: <LuBell />,          to: "/counselor/notifications", badge: unread },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Profile",   icon: <LuUser />,     to: "/counselor/profile" },
        { label: "Settings",  icon: <LuSettings />, to: "/counselor/settings" },
      ],
    },
  ];

  return (
    <>
      <MobileSidebarDrawer
        brand="SereniLink"
        sections={sections}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        roleLabel="Counselor"
        roleColor="#67d58c"
      />
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
            <p style={{ margin: 0, fontSize: "11px", color: "#67d58c" }}>Counselor</p>
          </div>
        </div>
      )}

      <div className="sidebar-content">
        {sections.map((section) => (
          <div className="sidebar-section" key={section.title}>
            {!collapsed && <p className="sidebar-section-title">{section.title}</p>}
            <div className="sidebar-links">
              {section.items.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === "/counselor"}
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                >
                  <span className="sidebar-icon" style={{ position: "relative" }}>
                    {item.icon}
                    {collapsed && item.badge > 0 && (
                      <span className="sidebar-badge-dot" />
                    )}
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badge > 0 && (
                    <span className="sidebar-badge-count">{item.badge > 99 ? "99+" : item.badge}</span>
                  )}
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
    </>
  );
}

export default CounselorSidebar;
