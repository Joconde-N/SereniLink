import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const STATUS_CLASS = {
  PENDING: "pending", APPROVED: "approved",
  CANCELLED: "cancelled", DECLINED: "declined", COMPLETED: "approved",
};

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/bookings/me", { params: { limit: 50 } })
      .then((res) => setBookings(res.data))
      .catch(() => setError("Failed to load bookings."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading bookings...</div>;
  if (error) return <div style={{ color: "#f08f8f", padding: "40px" }}>{error}</div>;

  return (
    <div>
      <h1 className="dashboard-page-title">My Bookings</h1>
      <p className="dashboard-page-subtitle">Track your session requests and upcoming appointments.</p>

      {bookings.length === 0 ? (
        <div className="dashboard-card">
          <div className="empty-state">
            No bookings yet. <Link to="/dashboard/counselors" style={{ color: "var(--accent)" }}>Find a counselor</Link> to get started.
          </div>
        </div>
      ) : (
        <div className="dashboard-grid dashboard-cards-2">
          {bookings.map((b) => (
            <div className="dashboard-card" key={b.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <h3 style={{ margin: 0 }}>Booking #{b.id}</h3>
                <span className={`status-pill ${STATUS_CLASS[b.status] || "pending"}`}>{b.status}</span>
              </div>

              <div className="list-stack">
                <div className="simple-item">
                  <span className="small-muted">Scheduled</span>
                  <p style={{ margin: "4px 0 0", fontWeight: 600 }}>
                    {new Date(b.scheduled_for).toLocaleString()}
                  </p>
                </div>
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

              <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
                <Link
                  to={`/dashboard/bookings/${b.id}`}
                  className="secondary-btn"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                >
                  View Details
                </Link>

                {b.status === "APPROVED" && (
                  <Link
                    to={`/dashboard/chat/${b.id}`}
                    className="primary-btn"
                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                  >
                    Open Chat
                  </Link>
                )}

                {(b.status === "PENDING" || b.status === "APPROVED") && (
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => handleCancel(b.id)}
                    disabled={cancelling === b.id}
                    style={{ color: "#f08f8f", borderColor: "rgba(240,143,143,0.3)" }}
                  >
                    {cancelling === b.id ? "Cancelling..." : "Cancel"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyBookings;
