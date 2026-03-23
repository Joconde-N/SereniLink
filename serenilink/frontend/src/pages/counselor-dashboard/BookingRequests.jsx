import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const STATUS_CLASS = {
  PENDING: "pending", APPROVED: "approved",
  DECLINED: "declined", CANCELLED: "cancelled", COMPLETED: "approved",
};

const ALLOWED_ACTIONS = {
  PENDING:   ["APPROVED", "DECLINED"],
  APPROVED:  ["COMPLETED", "CANCELLED"],
  DECLINED:  [],
  CANCELLED: [],
  COMPLETED: [],
};

const ACTION_LABELS = {
  APPROVED:  { label: "Approve",  color: "#67d58c",  bg: "rgba(103,213,140,0.12)" },
  DECLINED:  { label: "Decline",  color: "#f08f8f",  bg: "rgba(240,143,143,0.12)" },
  CANCELLED: { label: "Cancel",   color: "#f08f8f",  bg: "rgba(240,143,143,0.12)" },
  COMPLETED: { label: "Complete", color: "var(--accent)", bg: "rgba(202,163,143,0.12)" },
};

function BookingRequests() {
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [filterStatus, setFilter]   = useState("");
  const [acting, setActing]         = useState(null);

  const load = (status = "") => {
    setLoading(true);
    const params = { limit: 100 };
    if (status) params.status = status;
    api.get("/bookings/counselor/me", { params })
      .then((res) => setBookings(res.data))
      .catch(() => setError("Failed to load bookings."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filterStatus); }, [filterStatus]);

  const handleAction = async (bookingId, newStatus) => {
    const label = ACTION_LABELS[newStatus]?.label || newStatus;
    if (!window.confirm(`${label} this booking?`)) return;
    setActing(bookingId + newStatus);
    try {
      await api.patch(`/bookings/${bookingId}/counselor-status`, { status: newStatus });
      load(filterStatus);
    } catch (err) {
      alert(err.response?.data?.detail || "Action failed.");
    } finally {
      setActing(null);
    }
  };

  const counts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="dashboard-page-title">Booking Requests</h1>
      <p className="dashboard-page-subtitle">Review and manage all booking requests from clients.</p>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
        {["", "PENDING", "APPROVED", "COMPLETED", "DECLINED", "CANCELLED"].map((s) => (
          <button
            key={s || "ALL"}
            type="button"
            onClick={() => setFilter(s)}
            style={{
              padding: "8px 18px", borderRadius: "999px", cursor: "pointer", fontSize: "14px",
              border: `1px solid ${filterStatus === s ? "var(--accent)" : "var(--border-soft)"}`,
              background: filterStatus === s ? "rgba(202,163,143,0.12)" : "transparent",
              color: filterStatus === s ? "var(--accent)" : "var(--text-soft)",
            }}
          >
            {s || "All"} {s && counts[s] ? `(${counts[s]})` : ""}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "#f08f8f", marginBottom: "16px" }}>{error}</p>}

      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: "40px", textAlign: "center" }}>Loading...</div>
      ) : bookings.length === 0 ? (
        <div className="dashboard-card">
          <div className="empty-state">No bookings found{filterStatus ? ` with status ${filterStatus}` : ""}.</div>
        </div>
      ) : (
        <div className="dashboard-grid dashboard-cards-2">
          {bookings.map((b) => {
            const actions = ALLOWED_ACTIONS[b.status] || [];
            return (
              <div className="dashboard-card" key={b.id}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "17px" }}>Booking #{b.id}</h3>
                    <p className="small-muted" style={{ margin: 0 }}>
                      {new Date(b.scheduled_for).toLocaleString()}
                    </p>
                  </div>
                  <span className={`status-pill ${STATUS_CLASS[b.status] || "pending"}`}>{b.status}</span>
                </div>

                {/* Info */}
                <div className="list-stack" style={{ marginBottom: "14px" }}>
                  {b.reason && (
                    <div className="simple-item">
                      <span className="small-muted">Reason</span>
                      <p style={{ margin: "4px 0 0" }}>{b.reason}</p>
                    </div>
                  )}
                  <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Payment</span>
                    <span style={{ color: b.payment_status === "PAID" ? "#67d58c" : "#f5c95f", fontWeight: 600 }}>
                      {b.payment_status}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <Link
                    to={`/counselor/bookings/${b.id}`}
                    className="secondary-btn"
                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", height: "38px", padding: "0 14px", fontSize: "13px" }}
                  >
                    Details
                  </Link>

                  {b.status === "APPROVED" && (
                    <Link
                      to={`/counselor/chat/${b.id}`}
                      className="secondary-btn"
                      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", height: "38px", padding: "0 14px", fontSize: "13px", color: "var(--accent)", borderColor: "rgba(202,163,143,0.3)" }}
                    >
                      Chat
                    </Link>
                  )}

                  {actions.map((action) => {
                    const cfg = ACTION_LABELS[action];
                    return (
                      <button
                        key={action}
                        type="button"
                        onClick={() => handleAction(b.id, action)}
                        disabled={acting === b.id + action}
                        style={{
                          height: "38px", padding: "0 14px", borderRadius: "12px", fontSize: "13px",
                          fontWeight: 600, cursor: "pointer", border: `1px solid ${cfg.bg}`,
                          background: cfg.bg, color: cfg.color,
                        }}
                      >
                        {acting === b.id + action ? "..." : cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BookingRequests;
