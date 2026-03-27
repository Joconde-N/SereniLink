import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LuPencil, LuCheck, LuX, LuShieldCheck, LuMapPin, LuPhone, LuUser, LuCamera } from "react-icons/lu";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const FALLBACK = (name) =>
  `https://ui-avatars.com/api/?background=caa38f&color=111&bold=true&size=128&name=${encodeURIComponent(name || "C")}`;

const EMPTY_FORM = {
  full_name: "", title: "", bio: "", specialization: "",
  profile_image_url: "", phone_number: "", general_location: "", office_address: "",
  offers_online: true, offers_in_person: false,
  show_phone_after_booking: true, show_office_after_booking: true,
  years_of_experience: "", counseling_approach: "",
  highest_certification: "", issuing_institution: "",
  languages_offered: "", preferred_session_type: "", preferred_duration: "",
};

function Tag({ label }) {
  return (
    <span style={{
      display: "inline-block", padding: "6px 14px", borderRadius: 999,
      background: "rgba(202,163,143,0.12)", color: "var(--accent)",
      fontSize: 13, fontWeight: 500, border: "1px solid rgba(202,163,143,0.2)",
    }}>
      {label}
    </span>
  );
}

// Defined outside — stable reference, no remount on parent re-render
function Field({ label, name, rows, type = "text", value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="form-label">{label}</label>
      {rows
        ? <textarea className="form-textarea" name={name} value={value ?? ""} onChange={onChange} rows={rows} />
        : <input className="form-input" type={type} name={name} value={value ?? ""} onChange={onChange} />
      }
    </div>
  );
}

function Check({ name, label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-soft)", fontSize: 14, cursor: "pointer", marginBottom: 10 }}>
      <input type="checkbox" name={name} checked={checked ?? false} onChange={onChange} style={{ accentColor: "var(--accent)" }} />
      {label}
    </label>
  );
}

