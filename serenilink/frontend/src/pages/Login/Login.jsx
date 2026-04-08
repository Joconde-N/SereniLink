import React, { useState, useEffect } from "react";
import "./login.css";
import { Link, useNavigate } from "react-router-dom";
import loginImage from "../../assets/login.png";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { LuEye, LuEyeOff } from "react-icons/lu";

function Login() {
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      const role = user.role;
      navigate(role === "admin" ? "/admin" : role === "counselor" ? "/counselor" : "/dashboard", { replace: true });
    }
  }, [user, authLoading]);

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("username", form.username);
      params.append("password", form.password);

      const res = await api.post("/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const meRes = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${res.data.access_token}` },
      });

      login(res.data.access_token, meRes.data);
      const role = meRes.data.role;
      navigate(role === "admin" ? "/admin" : role === "counselor" ? "/counselor" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-topbar">
        <div className="login-brand">SereniLink</div>
        <Link to="/" className="login-back">
          ← Back Home
        </Link>
      </div>

      <div className="login-left">
        <img src={loginImage} alt="SereniLink community" className="login-image" />
        <div className="login-image-overlay"></div>
        <div className="login-left-content">
          <div className="login-tag">COMMUNITY FOCUSED</div>
          <h1>
            Empowering
            <br />
            Diverse
            <br />
            Youth Through
            <br />
            Connection
          </h1>
          <p>
            Join a supportive ecosystem designed to bridge the gap in mental
            wellness. Your journey to clarity and support starts here.
          </p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-box">
          <h2>Welcome Back</h2>
          <p className="login-subtext">
            Enter your credentials to access your SereniLink dashboard.
          </p>

          {error && <p style={{ color: "red", marginBottom: "12px", fontSize: "14px" }}>{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label>Username</label>
              <input
                type="text"
                name="username"
                placeholder="e.g. alex123"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="login-field">
              <label>Password</label>
              <div className="login-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <span
                  className="login-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: "pointer" }}
                >
                  {showPassword ? <LuEyeOff /> : <LuEye />}
                </span>
              </div>
            </div>

            <div className="login-options">
              <label className="login-remember">
                <input type="checkbox" />
                <span>Remember Me</span>
              </label>
              <a href="/" onClick={(e) => e.preventDefault()} className="login-forgot">
                Forgot Password?
              </a>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="login-bottom-links">
            <p>
              Don&apos;t have an account? <Link to="/register">Register</Link>
            </p>
            <p>
              Are you a Counselor?{" "}
              <Link to="/counselor-application">Apply as Counselor</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
