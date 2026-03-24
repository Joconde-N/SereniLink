import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuPencil, LuCheck, LuX, LuShieldCheck, LuMapPin, LuPhone, LuUser } from "react-icons/lu";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const FALLBACK = (name) => `https://ui-avatars.com/api/?background=caa38f&color=111&bold=true&size=128&name=${encodeURIComponent(name || "C")}`;

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

const EMPTY_FORM = {
  full_name: "", title: "", bio: "", specialization: "",
  profile_image_url: "", phone_number: "", general_location: "", office_address: "",
  offers_online: true, offers_in_person: false,
  show_phone_after_booking: true, show_office_after_booking: true,
  years_of_experience: "", counseling_approach: "",
  highest_certification: "", issuing_institution: "",
  languages_offered: "", preferred_session_type: "", preferred_duration: "",
};

// Defined outside component to prevent remount on every render (fixes focus loss)
function Field({ label, name, rows, type = "text", form, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="form-label">{label}</label>
      {rows
        ? <textarea className="form-textarea" name={name} value={form[name]} onChange={onChange} rows={rows} />
        : <input className="form-input" type={type} name={name} value={form[name]} onChange={onChange} />
      }
    </div>
  );
}

function Check({ name, label, form, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-soft)", fontSize: 14, cursor: "pointer", marginBottom: 10 }}>
      <input type="checkbox" name={name} checked={form[name]} onChange={onChange} style={{ accentColor: "var(--accent)" }} />
      {label}
    </label>
  );
}

export default function CounselorProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: true });
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    api.get("/counselors/me")
      .then((res) => { setProfile(res.data); populateForm(res.data); })
      .catch(() => setMsg({ text: "Could not load profile.", ok: false }))
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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: "", ok: true });
    try {
      const payload = { ...form, years_of_experience: form.years_of_experience !== "" ? parseInt(form.years_of_experience) : null };
      const res = await api.patch("/counselors/me", payload);
      setProfile(res.data);
      populateForm(res.data);
      setEditing(false);
      setMsg({ text: "Profile updated successfully.", ok: true });
    } catch {
      setMsg({ text: "Failed to save. Please try again.", ok: false });
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => { populateForm(profile); setEditing(false); setMsg({ text: "", ok: true }); };

  if (loading) return <div style={{ color: "var(--text-muted)", padding: 40 }}>Loading profile...</div>;

  const d = profile || {};
  const avatarSrc = form.profile_image_url || FALLBACK(d.full_name);
  const specializations = (d.specialization || "").split(",").map(s => s.trim()).filter(Boolean);

  const f = (label, name, rows, type) => <Field key={name} label={label} name={name} rows={rows} type={type} form={form} onChange={handleChange} />;
  const c = (name, label) => <Check key={name} name={name} label={label} form={form} onChange={handleChange} />;

  return (
    <div>
      {/* Header row */}
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
            <button className="secondary-btn" onClick={cancelEdit} style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                  src={avatarSrc}
                  alt={d.full_name}
                  onError={(e) => { e.target.src = FALLBACK(d.full_name); }}
                  style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--accent)" }}
                />
                {editing && (
                  <div style={{ marginTop: 8 }}>
                    <label className="form-label" style={{ fontSize: 11 }}>Profile Image URL</label>
                    <input
                      className="form-input"
                      name="profile_image_url"
                      value={form.profile_image_url}
                      onChange={handleChange}
                      placeholder="https://..."
                      style={{ fontSize: 12, padding: "8px 12px" }}
                    />
                  </div>
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
                    {f("Full Name", "full_name")}
                    {f("Title", "title")}
                  </div>
                ) : (
                  <>
                    <h2 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 700 }}>{d.full_name}</h2>
                    <p style={{ margin: "0 0 14px", color: "var(--text-soft)", fontSize: 15 }}>{d.title || "Counselor"}</p>
                  </>
                )}

                {/* Key stats row */}
                {!editing && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 20 }}>
                    {d.years_of_experience && (
                      <span style={{ fontSize: 14, color: "var(--text-soft)" }}>
                        <span style={{ color: "var(--accent)", fontWeight: 700 }}>{d.years_of_experience}</span> yrs experience
                      </span>
                    )}
                    {d.languages_offered && (
                      <span style={{ fontSize: 14, color: "var(--text-soft)" }}>
                        🌐 {d.languages_offered}
                      </span>
                    )}
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
              ? f("Bio", "bio", 5)
              : <p style={{ color: "var(--text-soft)", lineHeight: 1.8, margin: 0, fontSize: 15 }}>
                  {d.bio || "No bio added yet."}
                </p>
            }
          </div>

          {/* Specializations */}
          <div className="dashboard-card">
            <h3 style={{ marginBottom: 14 }}>Specializations</h3>
            {editing
              ? f("Specializations (comma-separated)", "specialization")
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
              ? f("Describe your approach", "counseling_approach", 4)
              : <p style={{ color: "var(--text-soft)", lineHeight: 1.8, margin: 0, fontSize: 15 }}>
                  {d.counseling_approach || "Not provided."}
                </p>
            }
          </div>

          {/* Edit-only: contact + session settings */}
          {editing && (
            <div className="dashboard-card">
              <h3 style={{ marginBottom: 16 }}>Contact & Session Settings</h3>
              <div className="form-grid-2" style={{ marginBottom: 4 }}>
                {f("Phone Number", "phone_number")}
                {f("Location", "general_location")}
              </div>
              {f("Office Address", "office_address")}
              <div className="form-grid-2" style={{ marginBottom: 4 }}>
                {f("Languages Offered", "languages_offered")}
                {f("Years of Experience", "years_of_experience", null, "number")}
              </div>
              <div className="form-grid-2" style={{ marginBottom: 16 }}>
                {f("Preferred Session Type", "preferred_session_type")}
                {f("Preferred Duration", "preferred_duration")}
              </div>
              {c("offers_online", "Offers Online Sessions")}
              {c("offers_in_person", "Offers In-Person Sessions")}
              {c("show_phone_after_booking", "Show Phone After Booking")}
              {c("show_office_after_booking", "Show Office Address After Booking")}
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
                {f("Highest Certification / Degree", "highest_certification")}
                {f("Issuing Institution", "issuing_institution")}
              </>
            ) : (
              <div className="list-stack">
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20 }}>🎓</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)" }}>{d.highest_certification || "Not provided"}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{d.issuing_institution || ""}</div>
                  </div>
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
