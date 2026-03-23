import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

const STATUS_CLASS = {
  PENDING: "pending", APPROVED: "approved",
  CANCELLED: "cancelled", DECLINED: "declined", COMPLETED: "approved",
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

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <Link to="/dashboard/bookings" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "14px" }}>
          ← Back to Bookings
        </Link>
      </div>

      <h1 className="dashboard-page-title">Booking Details</h1>
      <p className="dashboard-page-subtitle">Full details for your counseling session.</p>

      <div className="dashboard-grid dashboard-cards-2">
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
              <span className="small-muted">Reason</span>
              <p style={{ margin: "4px 0 0" }}>{booking.reason || "Not specified"}</p>
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
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
            {booking.status === "APPROVED" && (
              <Link
                to={`/dashboard/chat/${booking.id}`}
                className="primary-btn"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
              >
                Open Chat
              </Link>
            )}
            {(booking.status === "PENDING" || booking.status === "APPROVED") && (
              <button
                className="secondary-btn"
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                style={{ color: "#f08f8f", borderColor: "rgba(240,143,143,0.3)" }}
              >
                {cancelling ? "Cancelling..." : "Cancel Booking"}
              </button>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Contact Details</h3>
          {booking.status === "APPROVED" && contact ? (
            <div className="list-stack">
              <div className="simple-item">
                <span className="small-muted">Counselor</span>
                <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{contact.counselor_name}</p>
              </div>
              {contact.phone_number && (
                <div className="simple-item">
                  <span className="small-muted">Phone</span>
                  <p style={{ margin: "4px 0 0" }}>{contact.phone_number}</p>
                </div>
              )}
              {contact.general_location && (
                <div className="simple-item">
                  <span className="small-muted">Location</span>
                  <p style={{ margin: "4px 0 0" }}>{contact.general_location}</p>
                </div>
              )}
              {contact.office_address && (
                <div className="simple-item">
                  <span className="small-muted">Office Address</span>
                  <p style={{ margin: "4px 0 0" }}>{contact.office_address}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state" style={{ minHeight: "120px" }}>
              {booking.status === "APPROVED"
                ? "Contact details not available."
                : "Contact details are revealed after your booking is approved."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookingDetails;
