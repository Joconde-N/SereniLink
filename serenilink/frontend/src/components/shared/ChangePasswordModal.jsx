import React, { useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

/**
 * Modal shown when a counselor must set a new password after approval.
 * Blocks the dashboard until the password is saved.
 */
function ChangePasswordModal() {
  const { login, user, updateUser } = useAuth();
  const [form, setForm] = useState({ new_password: "", confirm_password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.new_password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/change-password", { new_password: form.new_password });
      const meRes = await api.get("/auth/me");
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      login(token, meRes.data);
      updateUser(meRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="set-password-title">
      <div className="password-modal-card">
        <h2 id="set-password-title">Set Your Password</h2>
        <p>
          Welcome, <strong>{user?.nickname}</strong>! For security, please set a new password
          before using your counselor dashboard.
        </p>

        {error && <p className="password-modal-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label className="form-label">New Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="At least 6 characters"
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            required
          />

          <label className="form-label" style={{ marginTop: 14 }}>Confirm Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="Repeat your new password"
            value={form.confirm_password}
            onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
            required
          />

          <button type="submit" className="primary-btn" disabled={loading} style={{ width: "100%", marginTop: 18 }}>
            {loading ? "Saving..." : "Set Password & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;
