import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

function CounselorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState("");
  const [form, setForm]       = useState({
    full_name: "", title: "", bio: "", specialization: "",
    phone_number: "", general_location: "", office_address: "",
    offers_online: true, offers_in_person: false,
    show_phone_after_booking: true, show_office_after_booking: true,
  });

  useEffect(() => {
    api.get("/counselor-applications/me")
      .then((res) => {
        setProfile(res.data);
        setForm({
          full_name:                  res.data.full_name || "",
          title:                      res.data.title || "",
          bio:                        res.data.bio || "",
          specialization:             res.data.specialization || "",
          phone_number:               res.data.phone_number || "",
          general_location:           res.data.general_location || "",
          office_address:             res.data.office_address || "",
          offers_online:              res.data.offers_online ?? true,
          offers_in_person:           res.data.offers_in_person ?? false,
          show_phone_after_booking:   res.data.show_phone_after_booking ?? true,
          show_office_after_booking:  res.data.show_office_after_booking ?? true,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setMsg("Profile editing is not yet supported by the server API. Your current profile is shown as-is.");
  };

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading profile...</div>;

  return (
    <div>
      <h1 className="dashboard-page-title">My Profile</h1>
      <p className="dashboard-page-subtitle">Your counselor profile as seen by clients.</p>

      {msg && <p style={{ color: "#f5c95f", marginBottom: "16px", fontSize: "14px" }}>{msg}</p>}

      <div className="dashboard-grid dashboard-cards-2">
        {/* Profile Form */}
        <div className="dashboard-card">
          <h3>Professional Info</h3>
          <form onSubmit={handleSave}>
            <div className="form-grid-2" style={{ marginBottom: "16px" }}>
              <div>
                <label className="form-label">Full Name</label>
                <input className="form-input" name="full_name" value={form.full_name} onChange={handleChange} />
              </div>
              <div>
                <label className="form-label">Title</label>
                <input className="form-input" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Clinical Psychologist" />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label className="form-label">Specialization</label>
              <input className="form-input" name="specialization" value={form.specialization} onChange={handleChange} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label className="form-label">Bio</label>
              <textarea className="form-textarea" name="bio" value={form.bio} onChange={handleChange} rows={4} />
            </div>

            <div className="form-grid-2" style={{ marginBottom: "16px" }}>
              <div>
                <label className="form-label">Phone Number</label>
                <input className="form-input" name="phone_number" value={form.phone_number} onChange={handleChange} />
              </div>
              <div>
                <label className="form-label">Location</label>
                <input className="form-input" name="general_location" value={form.general_location} onChange={handleChange} />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label className="form-label">Office Address</label>
              <input className="form-input" name="office_address" value={form.office_address} onChange={handleChange} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {[
                ["offers_online",             "Offers Online Sessions"],
                ["offers_in_person",          "Offers In-Person Sessions"],
                ["show_phone_after_booking",  "Show Phone After Booking"],
                ["show_office_after_booking", "Show Office After Booking"],
              ].map(([name, label]) => (
                <label key={name} style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-soft)", fontSize: "14px", cursor: "pointer" }}>
                  <input type="checkbox" name={name} checked={form[name]} onChange={handleChange} />
                  {label}
                </label>
              ))}
            </div>

            <button className="primary-btn" type="submit" disabled={saving} style={{ width: "100%" }}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Status Card */}
        <div className="dashboard-card">
          <h3>Account Status</h3>
          <div className="list-stack">
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Application Status</span>
              <span style={{ color: "#67d58c", fontWeight: 600 }}>{profile?.application_status}</span>
            </div>
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Active</span>
              <span style={{ color: profile?.is_active ? "#67d58c" : "#f08f8f", fontWeight: 600 }}>
                {profile?.is_active ? "Yes" : "No"}
              </span>
            </div>
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Login Username</span>
              <span style={{ color: "var(--text-soft)" }}>{user?.nickname}</span>
            </div>
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Role</span>
              <span style={{ color: "var(--accent)", fontWeight: 600, textTransform: "capitalize" }}>{user?.role}</span>
            </div>
            {profile?.created_at && (
              <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Member Since</span>
                <span style={{ color: "var(--text-soft)" }}>{new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CounselorProfile;
