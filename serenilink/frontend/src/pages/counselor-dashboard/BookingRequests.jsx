import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const STATUS_STYLE = {
  PENDING:   { color: "#f5c95f", bg: "rgba(245,201,95,0.12)" },
  APPROVED:  { color: "#67d58c", bg: "rgba(103,213,140,0.12)" },
  COMPLETED: { color: "#7eb8f7", bg: "rgba(126,184,247,0.12)" },
  DECLINED:  { color: "#f08f8f", bg: "rgba(240,143,143,0.12)" },
  CANCELLED: { color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
};

const ALLOWED_ACTIONS = {
  PENDING:   ["APPROVED", "DECLINED"],
  APPROVED:  ["COMPLETED", "CANCELLED"],
  DECLINED:  [],
  CANCELLED: [],
  COMPLETED: [],
};

const ACTION_CFG = {
  APPROVED:  { label: "Approve",  color: "#67d58c", bg: "rgba(103,213,140,0.12)" },
  DECLINED:  { label: "Decline",  color: "#e05555", bg: "rgba(224,85,85,0.12)" },
  CANCELLED: { label: "Cancel",   color: "#e05555", bg: "rgba(224,85,85,0.12)" },
  COMPLETED: { label: "Complete", color: "#7eb8f7", bg: "rgba(126,184,247,0.12)" },
};

export default function BookingRequests() {
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [filterStatus, setFilter] = useState("");
  const [acting, setActing]       = useState(null);

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
    const label = ACTION_CFG[newStatus]?.label || newStatus;
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

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        {["", "Pending", "Approved", "Completed", "Declined", "Canceled"].map((s) => (
          <button
            key={s || "ALL"}
            type="button"
            onClick={() => setFilter(s)}
            style={{
              padding: "8px 18px", borderRadius: 999, cursor: "pointer", fontSize: 13,
              border: `1px solid ${filterStatus === s ? "var(--accent)" : "var(--border-soft)"}`,
              background: filterStatus === s ? "rgba(202,163,143,0.12)" : "transparent",
              color: filterStatus === s ? "var(--accent)" : "var(--text-soft)",
            }}
          >
            {s || "All"}{s && counts[s] ? ` (${counts[s]})` : ""}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "#f08f8f", marginBottom: 16 }}>{error}</p>}

      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: 40, textAlign: "center" }}>Loading...</div>
      ) : bookings.length === 0 ? (
        <div className="dashboard-card">
          <div className="empty-state">No bookings found{filterStatus ? ` with status ${filterStatus}` : ""}.</div>
        </div>
      ) : (
        <div className="dashboard-card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-soft)" }}>
                {["Bookings", "Reason", "Status", "Actions"].map((h) => (
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
              {bookings.map((b, i) => {
                const actions = ALLOWED_ACTIONS[b.status] || [];
                const ss = STATUS_STYLE[b.status] || STATUS_STYLE.PENDING;
                return (
                  <tr
                    key={b.id}
                    style={{
                      borderBottom: i < bookings.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}
                  >
                    {/* Booking */}
                    <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-main)" }}>
                       Booking #{b.id}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                        {new Date(b.scheduled_for).toLocaleString()}
                      </div>
                    </td>

                    {/* Reason */}
                    <td style={{ padding: "16px 20px", maxWidth: 200 }}>
                      <span style={{ fontSize: 13, color: "var(--text-soft)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {b.reason || <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </span>
                    </td>


                    {/* Status */}
                    <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                      <span style={{
                        display: "inline-block", padding: "5px 12px", borderRadius: 999,
                        fontSize: 12, fontWeight: 600,
                        color: ss.color, background: ss.bg,
                      }}>
                        {b.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {b.status === "APPROVED" && (
                          <Link
                            to={`/counselor/chat/${b.id}`}
                            style={{
                              height: 34, padding: "0 14px", borderRadius: 10, fontSize: 13,
                              fontWeight: 600, cursor: "pointer", textDecoration: "none",
                              display: "inline-flex", alignItems: "center",
                              border: "1px solid rgba(242, 242, 242, 0.18)",
                              background: "rgba(242, 242, 242, 0.12)", color: "#f2f2f2",
                            }}
                          >
                            Chat
                          </Link>
                        )}
                        {actions.map((action) => {
                          const cfg = ACTION_CFG[action];
                          return (
                            <button
                              key={action}
                              type="button"
                              onClick={() => handleAction(b.id, action)}
                              disabled={acting === b.id + action}
                              style={{
                                height: 34, padding: "0 14px", borderRadius: 10, fontSize: 13,
                                fontWeight: 600, cursor: "pointer",
                                border: `1px solid ${cfg.bg}`,
                                background: cfg.bg, color: cfg.color,
                              }}
                            >
                              {acting === b.id + action ? "..." : cfg.label}
                            </button>
                          );
                        })}
                        {actions.length === 0 && b.status !== "APPROVED" && (
                          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
