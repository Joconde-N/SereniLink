import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

function Settings() {
  const { user, login } = useAuth();
  const [profileMsg, setProfileMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const [nickname, setNickname] = useState(user?.nickname || "");
  const [email, setEmail] = useState(user?.email || "");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // Profile info is read-only from backend (no update endpoint exists yet)
  // We show the data and allow password change via re-register flow isn't available
  // so we just display account info and provide a password note

  const handleProfileSave = (e) => {
    e.preventDefault();
    setProfileMsg("Profile updates are not yet supported by the server. Your info is shown as-is.");
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg("");
    if (newPw !== confirmPw) { setPwMsg("New passwords do not match."); return; }
    if (newPw.length < 6) { setPwMsg("Password must be at least 6 characters."); return; }
    setPwMsg("Password change is not yet supported by the server API.");
  };

  return (
    <div>
      <h1 className="dashboard-page-title">Profile & Settings</h1>
      <p className="dashboard-page-subtitle">Manage your account information and preferences.</p>

      <div className="dashboard-grid dashboard-cards-2">
        {/* Personal Info */}
        <div className="dashboard-card">
          <h3>Personal Information</h3>
          {profileMsg && (
            <p style={{ color: profileMsg.includes("not") ? "#f5c95f" : "#67d58c", fontSize: "13px", marginBottom: "12px" }}>
              {profileMsg}
            </p>
          )}
          <form onSubmit={handleProfileSave}>
            <div className="form-grid-2" style={{ marginBottom: "16px" }}>
              <div>
                <label className="form-label">Username (Nickname)</label>
                <input className="form-input" type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label className="form-label">Role</label>
              <input className="form-input" type="text" value={user?.role || "user"} readOnly
                style={{ opacity: 0.6, cursor: "not-allowed" }} />
            </div>

            <button className="primary-btn" type="submit" disabled={savingProfile} style={{ width: "100%" }}>
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="dashboard-card">
          <h3>Change Password</h3>
          {pwMsg && (
            <p style={{ color: pwMsg.includes("not") || pwMsg.includes("match") ? "#f08f8f" : "#67d58c", fontSize: "13px", marginBottom: "12px" }}>
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
            <button className="primary-btn" type="submit" disabled={savingPw} style={{ width: "100%" }}>
              {savingPw ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>

      {/* Account Details */}
      <div className="dashboard-card" style={{ marginTop: "20px" }}>
        <h3>Account Details</h3>
        <div className="list-stack">
          <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Account Type</span>
            <span style={{ color: "var(--accent)", fontWeight: 600, textTransform: "capitalize" }}>{user?.role || "user"}</span>
          </div>
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
        </div>
      </div>
    </div>
  );
}

export default Settings;
