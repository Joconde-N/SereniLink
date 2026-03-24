import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const STATUS_CLASS = {
  PENDING: "pending", APPROVED: "approved",
  DECLINED: "declined", CANCELLED: "cancelled", COMPLETED: "approved",
};

function StatCard({ title, value, label, color }) {
  return (
    <div className="dashboard-card">
      <h3>{title}</h3>
      <div className="metric-value" style={color ? { color } : {}}>{value ?? "—"}</div>
      {label && <p className="metric-label">{label}</p>}
    </div>
  );
}

function CounselorOverview() {
  const { user } = useAuth();
  const [stats, setStats]       = useState(null);
  const [pending, setPending]   = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [slots, setSlots]       = useState([]);
  const [notifs, setNotifs]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/bookings/counselor/me/stats"),
      api.get("/bookings/counselor/me", { params: { status: "PENDING",  limit: 3 } }),
      api.get("/bookings/counselor/me", { params: { status: "APPROVED", limit: 3 } }),
      api.get("/availability/me",       { params: { status: "AVAILABLE", limit: 5 } }),
      api.get("/notifications/me",      { params: { unread_only: true,   limit: 5 } }),
    ])
      .then(([sRes, pRes, uRes, slRes, nRes]) => {
        setStats(sRes.data);
        setPending(pRes.data);
        setUpcoming(uRes.data);
        setSlots(slRes.data);
        setNotifs(nRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading dashboard...</div>;

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: "28px" }}>
        <h1 className="dashboard-page-title">
          Welcome, <span style={{ color: "var(--accent)" }}>{user?.nickname}</span> 
        </h1>
        <p className="dashboard-page-subtitle">Here is an overview of your counseling activity.</p>
      </div>

      {/* Stats */}
      <div className="dashboard-grid dashboard-cards-4" style={{ marginBottom: "20px" }}>
        <StatCard title="Total Bookings"   value={stats?.total_bookings}    label="All time" />
        <StatCard title="Pending Requests" value={stats?.pending_requests}  label="Awaiting action" color="#f5c95f" />
        <StatCard title="Today's Sessions" value={stats?.today_sessions}    label="Scheduled today"  color="var(--accent)" />
        <StatCard title="Upcoming"         value={stats?.upcoming_approved} label="Approved sessions" color="#67d58c" />
      </div>

      <div className="dashboard-grid dashboard-cards-2" style={{ marginBottom: "20px" }}>
        <div className="dashboard-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0 }}>Pending Requests</h3>
            <Link to="/counselor/requests" style={{ color: "var(--accent)", fontSize: "13px", textDecoration: "none" }}>View all →</Link>
          </div>
          {pending.length === 0 ? (
            <div className="empty-state" style={{ minHeight: "100px" }}>No pending requests.</div>
          ) : (
            <div className="list-stack">
              {pending.map((b) => (
                <div key={b.id} className="simple-item">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>Booking #{b.id}</span>
                    <span className="status-pill pending">PENDING</span>
                  </div>
                  <p className="small-muted" style={{ margin: "4px 0 0" }}>
                    {new Date(b.scheduled_for).toLocaleString()}
                  </p>
                  {b.reason && <p className="small-muted" style={{ margin: "4px 0 0", fontStyle: "italic" }}>{b.reason}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0 }}>Recent Notifications</h3>
            <Link to="/counselor/notifications" style={{ color: "var(--accent)", fontSize: "13px", textDecoration: "none" }}>View all →</Link>
          </div>
          {notifs.length === 0 ? (
            <div className="empty-state" style={{ minHeight: "100px" }}>No unread notifications.</div>
          ) : (
            <div className="list-stack">
              {notifs.map((n) => (
                <div key={n.id} className="simple-item notification-item unread">
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>{n.title}</p>
                  <p className="small-muted" style={{ margin: "4px 0 0" }}>{n.message}</p>
                  <p className="small-muted" style={{ margin: "4px 0 0", fontSize: "12px" }}>
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-grid dashboard-cards-2">
        <div className="dashboard-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0 }}>Upcoming Sessions</h3>
            <Link to="/counselor/sessions" style={{ color: "var(--accent)", fontSize: "13px", textDecoration: "none" }}>View all →</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="empty-state" style={{ minHeight: "100px" }}>No upcoming sessions.</div>
          ) : (
            <div className="list-stack">
              {upcoming.map((b) => (
                <div key={b.id} className="simple-item">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: "14px" }}>Booking #{b.id}</span>
                    <span className="status-pill approved">APPROVED</span>
                  </div>
                  <p className="small-muted" style={{ margin: "4px 0 0" }}>
                    {new Date(b.scheduled_for).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0 }}>Available Slots</h3>
            <Link to="/counselor/availability" style={{ color: "var(--accent)", fontSize: "13px", textDecoration: "none" }}>Manage →</Link>
          </div>
          {slots.length === 0 ? (
            <div className="empty-state" style={{ minHeight: "100px" }}>No available slots. Add some!</div>
          ) : (
            <div className="list-stack">
              {slots.map((s) => (
                <div key={s.id} className="simple-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>
                      {new Date(s.start_time).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    <p className="small-muted" style={{ margin: "2px 0 0" }}>
                      {new Date(s.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                      {new Date(s.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span style={{ padding: "4px 10px", borderRadius: "999px", background: "rgba(103,213,140,0.1)", color: "#67d58c", fontSize: "12px" }}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CounselorOverview;
