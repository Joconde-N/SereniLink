import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";

const STATUS_STYLE = {
  PENDING:   { color: "#f5c95f", bg: "rgba(245,201,95,0.12)" },
  APPROVED:  { color: "#67d58c", bg: "rgba(103,213,140,0.12)" },
  COMPLETED: { color: "#7eb8f7", bg: "rgba(126,184,247,0.12)" },
  DECLINED:  { color: "#f08f8f", bg: "rgba(240,143,143,0.12)" },
  CANCELLED: { color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
};
const PAYMENT_STYLE = {
  PENDING: { color: "#f5c95f" },
  PAID:    { color: "#67d58c" },
  WAIVED:  { color: "#caa38f" },
};
const STATUS_TABS = ["ALL", "PENDING", "APPROVED", "DECLINED", "COMPLETED", "CANCELLED"];

function tabLabel(t) {
  return t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase();
}
const BOOKING_STATUSES = ["PENDING", "APPROVED", "DECLINED", "COMPLETED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "WAIVED"];

function ActionPopover({ label, options, current, onSelect, accentCurrent }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          height: "32px", padding: "0 12px", borderRadius: "8px", fontSize: "12px",
          fontWeight: 600, cursor: "pointer",
          border: "1px solid rgba(176,176,176,0.15)",
          background: "rgba(255,255,255,0.04)", color: "var(--text-soft)",
        }}
      >
        {label}
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "38px", right: 0, zIndex: 100,
            background: "#1e1e22", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px", padding: "6px", minWidth: "160px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          }}>
            {options.map((opt) => {
              const active = current === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onSelect(opt); setOpen(false); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "8px 12px", borderRadius: "8px", border: "none",
                    background: active ? "rgba(202,163,143,0.15)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text-soft)",
                    fontSize: "13px", fontWeight: active ? 600 : 400, cursor: "pointer",
                  }}
                >
                  {active ? "✓ " : ""}{opt}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function BookingsManagement() {
  const [bookings, setBookings] = useState([]);
  const [tab, setTab]           = useState("ALL");
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState("");

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
      .then((r) => { setBookings((prev) => prev.map((b) => b.id === bookingId ? r.data : b)); flash("Payment status updated."); })
      .catch(() => flash("Update failed."));
  };

  const handleStatus = (bookingId, status) => {
    api.patch(`/bookings/${bookingId}/status`, { status })
      .then((r) => { setBookings((prev) => prev.map((b) => b.id === bookingId ? r.data : b)); flash(`Booking status set to ${status}.`); })
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
            key={t} type="button"
            onClick={() => setTab(t)}
            style={{
              padding: "7px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              border: tab === t ? "none" : "1px solid var(--border-soft)",
              background: tab === t ? "var(--accent)" : "transparent",
              color: tab === t ? "#111" : "var(--text-soft)",
            }}
          >
            {tabLabel(t)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading...</div>
      ) : bookings.length === 0 ? (
        <div className="dashboard-card"><div className="empty-state">No bookings found.</div></div>
      ) : (
        <div className="dashboard-card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-soft)" }}>
                {["Booking", "Scheduled", "User", "Counselor", "Payment", "Status", "Actions"].map((h) => (
                  <th key={h} style={{
                    padding: "13px 18px", textAlign: "left", fontSize: "13px",
                    fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => {
                const ss = STATUS_STYLE[b.status] ?? STATUS_STYLE.PENDING;
                const ps = PAYMENT_STYLE[b.payment_status] ?? PAYMENT_STYLE.PENDING;
                return (
                  <tr key={b.id} style={{ borderBottom: i < bookings.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 700, fontSize: "14px", whiteSpace: "nowrap" }}>
                      {b.id}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: "13px", color: "var(--text-soft)", whiteSpace: "nowrap" }}>
                      {new Date(b.scheduled_for).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {new Date(b.scheduled_for).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: "13px", color: "var(--text-soft)" }}>
                      User #{b.user_id}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: "13px", color: "var(--text-soft)" }}>
                      Counselor #{b.counselor_id}
                    </td>
                    <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: ps.color }}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                      <span style={{
                        display: "inline-block", padding: "4px 10px", borderRadius: "999px",
                        fontSize: "12px", fontWeight: 600, color: ss.color, background: ss.bg,
                      }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <ActionPopover
                          label="Booking Status"
                          options={BOOKING_STATUSES}
                          current={b.status}
                          onSelect={(s) => handleStatus(b.id, s)}
                        />
                        <ActionPopover
                          label="Payment Status"
                          options={PAYMENT_STATUSES}
                          current={b.payment_status}
                          onSelect={(ps) => handlePayment(b.id, ps)}
                        />
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

export default BookingsManagement;
