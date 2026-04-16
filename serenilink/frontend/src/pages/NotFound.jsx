import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#070808", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", textAlign: "center", padding: "20px" }}>
      <p style={{ fontSize: 96, fontWeight: 700, color: "var(--accent, #E19A86)", lineHeight: 1, margin: "0 0 16px" }}>404</p>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 12px" }}>Page Not Found</h1>
      <p style={{ fontSize: 16, color: "#b0b0b0", marginBottom: 32, maxWidth: 400 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" style={{ background: "#a86955", color: "#fff", padding: "12px 28px", borderRadius: 999, fontWeight: 600, fontSize: 15, textDecoration: "none" }}>
        Back to Home
      </Link>
    </div>
  );
}

export default NotFound;
