import React, { useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

function Settings() {
  const { user } = useAuth();
  const [pwMsg, setPwMsg] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg("");
    if (newPw !== confirmPw) { setPwMsg("error:New passwords do not match."); return; }
    if (newPw.length < 6) { setPwMsg("error:Password must be at least 6 characters."); return; }
    setSavingPw(true);
    try {
      await api.post("/auth/change-password", { new_password: newPw });
      setPwMsg("success:Password updated successfully.");
      setNewPw(""); setConfirmPw("");
    } catch (err) {
      setPwMsg("error:" + (err.response?.data?.detail || "Failed to update password."));
    } finally {
      setSavingPw(false);
    }
  };

  const isSuccess = pwMsg.startsWith("success:");
  const msgText = pwMsg.startsWith("success:") || pwMsg.startsWith("error:") ? pwMsg.slice(8) : pwMsg;

  return (
    <div>
      <h1 className="dashboard-page-title">Profile & Settings</h1>
      <p className="dashboard-page-subtitle">Manage your account information and preferences.</p>

      <div className="dashboard-grid dashboard-cards-2">
        {/* Personal Info — read-only */}
        <div className="dashboard-card">
          <h3>Personal Information</h3>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "18px" }}>
            Your profile details are managed by the system. Contact support to request changes.
          </p>
          <div style={{ marginBottom: "14px" }}>
            <label className="form-label">Username</label>
            <input className="form-input" type="text" value={user?.nickname || ""} readOnly
              style={{ opacity: 0.6, cursor: "not-allowed" }} />
          </div>
          <div style={{ marginBottom: "14px" }}>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={user?.email || "—"} readOnly
              style={{ opacity: 0.6, cursor: "not-allowed" }} />
          </div>
          <div>
            <label className="form-label">Role</label>
            <input className="form-input" type="text" value={user?.role || "user"} readOnly
              style={{ opacity: 0.6, cursor: "not-allowed", textTransform: "capitalize" }} />
          </div>
        </div>

        {/* Change Password */}
        <div className="dashboard-card">
          <h3>Change Password</h3>
          {pwMsg && (
            <p style={{ color: isSuccess ? "#67d58c" : "#f08f8f", fontSize: "13px", marginBottom: "14px" }}>
              {msgText}
            </p>
          )}
          <form onSubmit={handlePasswordChange}>
            <div style={{ marginBottom: "14px" }}>
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={newPw}
                onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" required />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" required />
            </div>
            <button className="primary-btn" type="submit" disabled={savingPw} style={{ width: "100%" }}>
              {savingPw ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}

export default Settings;
