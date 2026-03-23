import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

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
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Payment Status</span>
              <span style={{ color: booking.payment_status === "PAID" ? "#67d58c" : "#f5c95f", fontWeight: 600 }}>
                {booking.payment_status}
              </span>
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
      </div>
    </div>
  );
}

export default CounselorBookingDetails;
