import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

function AdminSettings() {
  const { user } = useAuth();
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [msg, setMsg]   = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      setMsg({ text: "New passwords do not match.", ok: false });
      return;
    }
    // No password change endpoint in backend — inform user
    setMsg({ text: "Password change is not yet supported by the API.", ok: false });
    setTimeout(() => setMsg(""), 4000);
  };

  return (
    <div>
      <h1 className="dashboard-page-title">Settings</h1>
      <p className="dashboard-page-subtitle">Manage your admin account settings.</p>

      {/* Account Info */}
      <div className="dashboard-card" style={{ maxWidth: "520px", marginBottom: "20px" }}>
        <h3>Account Info</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { label: "Nickname", value: user?.nickname },
            { label: "Email",    value: user?.email ?? "Not set" },
            { label: "Role",     value: user?.role },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-faint)" }}>
              <span className="small-muted">{label}</span>
              <span style={{ fontWeight: 600, fontSize: "14px" }}>{value ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Password Change */}
      <div className="dashboard-card" style={{ maxWidth: "520px" }}>
        <h3>Change Password</h3>

        {msg && (
          <div style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "10px", background: msg.ok ? "rgba(103,213,140,0.1)" : "rgba(239,68,68,0.1)", color: msg.ok ? "#67d58c" : "#f08f8f", border: `1px solid ${msg.ok ? "rgba(103,213,140,0.2)" : "rgba(239,68,68,0.2)"}`, fontSize: "14px" }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label className="form-label">Current Password</label>
            <input className="form-input" type="password" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} required />
          </div>
          <button className="primary-btn" type="submit" style={{ alignSelf: "flex-start" }}>Update Password</button>
        </form>
      </div>
    </div>
  );
}

export default AdminSettings;
