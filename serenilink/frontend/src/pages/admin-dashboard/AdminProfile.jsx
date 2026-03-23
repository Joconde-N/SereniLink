import React from "react";
import { useAuth } from "../../context/AuthContext";

function AdminProfile() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="dashboard-page-title">Profile</h1>
      <p className="dashboard-page-subtitle">Your admin account information.</p>

      <div className="dashboard-card" style={{ maxWidth: "520px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#111", fontWeight: 700, fontSize: "26px", flexShrink: 0 }}>
            {user?.nickname?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "22px" }}>{user?.nickname ?? "—"}</h2>
            <span style={{ padding: "3px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: "rgba(245,201,95,0.1)", color: "#f5c95f" }}>
              Admin
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            { label: "User ID",  value: user?.id },
            { label: "Nickname", value: user?.nickname },
            { label: "Email",    value: user?.email ?? "Not set" },
            { label: "Role",     value: user?.role },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-faint)" }}>
              <span className="small-muted">{label}</span>
              <span style={{ fontWeight: 600, fontSize: "14px" }}>{value ?? "—"}</span>
            </div>
          ))}
        </div>

        <p className="small-muted" style={{ marginTop: "20px", fontSize: "13px" }}>
          Profile editing is not available via the API. Contact a system administrator to update account details.
        </p>
      </div>
    </div>
  );
}

export default AdminProfile;
