import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const FALLBACK = (name) => `https://ui-avatars.com/api/?background=a78bfa&color=fff&size=200&name=${encodeURIComponent(name)}`;

function BookingModal({ counselor, onClose, onBooked }) {
  const [slots, setSlots]     = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.get(`/availability/counselor/${counselor.id}`)
      .then((r) => setSlots(r.data))
      .catch(() => setError("Could not load available slots."))
      .finally(() => setLoadingSlots(false));
  }, [counselor.id]);

  const handleBook = async () => {
    if (slots.length === 0) { setError("This counselor has no available slots. Please check back later."); return; }
    if (!selectedSlot) { setError("Please select a time slot."); return; }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/bookings/", {
        counselor_id: counselor.id,
        slot_id: selectedSlot.id,
        reason: reason || null,
      });
      onBooked();
    } catch (e) {
      setError(e.response?.data?.detail || "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#1a1a1d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "18px" }}>Book Session with {counselor.full_name}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "22px", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {error && (
          <p style={{ color: "#f08f8f", fontSize: "13px", marginBottom: "14px", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: "10px" }}>
            {error}
          </p>
        )}

        <div style={{ marginBottom: "20px" }}>
          <label className="form-label">Select Available Slot</label>
          {loadingSlots ? (
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading slots...</p>
          ) : slots.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "14px", padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--border-faint)" }}>
              No available slots at the moment.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {slots.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSlot(s)}
                  style={{
                    padding: "12px 16px", borderRadius: "12px", textAlign: "left", cursor: "pointer",
                    border: selectedSlot?.id === s.id ? "2px solid var(--accent)" : "1px solid var(--border-soft)",
                    background: selectedSlot?.id === s.id ? "rgba(202,163,143,0.1)" : "rgba(255,255,255,0.02)",
                    color: "var(--text-main)",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: "14px" }}>
                    {new Date(s.start_time).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span style={{ color: "var(--text-soft)", fontSize: "13px", marginLeft: "10px" }}>
                    {new Date(s.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(s.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label className="form-label">Reason for Session (optional)</label>
          <textarea
            className="form-textarea"
            style={{ minHeight: "80px" }}
            placeholder="Briefly describe what you'd like to discuss..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="secondary-btn" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="primary-btn" onClick={handleBook} disabled={submitting} style={{ flex: 1 }}>
            {submitting ? "Booking..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FindCounselors() {
  const [counselors, setCounselors]   = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [search, setSearch]           = useState("");
  const [specialization, setSpecialization] = useState("");
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [skip, setSkip]               = useState(0);
  const [hasMore, setHasMore]         = useState(true);
  const [booking, setBooking]         = useState(null);
  const [successMsg, setSuccessMsg]   = useState("");
  const LIMIT = 9;

  useEffect(() => {
    api.get("/counselors/specializations")
      .then((r) => setSpecializations(r.data))
      .catch(() => {});
  }, []);

  const fetchCounselors = async (newSkip = 0, append = false) => {
    setLoading(true);
    try {
      const params = { skip: newSkip, limit: LIMIT };
      if (specialization) params.specialization = specialization;
      const res = await api.get("/counselors/", { params });
      setCounselors((prev) => append ? [...prev, ...res.data] : res.data);
      setHasMore(res.data.length === LIMIT);
      setSkip(newSkip + res.data.length);
    } catch {
      setError("Failed to load counselors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCounselors(0, false); }, [specialization]);

  const handleBooked = () => {
    setBooking(null);
    setSuccessMsg("Booking submitted! The counselor will review your request.");
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  const displayed = search
    ? counselors.filter((c) =>
        c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (c.specialization || "").toLowerCase().includes(search.toLowerCase())
      )
    : counselors;

  return (
    <div>
      <h1 className="dashboard-page-title">Find Counselors</h1>
      <p className="dashboard-page-subtitle">Browse available counselors and request a session.</p>

      {successMsg && (
        <div style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "12px", background: "rgba(103,213,140,0.1)", color: "#67d58c", border: "1px solid rgba(103,213,140,0.2)" }}>
          {successMsg}
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input
          className="form-input"
          type="text"
          placeholder="Search by name or specialization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px" }}
        />
        <select
          className="form-select"
          value={specialization}
          onChange={(e) => { setSpecialization(e.target.value); setSkip(0); }}
          style={{ width: "240px" }}
        >
          <option value="">All Specializations</option>
          {specializations.map((spec) => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
      </div>

      {error && <p style={{ color: "#f08f8f", marginBottom: "16px" }}>{error}</p>}

      {loading && counselors.length === 0 ? (
        <div style={{ color: "var(--text-muted)", padding: "40px", textAlign: "center" }}>Loading counselors...</div>
      ) : displayed.length === 0 ? (
        <div className="dashboard-card"><div className="empty-state">No counselors found.</div></div>
      ) : (
        <div className="dashboard-grid dashboard-cards-3">
          {displayed.map((c) => (
            <div key={c.id} style={{
              background: "linear-gradient(160deg, #1c1c1f 0%, #171719 100%)",
              border: "1px solid rgba(176,176,176,0.09)",
              borderRadius: "20px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 6px 28px rgba(0,0,0,0.22)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 14px 40px rgba(0,0,0,0.32)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,0,0,0.22)"; }}
            >
              {/* Top section: image left, info right */}
              <div style={{ display: "flex", gap: "14px", padding: "18px 18px 14px" }}>
                <img
                  src={c.profile_image_url || FALLBACK(c.full_name)}
                  alt={c.full_name}
                  style={{ width: "72px", height: "90px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }}
                  onError={(e) => { e.target.src = FALLBACK(c.full_name); }}
                />
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "6px", minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f4f4f4", lineHeight: 1.3 }}>{c.full_name}</h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--accent)", fontWeight: 500 }}>{c.title || "Counselor"}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>{c.specialization}</p>
                  {c.general_location && (
                    <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>📍 {c.general_location}</p>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0 18px" }} />

              {/* Bio */}
              {c.bio && (
                <p style={{ margin: 0, padding: "14px 18px", color: "var(--text-soft)", fontSize: "13px", lineHeight: 1.65,
                  display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {c.bio}
                </p>
              )}

              {/* Book button */}
              <div style={{ padding: "12px 18px 18px", marginTop: "auto" }}>
                <button
                  type="button"
                  onClick={() => setBooking(c)}
                  style={{
                    width: "100%", height: "38px", borderRadius: "10px", border: "none",
                    background: "#a86955", color: "#fff", fontSize: "13px",
                    fontWeight: 600, cursor: "pointer", transition: "background 0.2s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#c07a62"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#a86955"; }}
                >
                  Book Session
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && !search && !specialization && (
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button
            type="button"
            onClick={() => fetchCounselors(skip, true)}
            disabled={loading}
            style={{
              background: "transparent", border: "none",
              color: "var(--accent)", fontSize: 13, fontWeight: 600,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            {loading ? "Loading..." : <>Load More <span style={{ fontSize: 16 }}>→</span></>}
          </button>
        </div>
      )}

      {booking && (
        <BookingModal
          counselor={booking}
          onClose={() => setBooking(null)}
          onBooked={handleBooked}
        />
      )}
    </div>
  );
}

export default FindCounselors;
