import React from "react";
import "./Register.css";
import { Link } from "react-router-dom";
import registerImage from "../../assets/register.png";

function Register() {
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
            Join a supportive community of thousands finding peace,
            balance, and growth with SereniLink&apos;s modern wellness platform.
          </p>
        </div>
      </div>

      <div className="register-right">
        <div className="register-form-box">
          <h2>Join Us</h2>
          <p className="register-subtext">
            Already have an account? <Link to="/login">Log in</Link>
          </p>

          <form>
            <div className="register-field">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" />
            </div>

            <div className="register-field">
              <label>Email Address</label>
              <input type="email" placeholder="john@example.com" />
            </div>

            <div className="register-split">
              <div className="register-field">
                <label>Password</label>
                <input type="password" placeholder="••••••••" />
              </div>

              <div className="register-field">
                <label>Confirm Password</label>
                <input type="password" placeholder="••••••••" />
              </div>
            </div>

            <label className="register-terms">
              <input type="checkbox" />
              <span>I agree to the terms and conditions &amp; privacy policy</span>
            </label>

            <button type="submit" className="register-btn">
              Create Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;