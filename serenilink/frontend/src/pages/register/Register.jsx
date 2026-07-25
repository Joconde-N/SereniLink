import React, { useState } from "react";
import "./Register.css";
import { Link, useNavigate } from "react-router-dom";
import registerImage from "../../assets/register.png";
import api from "../../api/axios";

const RULES = [
  { key: "length",    label: "At least 8 characters",          test: (p) => p.length >= 8 },
  { key: "uppercase", label: "At least one uppercase letter",  test: (p) => /[A-Z]/.test(p) },
  { key: "number",    label: "At least one number",            test: (p) => /[0-9]/.test(p) },
  { key: "special",   label: "At least one special character", test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

function getStrength(password) {
  const passed = RULES.filter((r) => r.test(password)).length;
  if (passed === 0) return null;
  if (passed <= 1) return { level: 1, label: "Weak",   color: "#f08f8f" };
  if (passed === 2) return { level: 2, label: "Fair",   color: "#f5c95f" };
  if (passed === 3) return { level: 3, label: "Good",   color: "#60a5fa" };
  return             { level: 4, label: "Strong", color: "#67d58c" };
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const strength = getStrength(password);

  return (
    <div style={{ marginTop: 10 }}>
      {/* Bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 4, borderRadius: 999,
              background: strength && i <= strength.level ? strength.color : "var(--border-soft)",
              transition: "background 0.25s ease",
            }}
          />
        ))}
      </div>

      {/* Label */}
      {strength && (
        <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: strength.color }}>
          {strength.label}
        </p>
      )}

      {/* Checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {RULES.map((rule) => {
          const passed = rule.test(password);
          return (
            <div key={rule.key} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
              <span style={{
                width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: passed ? "rgba(103,213,140,0.15)" : "var(--bg-input)",
                border: `1px solid ${passed ? "#67d58c" : "var(--border-soft)"}`,
                fontSize: 9, color: passed ? "#67d58c" : "transparent",
                transition: "all 0.2s ease",
              }}>
                ✓
              </span>
              <span style={{ color: passed ? "var(--text-soft)" : "var(--text-muted)", transition: "color 0.2s ease" }}>
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agreed, setAgreed]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const failedRules = RULES.filter((r) => !r.test(form.password));
    if (failedRules.length > 0) {
      setError(`Password must meet all requirements.`);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("You must agree to the terms and conditions.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        nickname: form.nickname,
        email: form.email || undefined,
        password: form.password,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-topbar">
        <div className="register-brand">SereniLink</div>
        <Link to="/" className="register-back">← Back Home</Link>
      </div>

      <div className="register-left">
        <img src={registerImage} alt="SereniLink community" className="register-image" />
        <div className="register-image-overlay"></div>
        <div className="register-left-content">
          <div className="register-tag">EMPOWERING MINDS</div>
          <h1>
            Start your journey to
            <br />mental well-being
            <br />today.
          </h1>
          <p>
            Join a supportive community of thousands finding peace, balance, and
            growth with SereniLink&apos;s modern wellness platform.
          </p>
        </div>
      </div>

      <div className="register-right">
        <div className="register-form-box">
          <h2>Join Us</h2>
          <p className="register-subtext"> <em>You choose your username.No real name needed.</em>
            
          </p>

          {error && (
            <p style={{ color: "#f08f8f", marginBottom: 12, fontSize: 14 }}>{error}</p>
          )}

          {success && (
            <div style={{
              marginBottom: 20, padding: "14px 18px", borderRadius: 12,
              background: "rgba(103,213,140,0.1)", border: "1px solid rgba(103,213,140,0.25)",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>✓</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#67d58c" }}>Account created successfully!</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-soft)" }}>Redirecting you to login...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="register-field">
              <label>Username (Nickname)</label>
              <input
                type="text"
                name="nickname"
                placeholder="e.g. alex123"
                value={form.nickname}
                onChange={handleChange}
                required
              />
            </div>

            <div className="register-field">
              <label>Email Address (Optional — used only for password recovery)</label>
              <input
                type="email"
                name="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="register-split">
              <div className="register-field">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <PasswordStrength password={form.password} />
              </div>

              <div className="register-field">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <label className="register-terms">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>I agree to the terms and conditions &amp; privacy policy</span>
            </label>

        

            <button type="submit" className="register-btn" disabled={loading || success}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
            <p className="register-subtext" style={{ textAlign: "center" }}>
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
