import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/">SereniLink</Link>
      </div>

      <div className="nav-links">
        <Link to="/" className="active">
          home
        </Link>
        <Link to="/about">About Us</Link>
        <Link to="/counselors">Counselors</Link>
        <Link to="/resources">Resources</Link>
      </div>

      <div className="nav-actions">
        <button className="theme-icon-btn" aria-label="Toggle theme">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="theme-svg"
          >
            <path
              fill="currentColor"
              d="M12 22c5.523 0 10-4.477 10-10c0-.463-.694-.54-.933-.143a6.5 6.5 0 1 1-8.924-8.924C12.54 2.693 12.463 2 12 2C6.477 2 2 6.477 2 12s4.477 10 10 10"
            />
          </svg>
        </button>
        <Link to="/login" className="login-btn">
          Login
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;