import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import PatientRiskCard from "../../components/counselor-dashboard/PatientRiskCard";

const STATUS_CLASS = {
  PENDING: "pending", APPROVED: "approved",
  DECLINED: "declined", CANCELLED: "cancelled", COMPLETED: "approved",
};

const ALLOWED_ACTIONS = {
  PENDING:  ["APPROVED", "DECLINED"],
  APPROVED: ["COMPLETED", "CANCELLED"],
};

const ACTION_LABELS = {
  APPROVED:  { label: "Approve",  color: "#67d58c",       bg: "rgba(103,213,140,0.12)" },
  DECLINED:  { label: "Decline",  color: "#f08f8f",       bg: "rgba(240,143,143,0.12)" },
  CANCELLED: { label: "Cancel",   color: "#f08f8f",       bg: "rgba(240,143,143,0.12)" },
  COMPLETED: { label: "Complete", color: "var(--accent)", bg: "rgba(202,163,143,0.12)" },
};

function CounselorBookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [acting, setActing]   = useState(null);

  // Session note state
  const [noteText, setNoteText] = useState("");
  const [noteShared, setNoteShared] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteMsg, setNoteMsg] = useState("");

  const load = async () => {
    try {
      // fetch from counselor bookings list and find by id
      const res = await api.get("/bookings/counselor/me", { params: { limit: 200 } });
      const found = res.data.find((b) => b.id === parseInt(id));
      if (!found) { setError("Booking not found."); return; }
      setBooking(found);
    } catch {
      setError("Failed to load booking.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  // Load existing note
  useEffect(() => {
    if (!id) return;
    api.get(`/notes/booking/${id}`)
      .then((res) => { setNoteText(res.data.note_text); setNoteShared(res.data.is_shared_with_user); })
      .catch(() => {});
  }, [id]);

  const handleSaveNote = async () => {
    setNoteSaving(true);
    setNoteMsg("");
    try {
      await api.put(`/notes/booking/${id}`, { note_text: noteText, is_shared_with_user: noteShared });
      setNoteMsg("Note saved.");
      setTimeout(() => setNoteMsg(""), 3000);
    } catch {
      setNoteMsg("Failed to save note.");
    } finally {
      setNoteSaving(false);
    }
  };

  const handleAction = async (newStatus) => {
    const cfg = ACTION_LABELS[newStatus];
    if (!window.confirm(`${cfg.label} this booking?`)) return;
    setActing(newStatus);
    try {
      await api.patch(`/bookings/${id}/counselor-status`, { status: newStatus });
      load();
    } catch (err) {
      alert(err.response?.data?.detail || "Action failed.");
    } finally {
      setActing(null);
    }
  };

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading...</div>;
  if (error)   return <div style={{ color: "#f08f8f", padding: "40px" }}>{error}</div>;

  const actions = ALLOWED_ACTIONS[booking.status] || [];

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <Link to="/counselor/requests" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "14px" }}>
          ← Back to Requests
        </Link>
      </div>

      <h1 className="dashboard-page-title">Booking Details</h1>
      <p className="dashboard-page-subtitle">Full information for booking #{id}.</p>

      <div className="dashboard-grid dashboard-cards-2">
        {/* Booking Info */}
        <div className="dashboard-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0 }}>Booking #{booking.id}</h3>
            <span className={`status-pill ${STATUS_CLASS[booking.status] || "pending"}`}>{booking.status}</span>
          </div>

          <div className="list-stack">
            <div className="simple-item">
              <span className="small-muted">Scheduled For</span>
              <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{new Date(booking.scheduled_for).toLocaleString()}</p>
            </div>
            <div className="simple-item">
              <span className="small-muted">Client Note / Reason</span>
              <p style={{ margin: "4px 0 0" }}>{booking.reason || "No reason provided."}</p>
            </div>
            <div className="simple-item">
              <span className="small-muted">Booked On</span>
              <p style={{ margin: "4px 0 0" }}>{new Date(booking.created_at).toLocaleDateString()}</p>
            </div>
            <div className="simple-item">
              <span className="small-muted">Last Updated</span>
              <p style={{ margin: "4px 0 0" }}>{new Date(booking.updated_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Action Buttons */}
          {actions.length > 0 && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "20px" }}>
              {actions.map((action) => {
                const cfg = ACTION_LABELS[action];
                return (
                  <button
                    key={action}
                    type="button"
                    onClick={() => handleAction(action)}
                    disabled={acting === action}
                    style={{
                      height: "42px", padding: "0 18px", borderRadius: "12px", fontSize: "14px",
                      fontWeight: 600, cursor: "pointer", border: `1px solid ${cfg.bg}`,
                      background: cfg.bg, color: cfg.color,
                    }}
                  >
                    {acting === action ? "Processing..." : cfg.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat + Contact */}
        <div className="dashboard-card">
          <h3>Session Actions</h3>

          {booking.status === "APPROVED" ? (
            <div className="list-stack">
              <div className="simple-item">
                <p style={{ margin: "0 0 10px", color: "var(--text-soft)", fontSize: "14px" }}>
                  This booking is approved. You can now chat with the client.
                </p>
                <Link
                  to={`/counselor/chat/${booking.id}`}
                  className="primary-btn"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%" }}
                >
                  💬 Open Chat
                </Link>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ minHeight: "100px" }}>
              {booking.status === "PENDING"
                ? "Approve this booking to enable chat."
                : `Chat is not available for ${booking.status} bookings.`}
            </div>
          )}

          <div style={{ marginTop: "20px" }}>
            <h3>Client Info</h3>
            <div className="list-stack">
              <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>User ID</span>
                <span style={{ color: "var(--text-soft)" }}>#{booking.user_id}</span>
              </div>
              <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Slot ID</span>
                <span style={{ color: "var(--text-soft)" }}>#{booking.slot_id}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Client Support Level */}
        {["APPROVED", "COMPLETED"].includes(booking.status) && (
          <div className="dashboard-card">
            <PatientRiskCard userId={booking.user_id} />
          </div>
        )}

        {/* Session Note */}
        <div className="dashboard-card">
          <h3 style={{ marginBottom: "16px" }}>Session Notes</h3>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>
            Private notes about this session. Toggle sharing to let the client read them.
          </p>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write your session notes here..."
            rows={6}
            style={{
              width: "100%", background: "var(--bg-input)", border: "1px solid var(--border-soft)",
              borderRadius: "12px", padding: "12px", color: "var(--text-main)",
              fontSize: "14px", lineHeight: 1.6, resize: "vertical", outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", flexWrap: "wrap", gap: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "var(--text-soft)" }}>
              <input
                type="checkbox"
                checked={noteShared}
                onChange={(e) => setNoteShared(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "var(--accent)", cursor: "pointer" }}
              />
              Share with client
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {noteMsg && (
                <span style={{ fontSize: "13px", color: noteMsg === "Note saved." ? "#67d58c" : "#f08f8f" }}>
                  {noteMsg}
                </span>
              )}
              <button
                type="button" onClick={handleSaveNote}
                disabled={noteSaving || !noteText.trim()}
                style={{
                  height: "38px", padding: "0 20px", borderRadius: "10px", fontSize: "13px",
                  fontWeight: 600, cursor: noteText.trim() ? "pointer" : "not-allowed",
                  border: "none", background: "var(--accent)", color: "#111",
                }}
              >
                {noteSaving ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CounselorBookingDetails;
