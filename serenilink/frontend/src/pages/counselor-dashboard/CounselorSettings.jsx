import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

function CounselorSettings() {
  const { user } = useAuth();
  const [pwMsg, setPwMsg]     = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setPwMsg("");
    if (newPw !== confirmPw) { setPwMsg("New passwords do not match."); return; }
    if (newPw.length < 6)    { setPwMsg("Password must be at least 6 characters."); return; }
    setPwMsg("Password change is not yet supported by the server API.");
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
          {pwMsg && (
            <p style={{ color: pwMsg.includes("not") || pwMsg.includes("match") ? "#f08f8f" : "#f5c95f", fontSize: "13px", marginBottom: "12px" }}>
              {pwMsg}
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
            <button className="primary-btn" type="submit" style={{ width: "100%" }}>
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CounselorSettings;
