import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LuMoon, LuSun } from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

function Navbar() {
  const { user, loading, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/"); };
  const dashboardPath = user?.role === "counselor" ? "/counselor" : user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/">SereniLink</Link>
      </div>

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
          <span className="login-btn" onClick={() => user ? navigate(dashboardPath) : navigate("/login")} style={{ cursor: "pointer" }}>
            Login
          </span>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
