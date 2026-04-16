import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LuX, LuLogOut, LuMenu } from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";

/**
 * Renders:
 *  - A fixed top bar (mobile only) with brand + burger button
 *  - A full-screen overlay drawer when open
 *
 * Props:
 *  - brand: string
 *  - sections: [{ title, items: [{ label, icon, to, end? }] }]
 *  - mobileOpen / setMobileOpen
 *  - roleLabel: string  (e.g. "Admin", "Counselor", "User")
 *  - roleColor: string
 */
function MobileSidebarDrawer({ brand, sections, mobileOpen, setMobileOpen, roleLabel, roleColor }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const close = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    close();
  };

  return (
    <>
      {/* Fixed top bar — only visible on mobile via CSS class */}
      <div className="dash-mobile-topbar">
        <span className="dash-mobile-topbar-brand">{brand}</span>
        <button className="dash-mobile-burger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <LuMenu size={24} />
        </button>
      </div>

      {/* Overlay drawer */}
      {mobileOpen && (
        <div className="dash-mobile-overlay" onClick={close}>
          <div className="dash-mobile-drawer" onClick={(e) => e.stopPropagation()}>

            {/* Drawer header */}
            <div className="dash-mobile-drawer-top">
              <span className="dash-mobile-drawer-brand">{brand}</span>
              <button className="dash-mobile-close" onClick={close} aria-label="Close menu">
                <LuX size={22} />
              </button>
            </div>

            {/* User badge */}
            {user && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 20, background: "rgba(202,163,143,0.08)", borderRadius: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#111", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                  {user.nickname?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "var(--text-main)" }}>{user.nickname}</p>
                  <p style={{ margin: 0, fontSize: 11, color: roleColor ?? "var(--accent)" }}>{roleLabel}</p>
                </div>
              </div>
            )}

            {/* Nav sections */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {sections.map((section) => (
                <div key={section.title} style={{ marginBottom: 20 }}>
                  <p style={{ margin: "0 0 8px 4px", fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {section.title}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {section.items.map((item) => (
                      <NavLink
                        key={item.label}
                        to={item.to}
                        end={item.end ?? item.to === sections[0]?.items[0]?.to}
                        onClick={close}
                        className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                      >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Logout */}
            <div style={{ borderTop: "1px solid var(--border-faint)", paddingTop: 14, marginTop: 8 }}>
              <button className="logout-btn" type="button" onClick={handleLogout} style={{ width: "100%" }}>
                <span className="sidebar-icon"><LuLogOut /></span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MobileSidebarDrawer;
