import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";

const STATUS_CLASS = {
  PENDING: "pending", APPROVED: "approved", DECLINED: "declined",
  CANCELLED: "cancelled", COMPLETED: "approved",
};
const PAYMENT_COLOR = { PENDING: "#f5c95f", PAID: "#67d58c", WAIVED: "#caa38f" };
const STATUS_TABS = ["ALL", "PENDING", "APPROVED", "DECLINED", "COMPLETED", "CANCELLED"];

function BookingsManagement() {
  const [bookings, setBookings]   = useState([]);
  const [tab, setTab]             = useState("ALL");
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback((status) => {
    setLoading(true);
    const params = { limit: 50 };
    if (status !== "ALL") params.status = status;
    api.get("/bookings/", { params })
      .then((r) => setBookings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(""), 3000); };

  const handlePayment = (bookingId, ps) => {
    api.patch(`/bookings/${bookingId}/payment`, { payment_status: ps })
      .then((r) => {
        setBookings((prev) => prev.map((b) => b.id === bookingId ? r.data : b));
        flash("Payment status updated.");
      })
      .catch(() => flash("Update failed."));
  };

  const handleStatus = (bookingId, status) => {
    api.patch(`/bookings/${bookingId}/status`, { status })
      .then((r) => {
        setBookings((prev) => prev.map((b) => b.id === bookingId ? r.data : b));
        flash(`Booking status set to ${status}.`);
      })
      .catch((e) => flash(e?.response?.data?.detail ?? "Update failed."));
  };

  return (
    <div>
      <h1 className="dashboard-page-title">Bookings Management</h1>
      <p className="dashboard-page-subtitle">View all bookings, update statuses and payment.</p>

      {msg && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px", background: "rgba(103,213,140,0.1)", color: "#67d58c", border: "1px solid rgba(103,213,140,0.2)" }}>
          {msg}
        </div>
      )}

      {/* Status Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              border: tab === t ? "none" : "1px solid var(--border-soft)",
              background: tab === t ? "var(--accent)" : "transparent",
              color: tab === t ? "#111" : "var(--text-soft)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading...</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">No bookings found.</div>
      ) : (
        <div className="list-stack">
          {bookings.map((b) => {
            const expanded = expandedId === b.id;
            return (
              <div key={b.id} className="dashboard-card" style={{ padding: "18px" }}>
                {/* Header row */}
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", cursor: "pointer" }}
                  onClick={() => setExpandedId(expanded ? null : b.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "15px" }}>Booking #{b.id}</span>
                    <span className={`status-pill ${STATUS_CLASS[b.status] ?? "pending"}`}>{b.status}</span>
                    <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: "rgba(255,255,255,0.05)", color: PAYMENT_COLOR[b.payment_status] ?? "var(--text-soft)" }}>
                      💳 {b.payment_status}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span className="small-muted">{new Date(b.scheduled_for).toLocaleString()}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "18px" }}>{expanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div style={{ marginTop: "16px", borderTop: "1px solid var(--border-faint)", paddingTop: "16px" }}>
                    <div className="form-grid-2" style={{ marginBottom: "14px" }}>
                      <p className="small-muted" style={{ margin: 0 }}>User ID: <strong style={{ color: "var(--text-main)" }}>{b.user_id}</strong></p>
                      <p className="small-muted" style={{ margin: 0 }}>Counselor ID: <strong style={{ color: "var(--text-main)" }}>{b.counselor_id}</strong></p>
                      {b.reason && <p className="small-muted" style={{ margin: 0, gridColumn: "1/-1" }}>Reason: {b.reason}</p>}
                    </div>

                    {/* Update Booking Status */}
                    <div style={{ marginBottom: "12px" }}>
                      <p className="form-label">Update Booking Status</p>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {["PENDING", "APPROVED", "DECLINED", "COMPLETED", "CANCELLED"].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatus(b.id, s)}
                            style={{
                              padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                              border: b.status === s ? "none" : "1px solid var(--border-soft)",
                              background: b.status === s ? "var(--accent)" : "transparent",
                              color: b.status === s ? "#111" : "var(--text-soft)",
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Update Payment Status */}
                    <div>
                      <p className="form-label">Update Payment Status</p>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {["PENDING", "PAID", "WAIVED"].map((ps) => (
                          <button
                            key={ps}
                            onClick={() => handlePayment(b.id, ps)}
                            style={{
                              padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                              border: b.payment_status === ps ? "none" : "1px solid var(--border-soft)",
                              background: b.payment_status === ps ? "var(--accent)" : "transparent",
                              color: b.payment_status === ps ? "#111" : "var(--text-soft)",
                            }}
                          >
                            {ps}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BookingsManagement;
