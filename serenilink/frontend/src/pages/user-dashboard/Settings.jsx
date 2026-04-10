import React, { useState } from "react";
import { LuUser, LuLock, LuPalette, LuCheck, LuMoon, LuSun } from "react-icons/lu";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
      <div style={{
        width: "38px", height: "38px", borderRadius: "10px",
        background: "rgba(202,163,143,0.1)", border: "1px solid rgba(202,163,143,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={17} color="var(--accent)" />
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>{title}</h3>
        {subtitle && <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function Settings() {
  const { user, updateUser } = useAuth();
  const { theme, toggle } = useTheme();

  const [email, setEmail] = useState(user?.email || "");
  const [emailMsg, setEmailMsg] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const handleEmailSave = async (e) => {
    e.preventDefault();
    setEmailMsg("");
    setSavingEmail(true);
    try {
      const res = await api.patch("/auth/me", { email });
      updateUser({ email: res.data.email });
      setEmailMsg("success:Email updated successfully.");
    } catch (err) {
      setEmailMsg("error:" + (err.response?.data?.detail || "Failed to update email."));
    } finally {
      setSavingEmail(false);
      setTimeout(() => setEmailMsg(""), 4000);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg("");
    if (newPw !== confirmPw) { setPwMsg("error:Passwords do not match."); return; }
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
      setTimeout(() => setPwMsg(""), 4000);
    }
  };

  const msgStyle = (msg) => ({
    fontSize: "13px", marginBottom: "14px",
    color: msg.startsWith("success:") ? "#67d58c" : "#f08f8f",
  });

  const msgText = (msg) => msg.replace(/^(success:|error:)/, "");

  return (
    <div>
      <h1 className="dashboard-page-title">Settings</h1>
      <p className="dashboard-page-subtitle">Manage your account and preferences.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="dashboard-grid dashboard-cards-2">

        {/* Personal Information */}
        <div className="dashboard-card">
          <SectionHeader icon={LuUser} title="Personal Information" subtitle="Update your account details" />

          <div style={{ marginBottom: "16px" }}>
            <label className="form-label">Username</label>
            <input
              className="form-input" type="text"
              value={user?.nickname || ""} readOnly
              style={{ opacity: 0.5, cursor: "not-allowed" }}
            />
            <p style={{ margin: "6px 0 0", fontSize: "11px", color: "var(--text-muted)" }}>
              Username cannot be changed. Contact support if needed.
            </p>
          </div>

          <form onSubmit={handleEmailSave}>
            {emailMsg && <p style={msgStyle(emailMsg)}>{msgText(emailMsg)}</p>}
            <div style={{ marginBottom: "16px" }}>
              <label className="form-label">Email Address</label>
              <input
                className="form-input" type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <button
              className="primary-btn" type="submit"
              disabled={savingEmail || email === user?.email}
              style={{ height: "40px", padding: "0 20px", fontSize: "14px" }}
            >
              {savingEmail ? "Saving..." : "Save Email"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="dashboard-card">
          <SectionHeader icon={LuLock} title="Change Password" subtitle="Keep your account secure" />

          <form onSubmit={handlePasswordChange}>
            {pwMsg && <p style={msgStyle(pwMsg)}>{msgText(pwMsg)}</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "16px" }}>
              <div>
                <label className="form-label">New Password</label>
                <input
                  className="form-input" type="password"
                  value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  placeholder="••••••••" required
                />
              </div>
              <div>
                <label className="form-label">Confirm Password</label>
                <input
                  className="form-input" type="password"
                  value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="••••••••" required
                />
              </div>
            </div>
            <button
              className="primary-btn" type="submit"
              disabled={savingPw}
              style={{ height: "40px", padding: "0 20px", fontSize: "14px" }}
            >
              {savingPw ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
        </div>

        {/* Appearance */}
        <div className="dashboard-card">
          <SectionHeader icon={LuPalette} title="Appearance" subtitle="Customize how SereniLink looks" />

          <div style={{ display: "flex", gap: "12px" }}>
            {["dark", "light"].map((t) => (
              <button
                key={t} type="button"
                onClick={() => t !== theme && toggle()}
                style={{
                  flex: 1, padding: "14px 16px", borderRadius: "14px", cursor: t === "light" ? "not-allowed" : "pointer",
                  border: theme === t ? "1px solid var(--accent)" : "1px solid var(--border-soft)",
                  background: theme === t ? "rgba(202,163,143,0.08)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  opacity: t === "light" ? 0.45 : 1,
                }}
                disabled={t === "light"}
                title={t === "light" ? "Light theme coming soon" : ""}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {t === "dark" ? <LuMoon size={18} color="var(--accent)" /> : <LuSun size={18} color="var(--accent)" />}
                  <div style={{ textAlign: "left" }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--text-main)", textTransform: "capitalize" }}>{t}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>
                      {t === "light" ? "Coming soon" : "Default theme"}
                    </p>
                  </div>
                </div>
                {theme === t && <LuCheck size={16} color="var(--accent)" />}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Settings;
