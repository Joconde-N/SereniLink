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

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");

  const load = () => {
    setLoading(true);
    api.get("/bookings/me", { params: { limit: 50 } })
      .then((res) => { setAllBookings(res.data); setBookings(res.data); })
      .catch(() => setError("Failed to load bookings."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setBookings(filterStatus ? allBookings.filter((b) => b.status === filterStatus) : allBookings);
  }, [filterStatus, allBookings]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    setCancelling(id);
    try {
      await api.delete(`/bookings/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not cancel booking.");
    } finally {
      setCancelling(null);
    }
  };

  const counts = allBookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="dashboard-page-title">My Bookings</h1>
      <p className="dashboard-page-subtitle">Track your session requests and upcoming appointments.</p>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        {["", "PENDING", "APPROVED", "COMPLETED", "DECLINED", "CANCELLED"].map((s) => (
          <button
            key={s || "ALL"}
            type="button"
            onClick={() => setFilterStatus(s)}
            style={{
              padding: "8px 18px", borderRadius: 999, cursor: "pointer", fontSize: 13,
              border: `1px solid ${filterStatus === s ? "var(--accent)" : "var(--border-soft)"}`,
              background: filterStatus === s ? "rgba(202,163,143,0.12)" : "transparent",
              color: filterStatus === s ? "var(--accent)" : "var(--text-soft)",
            }}
          >
            {s ? s.charAt(0) + s.slice(1).toLowerCase() : "All"}{s && counts[s] ? ` (${counts[s]})` : ""}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "#f08f8f", marginBottom: 16 }}>{error}</p>}

      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: 40, textAlign: "center" }}>Loading...</div>
      ) : bookings.length === 0 ? (
        <div className="dashboard-card">
          <div className="empty-state">
            No bookings found. <Link to="/dashboard/counselors" style={{ color: "var(--accent)" }}>Find a counselor</Link> to get started.
          </div>
        </div>
      ) : (
        <div className="dashboard-card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-soft)" }}>
                {["Booking", "Reason", "Payment", "Status", "Actions"].map((h) => (
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
                const ss = STATUS_STYLE[b.status] || STATUS_STYLE.PENDING;
                return (
                  <tr
                    key={b.id}
                    style={{ borderBottom: i < bookings.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
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

                    {/* Payment */}
                    <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: b.payment_status === "PAID" ? "#67d58c" : "#f5c95f",
                      }}>
                        {b.payment_status}
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
                        <Link
                          to={`/dashboard/bookings/${b.id}`}
                          style={{
                            height: 34, padding: "0 14px", borderRadius: 10, fontSize: 13,
                            fontWeight: 600, cursor: "pointer", textDecoration: "none",
                            display: "inline-flex", alignItems: "center",
                            border: "1px solid rgba(242,242,242,0.18)",
                            background: "rgba(242,242,242,0.06)", color: "#f2f2f2",
                          }}
                        >
                          Details
                        </Link>

                        {b.status === "APPROVED" && (
                          <Link
                            to={`/dashboard/chat/${b.id}`}
                            style={{
                              height: 34, padding: "0 14px", borderRadius: 10, fontSize: 13,
                              fontWeight: 600, cursor: "pointer", textDecoration: "none",
                              display: "inline-flex", alignItems: "center",
                              border: "1px solid rgba(103,213,140,0.25)",
                              background: "rgba(103,213,140,0.1)", color: "#67d58c",
                            }}
                          >
                            Open Chat
                          </Link>
                        )}

                        {(b.status === "PENDING" || b.status === "APPROVED") && (
                          <button
                            type="button"
                            onClick={() => handleCancel(b.id)}
                            disabled={cancelling === b.id}
                            style={{
                              height: 34, padding: "0 14px", borderRadius: 10, fontSize: 13,
                              fontWeight: 600, cursor: "pointer",
                              border: "1px solid rgba(240,143,143,0.25)",
                              background: "rgba(240,143,143,0.1)", color: "#f08f8f",
                            }}
                          >
                            {cancelling === b.id ? "..." : "Cancel"}
                          </button>
                        )}

                        {b.status !== "PENDING" && b.status !== "APPROVED" && b.status !== "APPROVED" && (
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

export default MyBookings;
