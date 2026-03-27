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
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await api.get(`/bookings/me`, { params: { limit: 50 } });
        const found = res.data.find((b) => b.id === parseInt(id));
        if (!found) { setError("Booking not found."); return; }
        setBooking(found);

        if (found.status === "APPROVED") {
          try {
            const cRes = await api.get(`/bookings/${id}/contact`);
            setContact(cRes.data);
          } catch { /* contact not available */ }
        }
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

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading...</div>;
  if (error) return <div style={{ color: "#f08f8f", padding: "40px" }}>{error}</div>;

  const ss = STATUS_STYLE[booking.status] || STATUS_STYLE.PENDING;

  const rows = [
    { label: "Booking", value: `#${booking.id}` },
    { label: "Scheduled For", value: new Date(booking.scheduled_for).toLocaleString() },
    { label: "Reason", value: booking.reason || "—" },
    {
      label: "Payment",
      value: (
        <span style={{ color: booking.payment_status === "PAID" ? "#67d58c" : "#f5c95f", fontWeight: 600 }}>
          {booking.payment_status}
        </span>
      ),
    },
    {
      label: "Status",
      value: (
        <span style={{
          display: "inline-block", padding: "5px 12px", borderRadius: 999,
          fontSize: 12, fontWeight: 600, color: ss.color, background: ss.bg,
        }}>
          {booking.status}
        </span>
      ),
    },
    { label: "Booked On", value: new Date(booking.created_at).toLocaleDateString() },
  ];

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
              {["Booking", "Reason", "Payment", "Status", "Booked On", "Actions"].map((h) => (
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
                <span style={{ fontSize: 13, fontWeight: 600, color: booking.payment_status === "PAID" ? "#67d58c" : "#f5c95f" }}>
                  {booking.payment_status}
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
                  {booking.status !== "PENDING" && booking.status !== "APPROVED" && (
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>—</span>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Contact details — separate card below the table */}
      <div className="dashboard-card">

        {booking.status === "APPROVED" && contact ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-soft)" }}>
                {["Counselor", "Phone", "Location", "Office Address"].map((h) => (
                  <th key={h} style={{
                    padding: "10px 16px", textAlign: "left",
                    fontSize: 13, fontWeight: 600,
                    color: "var(--text-muted)", letterSpacing: "0.04em",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600, color: "var(--text-main)" }}>
                  {contact.counselor_name || "—"}
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-soft)" }}>
                  {contact.phone_number || "—"}
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-soft)" }}>
                  {contact.general_location || "—"}
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-soft)" }}>
                  {contact.office_address || "—"}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="empty-state" style={{ minHeight: "100px" }}>
            {booking.status === "APPROVED"
              ? "Contact details not available."
              : "Contact details are revealed after your booking is approved."}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingDetails;
