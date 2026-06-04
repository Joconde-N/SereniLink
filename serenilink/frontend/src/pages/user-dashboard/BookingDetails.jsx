import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

const STATUS_STYLE = {
  PENDING:   { color: "#f5c95f", bg: "rgba(245,201,95,0.12)" },
  APPROVED:  { color: "#67d58c", bg: "rgba(103,213,140,0.12)" },
  COMPLETED: { color: "#7eb8f7", bg: "rgba(126,184,247,0.12)" },
  DECLINED:  { color: "#f08f8f", bg: "rgba(240,143,143,0.12)" },
  CANCELLED: { color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
};

function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Session note
  const [sharedNote, setSharedNote] = useState(null);

  // Book again modal
  const [showModal, setShowModal] = useState(false);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookReason, setBookReason] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingAgain, setBookingAgain] = useState(false);
  const [bookError, setBookError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await api.get(`/bookings/me`, { params: { limit: 50 } });
        const found = res.data.find((b) => b.id === parseInt(id));
        if (!found) { setError("Booking not found."); return; }
        setBooking(found);
        try {
          const noteRes = await api.get(`/notes/booking/${id}/user`);
          setSharedNote(noteRes.data);
        } catch { /* no shared note */ }
      } catch {
        setError("Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm("Cancel this booking?")) return;
    setCancelling(true);
    try {
      await api.delete(`/bookings/${id}`);
      navigate("/dashboard/bookings");
    } catch (err) {
      alert(err.response?.data?.detail || "Could not cancel booking.");
      setCancelling(false);
    }
  };

  const openBookAgain = async (counselorId) => {
    setShowModal(true);
    setLoadingSlots(true);
    setBookError("");
    setSelectedSlot(null);
    setBookReason("");
    try {
      const res = await api.get(`/availability/counselor/${counselorId}`);
      setSlots(res.data);
    } catch {
      setBookError("Failed to load available slots.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookAgain = async () => {
    if (!selectedSlot) return;
    setBookingAgain(true);
    setBookError("");
    try {
      const res = await api.post("/bookings/", {
        counselor_id: booking.counselor_id,
        slot_id: selectedSlot,
        reason: bookReason || undefined,
      });
      setShowModal(false);
      navigate(`/dashboard/bookings/${res.data.id}`);
    } catch (err) {
      setBookError(err.response?.data?.detail || "Booking failed.");
    } finally {
      setBookingAgain(false);
    }
  };

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading...</div>;
  if (error) return <div style={{ color: "#f08f8f", padding: "40px" }}>{error}</div>;

  const ss = STATUS_STYLE[booking.status] || STATUS_STYLE.PENDING;

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <Link to="/dashboard/bookings" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "14px" }}>
          ← Back to Bookings
        </Link>
      </div>

      <h1 className="dashboard-page-title">Booking Details</h1>
      <p className="dashboard-page-subtitle">Full details for your counseling session.</p>

      {/* Booking info table */}
      <div className="dashboard-card" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-soft)" }}>
              {["Booking", "Reason", "Status", "Booked On", "Actions"].map((h) => (
                <th key={h} style={{
                  padding: "14px 20px", textAlign: "left",
                  fontSize: 14, fontWeight: 600,
                  color: "var(--text-muted)", letterSpacing: "0.04em",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-main)" }}>Booking #{booking.id}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                  {new Date(booking.scheduled_for).toLocaleString()}
                </div>
              </td>
              <td style={{ padding: "16px 20px", maxWidth: 200 }}>
                <span style={{ fontSize: 13, color: "var(--text-soft)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {booking.reason || <span style={{ color: "var(--text-muted)" }}>—</span>}
                </span>
              </td>
              <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                <span style={{
                  display: "inline-block", padding: "5px 12px", borderRadius: 999,
                  fontSize: 12, fontWeight: 600, color: ss.color, background: ss.bg,
                }}>
                  {booking.status}
                </span>
              </td>
              <td style={{ padding: "16px 20px", whiteSpace: "nowrap", fontSize: 13, color: "var(--text-soft)" }}>
                {new Date(booking.created_at).toLocaleDateString()}
              </td>
              <td style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {/* Chat — open for APPROVED, view history for COMPLETED */}
                  {booking.status === "APPROVED" && (
                    <Link
                      to={`/dashboard/chat/${booking.id}`}
                      style={{
                        height: 34, padding: "0 14px", borderRadius: 10, fontSize: 13,
                        fontWeight: 600, textDecoration: "none",
                        display: "inline-flex", alignItems: "center",
                        border: "1px solid rgba(103,213,140,0.25)",
                        background: "rgba(103,213,140,0.1)", color: "#67d58c",
                      }}
                    >
                      Open Chat
                    </Link>
                  )}
                  {booking.status === "COMPLETED" && (
                    <Link
                      to={`/dashboard/chat/${booking.id}`}
                      style={{
                        height: 34, padding: "0 14px", borderRadius: 10, fontSize: 13,
                        fontWeight: 600, textDecoration: "none",
                        display: "inline-flex", alignItems: "center",
                        border: "1px solid rgba(126,184,247,0.25)",
                        background: "rgba(126,184,247,0.08)", color: "#7eb8f7",
                      }}
                    >
                      View Chat
                    </Link>
                  )}
                  {/* Cancel */}
                  {(booking.status === "PENDING" || booking.status === "APPROVED") && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={cancelling}
                      style={{
                        height: 34, padding: "0 14px", borderRadius: 10, fontSize: 13,
                        fontWeight: 600, cursor: "pointer",
                        border: "1px solid rgba(240,143,143,0.25)",
                        background: "rgba(240,143,143,0.1)", color: "#f08f8f",
                      }}
                    >
                      {cancelling ? "..." : "Cancel"}
                    </button>
                  )}
                  {/* Book Again */}
                  {(booking.status === "COMPLETED" || booking.status === "DECLINED" || booking.status === "CANCELLED") && (
                    <button
                      type="button"
                      onClick={() => openBookAgain(booking.counselor_id)}
                      style={{
                        height: 34, padding: "0 14px", borderRadius: 10, fontSize: 13,
                        fontWeight: 600, cursor: "pointer",
                        border: "1px solid rgba(202,163,143,0.3)",
                        background: "rgba(202,163,143,0.1)", color: "var(--accent)",
                      }}
                    >
                      Book Again
                    </button>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Shared session note */}
      {sharedNote && (
        <div className="dashboard-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: "8px" }}>Session Notes from Counselor</h3>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
            Last updated: {new Date(sharedNote.updated_at).toLocaleDateString()}
          </p>
          <p style={{ fontSize: "14px", color: "var(--text-soft)", lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>
            {sharedNote.note_text}
          </p>
        </div>
      )}

      {/* Contact card */}
      <div className="dashboard-card">
        <h3 style={{ marginBottom: 16 }}>Counselor Contact</h3>
        <div className="empty-state" style={{ minHeight: "80px" }}>
          Contact details are revealed after your booking is approved.
        </div>
      </div>

      {/* Book Again Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.6)", display: "flex",
          alignItems: "center", justifyContent: "center", padding: "20px",
        }}>
          <div style={{
            background: "#1a1a1d", border: "1px solid var(--border-soft)",
            borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "480px",
            maxHeight: "80vh", overflowY: "auto",
          }}>
            <h3 style={{ margin: "0 0 6px" }}>Book Again</h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
              Select an available slot with the same counselor.
            </p>

            {loadingSlots ? (
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading slots...</p>
            ) : slots.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No available slots at the moment.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                {slots.map((s) => (
                  <button
                    key={s.id} type="button"
                    onClick={() => setSelectedSlot(s.id)}
                    style={{
                      padding: "12px 16px", borderRadius: "12px", textAlign: "left",
                      cursor: "pointer", fontSize: "13px",
                      border: selectedSlot === s.id ? "1px solid var(--accent)" : "1px solid var(--border-soft)",
                      background: selectedSlot === s.id ? "rgba(202,163,143,0.12)" : "rgba(255,255,255,0.03)",
                      color: selectedSlot === s.id ? "var(--accent)" : "var(--text-soft)",
                    }}
                  >
                    {new Date(s.start_time).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {" — "}
                    {new Date(s.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </button>
                ))}
              </div>
            )}

            <textarea
              placeholder="Reason for booking (optional)"
              value={bookReason}
              onChange={(e) => setBookReason(e.target.value)}
              rows={3}
              style={{
                width: "100%", background: "var(--bg-input)", border: "1px solid var(--border-soft)",
                borderRadius: "10px", padding: "10px 12px", color: "var(--text-main)",
                fontSize: "13px", resize: "none", outline: "none", boxSizing: "border-box",
                marginBottom: "16px",
              }}
            />

            {bookError && <p style={{ color: "#f08f8f", fontSize: "13px", marginBottom: "12px" }}>{bookError}</p>}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button" onClick={() => setShowModal(false)}
                style={{
                  height: 38, padding: "0 18px", borderRadius: 10, fontSize: 13,
                  fontWeight: 600, cursor: "pointer",
                  border: "1px solid var(--border-soft)", background: "transparent", color: "var(--text-soft)",
                }}
              >
                Cancel
              </button>
              <button
                type="button" onClick={handleBookAgain}
                disabled={!selectedSlot || bookingAgain}
                style={{
                  height: 38, padding: "0 20px", borderRadius: 10, fontSize: 13,
                  fontWeight: 600, cursor: selectedSlot ? "pointer" : "not-allowed",
                  border: "none",
                  background: selectedSlot ? "var(--accent)" : "rgba(255,255,255,0.06)",
                  color: selectedSlot ? "#111" : "var(--text-muted)",
                }}
              >
                {bookingAgain ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingDetails;
