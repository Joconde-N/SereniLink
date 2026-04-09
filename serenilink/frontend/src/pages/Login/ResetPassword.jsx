import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import { LuEye, LuEyeOff } from "react-icons/lu";
import "../Login/login.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid or expired reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ gridTemplateColumns: "1fr" }}>
      <div className="login-topbar">
        <div className="login-brand">SereniLink</div>
        <Link to="/login" className="login-back">← Back to Login</Link>
      </div>

      <div className="login-right" style={{ minHeight: "100vh" }}>
        <div className="login-form-box">
          <h2>New Password</h2>
          <p className="login-subtext">Enter a new password for your account.</p>

          {!token ? (
            <p style={{ color: "#eb5757", fontSize: 14 }}>Invalid reset link. Please request a new one.</p>
          ) : success ? (
            <p style={{ color: "#6fcf97", fontSize: 15 }}>
              Password reset successfully! Redirecting to login...
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <p style={{ color: "#eb5757", marginBottom: 14, fontSize: 14 }}>{error}</p>}

              <div className="login-field">
                <label>New Password</label>
                <div className="login-password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span className="login-eye" onClick={() => setShowPassword(!showPassword)} style={{ cursor: "pointer" }}>
                    {showPassword ? <LuEyeOff /> : <LuEye />}
                  </span>
                </div>
              </div>

              <div className="login-field">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
