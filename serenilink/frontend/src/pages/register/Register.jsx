import React, { useState } from "react";
import "./Register.css";
import { Link, useNavigate } from "react-router-dom";
import registerImage from "../../assets/register.png";
import api from "../../api/axios";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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
      navigate("/login");
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
        <Link to="/" className="register-back">
          ← Back Home
        </Link>
      </div>

      <div className="register-left">
        <img src={registerImage} alt="SereniLink community" className="register-image" />
        <div className="register-image-overlay"></div>
        <div className="register-left-content">
          <div className="register-tag">EMPOWERING MINDS</div>
          <h1>
            Start your journey to
            <br />
            mental well-being
            <br />
            today.
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
          <p className="register-subtext">
            Already have an account? <Link to="/login">Log in</Link>
          </p>

          {error && <p style={{ color: "red", marginBottom: "12px", fontSize: "14px" }}>{error}</p>}

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
              <label>Email Address (optional)</label>
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

            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
