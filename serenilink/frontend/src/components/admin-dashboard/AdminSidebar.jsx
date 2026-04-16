import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuClipboardList,
  LuCalendarDays,
  LuFileText,
  LuDumbbell,
  LuUsers,
  LuChartBar,
  LuUser,
  LuSettings,
  LuLogOut,
  LuChevronsLeft,
  LuChevronsRight,
} from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import MobileSidebarDrawer from "../user-dashboard/MobileSidebarDrawer";

const SECTIONS = [
  {
    title: "Main",
    items: [
      { label: "Dashboard",              icon: <LuLayoutDashboard />, to: "/admin" },
      { label: "Counselor Applications", icon: <LuClipboardList />,  to: "/admin/applications" },
      { label: "Bookings",               icon: <LuCalendarDays />,   to: "/admin/bookings" },
      { label: "Content Management",     icon: <LuFileText />,       to: "/admin/content" },
      { label: "Exercises Management",   icon: <LuDumbbell />,       to: "/admin/exercises" },
    ],
  },
  {
    title: "Monitoring",
    items: [
      { label: "Users",    icon: <LuUsers />,    to: "/admin/users" },
      { label: "Insights",  icon: <LuChartBar />, to: "/admin/insights" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile",  icon: <LuUser />,     to: "/admin/profile" },
      { label: "Settings", icon: <LuSettings />, to: "/admin/settings" },
    ],
  },
];

function AdminSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <>
      <MobileSidebarDrawer
        brand="SereniLink"
        sections={SECTIONS}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        roleLabel="Admin"
        roleColor="#f5c95f"
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
            <p style={{ margin: 0, fontSize: "11px", color: "#f5c95f" }}>Admin</p>
          </div>
        </div>
      )}

      <div className="sidebar-content">
        {SECTIONS.map((section) => (
          <div className="sidebar-section" key={section.title}>
            {!collapsed && <p className="sidebar-section-title">{section.title}</p>}
            <div className="sidebar-links">
              {section.items.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === "/admin"}
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
    </>
  );
}

export default AdminSidebar;
