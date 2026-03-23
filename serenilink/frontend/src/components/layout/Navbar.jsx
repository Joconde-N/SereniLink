import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/">SereniLink</Link>
      </div>

      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          home
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>
          About Us
        </NavLink>
        <NavLink to="/counselors" className={({ isActive }) => (isActive ? "active" : "")}>
          Counselors
        </NavLink>
        <NavLink to="/resources" className={({ isActive }) => (isActive ? "active" : "")}>
          Resources
        </NavLink>
      </div>

      <div className="nav-actions">
        <button className="theme-icon-btn" aria-label="Toggle theme">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="theme-svg">
            <path
              fill="currentColor"
              d="M12 22c5.523 0 10-4.477 10-10c0-.463-.694-.54-.933-.143a6.5 6.5 0 1 1-8.924-8.924C12.54 2.693 12.463 2 12 2C6.477 2 2 6.477 2 12s4.477 10 10 10"
            />
          </svg>
        </button>

        {user ? (
          <>
            <Link to="/dashboard" className="login-btn">
              {user.nickname}
            </Link>
            <button
              onClick={handleLogout}
              className="login-btn"
              style={{ marginLeft: "8px", cursor: "pointer" }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="login-btn">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