export default function CounselorProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: true });
  const [form, setForm] = useState(EMPTY_FORM);
  const [imgPreview, setImgPreview] = useState(null);

  useEffect(() => {
    api.get("/counselors/me")
      .then((res) => { setProfile(res.data); populateForm(res.data); })
      .catch(() => setMsg({ text: "Could not load profile. Make sure you are logged in as a counselor.", ok: false }))
      .finally(() => setLoading(false));
  }, []);

  const populateForm = (data) => {
    setForm({
      full_name: data.full_name || "",
      title: data.title || "",
      bio: data.bio || "",
      specialization: data.specialization || "",
      profile_image_url: data.profile_image_url || "",
      phone_number: data.phone_number || "",
      general_location: data.general_location || "",
      office_address: data.office_address || "",
      offers_online: data.offers_online ?? true,
      offers_in_person: data.offers_in_person ?? false,
      show_phone_after_booking: data.show_phone_after_booking ?? true,
      show_office_after_booking: data.show_office_after_booking ?? true,
      years_of_experience: data.years_of_experience ?? "",
      counseling_approach: data.counseling_approach || "",
      highest_certification: data.highest_certification || "",
      issuing_institution: data.issuing_institution || "",
      languages_offered: data.languages_offered || "",
      preferred_session_type: data.preferred_session_type || "",
      preferred_duration: data.preferred_duration || "",
    });
    setImgPreview(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleImageFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setImgPreview(base64);
      setForm((prev) => ({ ...prev, profile_image_url: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg({ text: "", ok: true });
    try {
      const payload = {
        ...form,
        years_of_experience: form.years_of_experience !== "" ? parseInt(form.years_of_experience) : null,
      };
      const res = await api.patch("/counselors/me", payload);
      setProfile(res.data);
      populateForm(res.data);
      setEditing(false);
      setMsg({ text: "Profile updated successfully.", ok: true });
    } catch (err) {
      setMsg({ text: err.response?.data?.detail || "Failed to save. Please try again.", ok: false });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) populateForm(profile);
    setEditing(false);
    setMsg({ text: "", ok: true });
  };

  if (loading) return <div style={{ color: "var(--text-muted)", padding: 40 }}>Loading profile...</div>;

  const d = profile || {};
  const avatarSrc = (editing ? imgPreview || form.profile_image_url : d.profile_image_url) || FALLBACK(d.full_name);
  const specializations = (d.specialization || "").split(",").map(s => s.trim()).filter(Boolean);

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 className="dashboard-page-title" style={{ marginBottom: 4 }}>My Profile</h1>
          <p className="dashboard-page-subtitle" style={{ margin: 0 }}>How clients see you on SereniLink</p>
        </div>
        {!editing ? (
          <button className="primary-btn" onClick={() => setEditing(true)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LuPencil size={16} /> Edit Profile
          </button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button className="secondary-btn" onClick={handleCancel} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LuX size={16} /> Cancel
            </button>
            <button className="primary-btn" onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LuCheck size={16} /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {msg.text && (
        <p style={{ color: msg.ok ? "#67d58c" : "#f08f8f", marginBottom: 20, fontSize: 14, padding: "12px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 12 }}>
          {msg.text}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

        {/* ── LEFT ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Profile header card */}
          <div className="dashboard-card">
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

              {/* Avatar */}
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ position: "relative" }}>
                  <img
                    src={avatarSrc}
                    alt={d.full_name}
                    onError={(e) => { e.target.src = FALLBACK(d.full_name); }}
                    style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--accent)" }}
                  />
                  {editing && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        position: "absolute", bottom: 0, right: 0,
                        width: 32, height: 32, borderRadius: "50%",
                        background: "var(--accent)", color: "#111",
                        border: "2px solid var(--bg-main)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <LuCamera size={14} />
                    </button>
                  )}
                </div>
                {editing && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleImageFile}
                      style={{ display: "none" }}
                    />
                    <span
                      onClick={() => fileInputRef.current?.click()}
                      style={{ fontSize: 12, color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}
                    >
                      {imgPreview ? "Change photo" : "Upload photo"}
                    </span>
                  </>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <LuShieldCheck size={14} color="var(--accent)" />
                  <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Verified Counselor
                  </span>
                </div>

                {editing ? (
                  <div className="form-grid-2" style={{ marginBottom: 12 }}>
                    <Field label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} />
                    <Field label="Title" name="title" value={form.title} onChange={handleChange} />
                  </div>
                ) : (
                  <>
                    <h2 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 700 }}>{d.full_name}</h2>
                    <p style={{ margin: "0 0 14px", color: "var(--text-soft)", fontSize: 15 }}>{d.title || "Counselor"}</p>
                  </>
                )}

                {!editing && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 20 }}>
                    {d.years_of_experience && (
                      <span style={{ fontSize: 14, color: "var(--text-soft)" }}>
                        <span style={{ color: "var(--accent)", fontWeight: 700 }}>{d.years_of_experience}</span> yrs experience
                      </span>
                    )}
                    {d.languages_offered && <span style={{ fontSize: 14, color: "var(--text-soft)" }}>🌐 {d.languages_offered}</span>}
                    {d.general_location && (
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 14, color: "var(--text-soft)" }}>
                        <LuMapPin size={14} color="var(--accent)" /> {d.general_location}
                      </span>
                    )}
                    {d.offers_online && <span style={{ fontSize: 13, color: "var(--text-soft)" }}>💻 Online</span>}
                    {d.offers_in_person && <span style={{ fontSize: 13, color: "var(--text-soft)" }}>🏢 In-Person</span>}
                  </div>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  <button className="primary-btn" onClick={() => navigate("/counselor/availability")}>Manage Availability</button>
                  <button className="secondary-btn" onClick={() => navigate("/counselor/messages")}>View Messages</button>
                </div>
              </div>
            </div>
          </div>

          {/* About Me */}
          <div className="dashboard-card">
            <h3 style={{ marginBottom: 14 }}>About Me</h3>
            {editing
              ? <Field label="Bio" name="bio" value={form.bio} onChange={handleChange} rows={5} />
              : <p style={{ color: "var(--text-soft)", lineHeight: 1.8, margin: 0, fontSize: 15 }}>{d.bio || "No bio added yet."}</p>
            }
          </div>

          {/* Specializations */}
          <div className="dashboard-card">
            <h3 style={{ marginBottom: 14 }}>Specializations</h3>
            {editing
              ? <Field label="Specializations (comma-separated)" name="specialization" value={form.specialization} onChange={handleChange} />
              : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {specializations.length > 0
                    ? specializations.map(s => <Tag key={s} label={s} />)
                    : <span style={{ color: "var(--text-muted)", fontSize: 14 }}>None listed.</span>
                  }
                </div>
              )
            }
          </div>

          {/* Counseling Approach */}
          <div className="dashboard-card">
            <h3 style={{ marginBottom: 14 }}>Counseling Approach</h3>
            {editing
              ? <Field label="Describe your approach" name="counseling_approach" value={form.counseling_approach} onChange={handleChange} rows={4} />
              : <p style={{ color: "var(--text-soft)", lineHeight: 1.8, margin: 0, fontSize: 15 }}>{d.counseling_approach || "Not provided."}</p>
            }
          </div>

          {/* Contact & Session Settings — edit only */}
          {editing && (
            <div className="dashboard-card">
              <h3 style={{ marginBottom: 16 }}>Contact & Session Settings</h3>
              <div className="form-grid-2" style={{ marginBottom: 4 }}>
                <Field label="Phone Number" name="phone_number" value={form.phone_number} onChange={handleChange} />
                <Field label="Location" name="general_location" value={form.general_location} onChange={handleChange} />
              </div>
              <Field label="Office Address" name="office_address" value={form.office_address} onChange={handleChange} />
              <div className="form-grid-2" style={{ marginBottom: 4 }}>
                <Field label="Languages Offered" name="languages_offered" value={form.languages_offered} onChange={handleChange} />
                <Field label="Years of Experience" name="years_of_experience" value={form.years_of_experience} onChange={handleChange} type="number" />
              </div>
              <div className="form-grid-2" style={{ marginBottom: 16 }}>
                <Field label="Preferred Session Type" name="preferred_session_type" value={form.preferred_session_type} onChange={handleChange} />
                <Field label="Preferred Duration" name="preferred_duration" value={form.preferred_duration} onChange={handleChange} />
              </div>
              <Check name="offers_online" label="Offers Online Sessions" checked={form.offers_online} onChange={handleChange} />
              <Check name="offers_in_person" label="Offers In-Person Sessions" checked={form.offers_in_person} onChange={handleChange} />
              <Check name="show_phone_after_booking" label="Show Phone After Booking" checked={form.show_phone_after_booking} onChange={handleChange} />
              <Check name="show_office_after_booking" label="Show Office Address After Booking" checked={form.show_office_after_booking} onChange={handleChange} />
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Account Status */}
          <div className="dashboard-card">
            <h3 style={{ marginBottom: 16 }}>Account Status</h3>
            <div className="list-stack">
              {[
                { label: "Status", value: d.application_status, color: "#67d58c" },
                { label: "Active", value: d.is_active ? "Yes" : "No", color: d.is_active ? "#67d58c" : "#f08f8f" },
                { label: "Username", value: user?.nickname, color: "var(--text-soft)" },
                { label: "Role", value: user?.role, color: "var(--accent)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{label}</span>
                  <span style={{ color, fontWeight: 600, fontSize: 13, textTransform: "capitalize" }}>{value}</span>
                </div>
              ))}
              {d.created_at && (
                <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Member Since</span>
                  <span style={{ color: "var(--text-soft)", fontSize: 13 }}>{new Date(d.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Education & Credentials */}
          <div className="dashboard-card">
            <h3 style={{ marginBottom: 16 }}>Education & Credentials</h3>
            {editing ? (
              <>
                <Field label="Highest Certification / Degree" name="highest_certification" value={form.highest_certification} onChange={handleChange} />
                <Field label="Issuing Institution" name="issuing_institution" value={form.issuing_institution} onChange={handleChange} />
              </>
            ) : (
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>🎓</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)" }}>{d.highest_certification || "Not provided"}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{d.issuing_institution || ""}</div>
                </div>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="dashboard-card">
            <h3 style={{ marginBottom: 16 }}>Contact Info</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: <LuPhone size={15} />, label: "Phone", value: d.phone_number },
                { icon: <LuMapPin size={15} />, label: "Location", value: d.general_location },
                { icon: <LuUser size={15} />, label: "Office", value: d.office_address },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ color: "var(--accent)", marginTop: 2 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, color: value ? "var(--text-soft)" : "var(--text-muted)" }}>{value || "Not provided"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Preferences */}
          <div className="dashboard-card">
            <h3 style={{ marginBottom: 16 }}>Session Preferences</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Online Sessions", active: d.offers_online },
                { label: "In-Person Sessions", active: d.offers_in_person },
              ].map(({ label, active }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-faint)" }}>
                  <span style={{ fontSize: 14, color: "var(--text-soft)" }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: active ? "#67d58c" : "var(--text-muted)" }}>
                    {active ? "Available" : "Not offered"}
                  </span>
                </div>
              ))}
              {d.preferred_session_type && (
                <div style={{ fontSize: 13, color: "var(--text-muted)", paddingTop: 4 }}>
                  Preferred: <span style={{ color: "var(--text-soft)" }}>{d.preferred_session_type} · {d.preferred_duration}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
