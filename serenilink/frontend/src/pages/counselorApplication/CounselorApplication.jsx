import React from "react";
import { Link } from "react-router-dom";
import "./CounselorApplication.css";

function CounselorApplication() {
  return (
    <div className="counselor-page">
      <div className="register-topbar">
        <div className="register-brand">SereniLink</div>
        <Link to="/" className="register-back">
          ← Back Home
        </Link>
      </div>

      <div className="counselor-wrapper">
        <div className="counselor-header">
          <h1>
            Join Our <span>Counselor Network</span>
          </h1>
          <p>
            Help us provide safe, anonymous mental health support for youth.
            Share your expertise and make a difference.
          </p>
        </div>

        <form className="counselor-form">
          <section className="counselor-card card-small">
            <h2>Personal Information</h2>
            <div className="counselor-grid two">
              <div className="field">
                <label>Full Name</label>
                <input type="text" placeholder="John Doe" />
              </div>

              <div className="field">
                <label>Email Address</label>
                <input type="email" placeholder="john@example.com" />
              </div>

              <div className="field">
                <label>Phone Number</label>
                <input type="text" placeholder="+1 (555) 000-0000" />
              </div>

              <div className="field">
                <label>Location (City, Country)</label>
                <input type="text" placeholder="New York, USA" />
              </div>
            </div>
          </section>

          <section className="counselor-card card-large">
            <h2>Professional Details</h2>
            <div className="counselor-grid three">
              <div className="field">
                <label>Professional Title</label>
                <input type="text" placeholder="e.g. Clinical Psychologist" />
              </div>

              <div className="field">
                <label>Primary Specialization</label>
                <select>
                  <option>Select an option</option>
                  <option>Anxiety</option>
                  <option>Depression</option>
                  <option>Trauma</option>
                  <option>Youth Counseling</option>
                  <option>Relationship Counseling</option>
                </select>
              </div>

              <div className="field">
                <label>Years of Experience</label>
                <input type="number" placeholder="5" />
              </div>
            </div>

            <div className="field full-width-field">
              <label>Professional Bio</label>
              <textarea
                rows="5"
                placeholder="Briefly describe your professional journey and expertise..."
              ></textarea>
            </div>

            <div className="field full-width-field no-margin">
              <label>Counseling Approach</label>
              <textarea
                rows="5"
                placeholder="How do you typically work with your clients? What methodologies do you use?"
              ></textarea>
            </div>
          </section>

          <section className="counselor-card card-medium">
            <h2>Qualifications & Credentials</h2>
            <div className="counselor-grid two">
              <div className="field">
                <label>Highest Certification / Degree</label>
                <input type="text" placeholder="e.g. Master's in Psychology" />
              </div>

              <div className="field">
                <label>Issuing Institution</label>
                <input type="text" placeholder="University Name" />
              </div>
            </div>

            <div className="field no-margin">
              <label>Upload Credentials (Certifications, Licenses)</label>
              <div className="upload-box">
                <input type="file" />
                <p>Click to upload or drag and drop</p>
                <span>PDF, JPG, or PNG (Max 5MB per file)</span>
              </div>
            </div>
          </section>

          <section className="counselor-card card-small">
            <h2>Session Preferences</h2>
            <div className="counselor-grid three">
              <div className="field no-margin">
                <label>Languages Offered</label>
                <input type="text" placeholder="English, Spanish, etc." />
              </div>

              <div className="field no-margin">
                <label>Preferred Session Type</label>
                <select>
                  <option>Video Call</option>
                  <option>Audio Call</option>
                  <option>Chat</option>
                </select>
              </div>

              <div className="field no-margin">
                <label>Preferred Duration</label>
                <select>
                  <option>30 Minutes</option>
                  <option>45 Minutes</option>
                  <option>60 Minutes</option>
                </select>
              </div>
            </div>
          </section>

          <label className="counselor-check">
            <input type="checkbox" />
            <span>
              I agree to SereniLink&apos;s Terms of Service and Privacy Policy.
              I certify that all information provided is accurate and truthful.
            </span>
          </label>

          <button type="submit" className="submit-btn">
            Submit Application
          </button>
        </form>
      </div>
    </div>
  );
}

export default CounselorApplication;