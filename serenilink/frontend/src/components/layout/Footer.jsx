import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="custom-footer">
      <div className="footer-top">
        <div className="footer-left">
          <p className="footer-description">
            SereniLink offers confidential AI support
            <br />
            and professional guidance for mental well-being.
          </p>

          <h3>Social Links</h3>

          <div className="social-icons">
            <span>X</span>
            <span>in</span>
            <span>◎</span>
            <span>f</span>
          </div>
        </div>

        <div className="footer-right">
          <h3>Quick Links</h3>

          <div className="footer-links-grid">
            <div>
              <Link to="/">Home</Link>
              <Link to="/about">About Us</Link>
              <Link to="/services">Services</Link>
            </div>

            <div>
              <Link to="/contact">Contact</Link>
              <Link to="/resources">Resources</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <h2>SereniLink</h2>
        <p>Copyright © SereniLink. Developed by Joconde</p>
      </div>
    </footer>
  );
}

export default Footer;