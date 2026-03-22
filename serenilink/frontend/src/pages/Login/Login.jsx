import React from "react";
import "./login.css";
import { Link } from "react-router-dom";
import loginImage from "../../assets/login.png";

function Login() {
  return (
    <div className="login-page">
      <div className="login-topbar">
        <div className="login-brand">SereniLink</div>
        <Link to="/" className="login-back">
          ← Back Home
        </Link>
      </div>

      <div className="login-left">
        <img src= {loginImage} alt="SereniLink community" className="login-image" />

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
            Join a supportive ecosystem designed to bridge the gap in
            mental wellness. Your journey to clarity and support starts
            here.
          </p>

        </div>
      </div>

      <div className="login-right">
        <div className="login-form-box">
          <h2>Welcome Back</h2>
          <p className="login-subtext">
            Enter your credentials to access your SereniLink dashboard.
          </p>

          <form>
            <div className="login-field">
              <label>Email or Username</label>
              <input type="text" placeholder="e.g. alex@serenilink.com" />
            </div>

            <div className="login-field">
              <label>Password</label>
              <div className="login-password-wrap">
                <input type="password" placeholder="••••••••" />
                <span className="login-eye">◉</span>
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

            <button type="submit" className="login-btn">
              Login
            </button>
          </form>

          <div className="login-bottom-links">
            <p>
              Don&apos;t have an account? <Link to="/register">Register</Link>
            </p>
            <p>
              Are you a Counselor? <Link to="/counselor-application">Apply as Counselor</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;