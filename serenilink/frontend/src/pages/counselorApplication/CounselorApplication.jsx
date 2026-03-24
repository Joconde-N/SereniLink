import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CounselorApplication.css";
import api from "../../api/axios";

function CounselorApplication() {
  const navigate = useNavigate();
  const [agreed, setAgreed]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [profilePreview, setProfilePreview] = useState(null);

  const [form, setForm] = useState({
    full_name: "", email: "", phone_number: "", general_location: "",
    title: "", specialization: "", years_of_experience: "",
    bio: "", counseling_approach: "",
    highest_certification: "", issuing_institution: "",
    office_address: "", offers_online: true, offers_in_person: false,
    languages_offered: "", preferred_session_type: "Video Call", preferred_duration: "30 Minutes",
    profile_image_url: "",
  });

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleProfilePic = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setProfilePreview(url);
    setForm((prev) => ({ ...prev, profile_image_url: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!agreed) { setError("You must agree to the Terms of Service and Privacy Policy."); return; }

    setLoading(true);
    try {
      await api.post("/counselor-applications/", {
        ...form,
        years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience) : null,
        phone_number: form.phone_number || null,
        title: form.title || null,
        bio: form.bio || null,
        counseling_approach: form.counseling_approach || null,
        highest_certification: form.highest_certification || null,
        issuing_institution: form.issuing_institution || null,
        general_location: form.general_location || null,
        office_address: form.office_address || null,
        languages_offered: form.languages_offered || null,
      });
      setSuccess("Application submitted! We will review it and send your login credentials to your email once approved.");
      setTimeout(() => navigate("/"), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

        {error && <p style={{ color: "red", textAlign: "center", marginBottom: "16px" }}>{error}</p>}
        {success && <p style={{ color: "#67d58c", textAlign: "center", marginBottom: "16px" }}>{success}</p>}

        <form className="counselor-form" onSubmit={handleSubmit}>
          <section className="counselor-card card-small">
            <h2>Personal Information</h2>
            <div className="counselor-grid two">
              <div className="field">
                <label>Full Name</label>
                <input type="text" name="full_name" placeholder="John Doe" value={form.full_name} onChange={set} required />
              </div>

              <div className="field">
                <label>Email Address</label>
                <input type="email" name="email" placeholder="john@example.com" value={form.email} onChange={set} required />
              </div>

              <div className="field">
                <label>Phone Number</label>
                <input type="text" name="phone_number" placeholder="+1 (555) 000-0000" value={form.phone_number} onChange={set} />
              </div>

              <div className="field">
                <label>Location (City, Country)</label>
                <input type="text" name="general_location" placeholder="New York, USA" value={form.general_location} onChange={set} />
              </div>
            </div>
            <div className="field no-margin">
              <label>Upload Profile Picture</label>
              <div className="upload-box">
                <input type="file" accept="image/*" onChange={handleProfilePic} />
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Preview"
                    style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", margin: "0 auto 10px", display: "block", border: "2px solid #E19A86" }}
                  />
                ) : (
                  <p>Click to upload or drag and drop</p>
                )}
                <span>{profilePreview ? "Click to change photo" : "JPG or PNG (Max 5MB)"}</span>
              </div>
            </div>
          </section>

          <section className="counselor-card card-large">
            <h2>Professional Details</h2>
            <div className="counselor-grid three">
              <div className="field">
                <label>Professional Title</label>
                <input type="text" name="title" placeholder="e.g. Clinical Psychologist" value={form.title} onChange={set} />
              </div>

              <div className="field">
                <label>Primary Specialization</label>
                <select name="specialization" value={form.specialization} onChange={set} required>
                  <option value="">Select an option</option>
                  <option>Anxiety</option>
                  <option>Depression</option>
                  <option>Trauma</option>
                  <option>Youth Counseling</option>
                  <option>Relationship Counseling</option>
                </select>
              </div>

              <div className="field">
                <label>Years of Experience</label>
                <input type="number" name="years_of_experience" placeholder="5" value={form.years_of_experience} onChange={set} />
              </div>
            </div>

            <div className="field full-width-field">
              <label>Professional Bio</label>
              <textarea name="bio" rows="5" placeholder="Briefly describe your professional journey and expertise..." value={form.bio} onChange={set}></textarea>
            </div>

            <div className="field full-width-field no-margin">
              <label>Counseling Approach</label>
              <textarea name="counseling_approach" rows="5" placeholder="How do you typically work with your clients? What methodologies do you use?" value={form.counseling_approach} onChange={set}></textarea>
            </div>
          </section>

          <section className="counselor-card card-medium">
            <h2>Qualifications &amp; Credentials</h2>
            <div className="counselor-grid two">
              <div className="field">
                <label>Highest Certification / Degree</label>
                <input type="text" name="highest_certification" placeholder="e.g. Master's in Psychology" value={form.highest_certification} onChange={set} />
              </div>

              <div className="field">
                <label>Issuing Institution</label>
                <input type="text" name="issuing_institution" placeholder="University Name" value={form.issuing_institution} onChange={set} />
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
                <input type="text" name="languages_offered" placeholder="English, Spanish, etc." value={form.languages_offered} onChange={set} />
              </div>

              <div className="field no-margin">
                <label>Preferred Session Type</label>
                <select name="preferred_session_type" value={form.preferred_session_type} onChange={set}>
                  <option>Video Call</option>
                  <option>Audio Call</option>
                  <option>Chat</option>
                </select>
              </div>

              <div className="field no-margin">
                <label>Preferred Duration</label>
                <select name="preferred_duration" value={form.preferred_duration} onChange={set}>
                  <option>30 Minutes</option>
                  <option>45 Minutes</option>
                  <option>60 Minutes</option>
                </select>
              </div>
            </div>
          </section>

          <label className="counselor-check">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              I agree to SereniLink&apos;s Terms of Service and Privacy Policy.
              I certify that all information provided is accurate and truthful.
            </span>
          </label>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CounselorApplication;
