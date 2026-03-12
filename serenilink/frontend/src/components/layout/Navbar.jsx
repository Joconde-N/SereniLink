import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/">SereniLink</Link>
      </div>

      <div className="nav-links">
        <Link to="/" className="active">home</Link>
        <Link to="/about">About Us</Link>
        <Link to="/counselors">Counselors</Link>
        <Link to="/resources">Resources</Link>
      </div>

      <div className="nav-actions">
        <button className="theme-icon-btn">◐</button>
        <Link to="/login" className="login-btn">Login</Link>
      </div>
    </nav>
  );
}

export default Navbar;