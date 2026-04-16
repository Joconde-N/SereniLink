import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LuMoon, LuSun, LuMenu, LuX } from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

function Navbar() {
  const { user, loading, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/"); };
  const dashboardPath = user?.role === "counselor" ? "/counselor" : user?.role === "admin" ? "/admin" : "/dashboard";
  const close = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/">SereniLink</Link>
      </div>

      {/* Desktop links */}
      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>Home</NavLink>
        <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>About Us</NavLink>
        <NavLink to="/counselors" className={({ isActive }) => (isActive ? "active" : "")}>Counselors</NavLink>
        <NavLink to="/resources" className={({ isActive }) => (isActive ? "active" : "")}>Resources</NavLink>
      </div>

      <div className="nav-actions">
        <button className="theme-icon-btn" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <LuMoon size={20} /> : <LuSun size={20} />}
        </button>
        {!loading && (
          <span className="nav-login-btn" onClick={() => user ? navigate(dashboardPath) : navigate("/login")} style={{ cursor: "pointer" }}>
            {user ? "Dashboard" : "Login"}
          </span>
        )}
        {/* Burger */}
        <button className="nav-burger" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu">
          {menuOpen ? <LuX size={22} /> : <LuMenu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="nav-mobile-drawer">
          <NavLink to="/" end onClick={close} className={({ isActive }) => isActive ? "active" : ""}>Home</NavLink>
          <NavLink to="/about" onClick={close} className={({ isActive }) => isActive ? "active" : ""}>About Us</NavLink>
          <NavLink to="/counselors" onClick={close} className={({ isActive }) => isActive ? "active" : ""}>Counselors</NavLink>
          <NavLink to="/resources" onClick={close} className={({ isActive }) => isActive ? "active" : ""}>Resources</NavLink>
          {!loading && (
            <span onClick={() => { user ? navigate(dashboardPath) : navigate("/login"); close(); }} style={{ cursor: "pointer", color: "#E19A86", fontWeight: 600 }}>
              {user ? "Dashboard" : "Login"}
            </span>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
