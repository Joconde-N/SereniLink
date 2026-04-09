import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const STATUS_CLASS = {
  PENDING: "pending", APPROVED: "approved", DECLINED: "declined",
  CANCELLED: "cancelled", COMPLETED: "approved",
};

const PAYMENT_COLOR = { PENDING: "#f5c95f", PAID: "#67d58c", WAIVED: "#caa38f" };

function StatCard({ title, value, color }) {
  return (
    <div className="dashboard-card">
      <p className="metric-label" style={{ marginBottom: "8px" }}>{title}</p>
      <div className="metric-value" style={color ? { color } : {}}>{value ?? "—"}</div>
    </div>
  );
}

function AdminOverview() {
  const { user } = useAuth();
  const [insights, setInsights]     = useState(null);
  const [pending, setPending]       = useState([]);
  const [bookings, setBookings]     = useState([]);
  const [content, setContent]       = useState([]);
  const [exercises, setExercises]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [actionMsg, setActionMsg]   = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/admin/insights"),
      api.get("/counselor-applications/", { params: { status: "PENDING" } }),
      api.get("/bookings/", { params: { limit: 5 } }),
      api.get("/content/",  { params: { limit: 5 } }),
      api.get("/exercises/",{ params: { limit: 5 } }),
    ])
      .then(([iRes, pRes, bRes, cRes, eRes]) => {
        setInsights(iRes.data);
        setPending(pRes.data);
        setBookings(bRes.data);
        setContent(cRes.data);
        setExercises(eRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleApplication = (id, action) => {
    api.patch(`/counselor-applications/${id}/${action}`)
      .then(() => {
        setPending((prev) => prev.filter((a) => a.id !== id));
        setActionMsg(`Application ${action}d successfully.`);
        setTimeout(() => setActionMsg(""), 3000);
        // refresh insights
        api.get("/dashboard/admin/insights").then((r) => setInsights(r.data)).catch(() => {});
      })
      .catch(() => setActionMsg("Action failed. Try again."));
  };

  const handlePayment = (bookingId, status) => {
    api.patch(`/bookings/${bookingId}/payment`, { payment_status: status })
      .then((r) => {
        setBookings((prev) => prev.map((b) => b.id === bookingId ? r.data : b));
        setActionMsg("Payment status updated.");
        setTimeout(() => setActionMsg(""), 3000);
      })
      .catch(() => setActionMsg("Update failed."));
  };

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading dashboard...</div>;

  const t = insights?.totals ?? {};
  const byStatus  = insights?.bookings_by_status ?? {};
  const byPayment = insights?.bookings_by_payment_status ?? {};

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: "28px" }}>
        <h1 className="dashboard-page-title">
          Welcome, <span style={{ color: "var(--accent)" }}>{user?.nickname}</span> 
        </h1>
        <p className="dashboard-page-subtitle">System overview — manage the entire SereniLink platform.</p>
      </div>

      {actionMsg && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px", background: "rgba(103,213,140,0.1)", color: "#67d58c", border: "1px solid rgba(103,213,140,0.2)" }}>
          {actionMsg}
        </div>
      )}

      {/* Summary Cards Row 1 */}
      <div className="dashboard-grid dashboard-cards-4" style={{ marginBottom: "20px" }}>
        <StatCard title="Total Users"          value={t.users} />
        <StatCard title="Approved Counselors"  value={t.counselors}        color="#67d58c" />
        <StatCard title="Pending Applications" value={pending.length}      color="#f5c95f" />
        <StatCard title="Total Bookings"       value={t.bookings} />
      </div>


      {/* Pending Applications + Payment Update — 2 col grid */}
      <div className="dashboard-grid dashboard-cards-2" style={{ marginBottom: "20px" }}>

        {/* Pending Applications Preview */}
        <div className="dashboard-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0 }}>Pending Counselor Applications</h3>
            <Link to="/admin/applications" style={{ color: "var(--accent)", fontSize: "13px", textDecoration: "none" }}>View all →</Link>
          </div>
          {pending.length === 0 ? (
            <div className="empty-state">No pending applications.</div>
          ) : (
            <div className="list-stack">
              {pending.slice(0, 3).map((a) => (
                <div key={a.id} className="simple-item">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>{a.full_name}</p>
                      <p className="small-muted" style={{ margin: "4px 0 0" }}>{a.specialization} {a.title ? `· ${a.title}` : ""}</p>
                      {a.bio && <p className="small-muted" style={{ margin: "4px 0 0", fontStyle: "italic" }}>{a.bio.slice(0, 100)}{a.bio.length > 100 ? "…" : ""}</p>}
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      <button className="primary-btn" style={{ height: "36px", padding: "0 14px", fontSize: "13px" }} onClick={() => handleApplication(a.id, "approve")}>Approve</button>
                      <button className="secondary-btn" style={{ height: "36px", padding: "0 14px", fontSize: "13px", color: "#f08f8f", borderColor: "rgba(239,68,68,0.3)" }} onClick={() => handleApplication(a.id, "reject")}>Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Update Preview */}
        <div className="dashboard-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0 }}>Update Payment Status</h3>
            <Link to="/admin/bookings" style={{ color: "var(--accent)", fontSize: "13px", textDecoration: "none" }}>All bookings →</Link>
          </div>
          {bookings.length === 0 ? (
            <div className="empty-state" style={{ minHeight: "100px" }}>No bookings.</div>
          ) : (
            <div className="list-stack">
              {bookings.slice(0, 3).map((b) => (
                <div key={b.id} className="simple-item">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "14px" }}>Booking #{b.id}</span>
                      <span className={`status-pill ${STATUS_CLASS[b.status] ?? "pending"}`} style={{ marginLeft: "8px" }}>{b.status}</span>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {["PENDING", "PAID", "WAIVED"].map((ps) => (
                        <button
                          key={ps}
                          onClick={() => handlePayment(b.id, ps)}
                          style={{
                            padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
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
              ))}
            </div>
          )}
        </div>

      </div>

      

      {/* Platform Insights */}
      <div className="dashboard-card">
        <h3>Platform Insights</h3>
        <div className="dashboard-grid dashboard-cards-4">
          {[
            { label: "Total Exercises",    value: t.exercises ?? exercises.length, color: "var(--accent)" },
            { label: "Published Content",  value: t.published_content, color: "#67d58c" },
            { label: "Total Assessments",  value: t.assessments },
            { label: "Mood Entries",       value: t.mood_entries, color: "var(--accent)" },
          ].map((m) => (
            <div key={m.label} style={{ textAlign: "center", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "14px", border: "1px solid var(--border-faint)" }}>
              <div className="metric-value" style={m.color ? { color: m.color, fontSize: "24px" } : { fontSize: "24px" }}>{m.value ?? "—"}</div>
              <p className="metric-label" style={{ margin: "6px 0 0" }}>{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminOverview;
