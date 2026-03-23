import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

function ChangePassword() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ new_password: "", confirm_password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.new_password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.new_password !== form.confirm_password) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      await api.post("/auth/change-password", { new_password: form.new_password });
      // Refresh user object so must_change_password is now false
      const meRes = await api.get("/auth/me");
      login(localStorage.getItem("token"), meRes.data);
      navigate("/counselor");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "420px", background: "linear-gradient(180deg,#1a1a1d,#171719)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", padding: "36px 32px" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: "24px", color: "#f4f4f4" }}>Set Your Password</h2>
        <p style={{ margin: "0 0 28px", color: "#8f97a8", fontSize: "14px", lineHeight: 1.6 }}>
          Welcome, <strong style={{ color: "#caa38f" }}>{user?.nickname}</strong>! For security, please set a new password before accessing your dashboard.
        </p>

        {error && (
          <p style={{ color: "#f08f8f", fontSize: "14px", marginBottom: "16px", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: "10px" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#b8bfcc", fontSize: "14px" }}>New Password</label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={form.new_password}
              onChange={(e) => setForm({ ...form, new_password: e.target.value })}
              required
              style={{ width: "100%", background: "#18181b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#f4f4f4", padding: "14px 16px", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#b8bfcc", fontSize: "14px" }}>Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat your new password"
              value={form.confirm_password}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              required
              style={{ width: "100%", background: "#18181b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#f4f4f4", padding: "14px 16px", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ height: "50px", border: "none", borderRadius: "12px", background: "#caa38f", color: "#111", fontSize: "16px", fontWeight: 700, cursor: "pointer", marginTop: "4px" }}
          >
            {loading ? "Saving..." : "Set Password & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
