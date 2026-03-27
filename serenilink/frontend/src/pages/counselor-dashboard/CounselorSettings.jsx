import React, { useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

function CounselorSettings() {
  const { user } = useAuth();
  const [pwMsg, setPwMsg]         = useState({ text: "", ok: true });
  const [saving, setSaving]       = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg({ text: "", ok: true });
    if (newPw !== confirmPw) { setPwMsg({ text: "New passwords do not match.", ok: false }); return; }
    if (newPw.length < 6)   { setPwMsg({ text: "Password must be at least 6 characters.", ok: false }); return; }
    setSaving(true);
    try {
      await api.post("/auth/change-password", { new_password: newPw });
      setPwMsg({ text: "Password updated successfully.", ok: true });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      setPwMsg({ text: err.response?.data?.detail || "Failed to update password.", ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="dashboard-page-title">Settings</h1>
      <p className="dashboard-page-subtitle">Manage your account preferences and security.</p>

      <div className="dashboard-grid dashboard-cards-2">
        {/* Account Info */}
        <div className="dashboard-card">
          <h3>Account Information</h3>
          <div className="list-stack">
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Username</span>
              <span style={{ color: "var(--text-soft)" }}>{user?.nickname}</span>
            </div>
            {user?.email && (
              <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Email</span>
                <span style={{ color: "var(--text-soft)" }}>{user.email}</span>
              </div>
            )}
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Role</span>
              <span style={{ color: "#67d58c", fontWeight: 600, textTransform: "capitalize" }}>{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="dashboard-card">
          <h3>Change Password</h3>
          {pwMsg.text && (
            <p style={{ color: pwMsg.ok ? "#67d58c" : "#f08f8f", fontSize: "13px", marginBottom: "12px" }}>
              {pwMsg.text}
            </p>
          )}
          <form onSubmit={handlePasswordChange}>
            <div style={{ marginBottom: "14px" }}>
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" />
            </div>
            <button className="primary-btn" type="submit" disabled={saving} style={{ width: "100%" }}>
              {saving ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CounselorSettings;
