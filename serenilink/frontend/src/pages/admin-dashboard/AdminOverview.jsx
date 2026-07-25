import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuUserCheck,
  LuUsers,
  LuChartBar,
  LuScrollText,
} from "react-icons/lu";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const STATUS_CLASS = {
  PENDING: "pending", APPROVED: "approved", DECLINED: "declined",
  CANCELLED: "cancelled", COMPLETED: "approved",
};

const QUICK_ACTIONS = [
  { label: "Approve Counselors", to: "/admin/applications", icon: LuUserCheck, iconBg: "rgba(103,213,140,0.15)", iconColor: "#67d58c" },
  { label: "Manage Users", to: "/admin/users", icon: LuUsers, iconBg: "rgba(96,165,250,0.15)", iconColor: "#60a5fa" },
  { label: "Platform Insights", to: "/admin/insights", icon: LuChartBar, iconBg: "rgba(202,163,143,0.18)", iconColor: "var(--accent)" },
  { label: "Audit Logs", to: "/admin/audit-logs", icon: LuScrollText, iconBg: "rgba(245,201,95,0.15)", iconColor: "#f5c95f" },
];

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
  const [exercises, setExercises]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [actionMsg, setActionMsg]   = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/admin/insights"),
      api.get("/counselor-applications/", { params: { status: "PENDING" } }),
      api.get("/bookings/", { params: { limit: 5 } }),
      api.get("/exercises/",{ params: { limit: 5 } }),
    ])
      .then(([iRes, pRes, bRes, eRes]) => {
        setInsights(iRes.data);
        setPending(pRes.data);
        setBookings(bRes.data);
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
        api.get("/dashboard/admin/insights").then((r) => setInsights(r.data)).catch(() => {});
      })
      .catch(() => setActionMsg("Action failed. Try again."));
  };

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading dashboard...</div>;

  const t = insights?.totals ?? {};

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 className="dashboard-page-title" style={{ marginBottom: 8 }}>
          Welcome, <span style={{ color: "var(--accent)" }}>{user?.nickname}</span>
        </h1>
        <p className="dashboard-page-subtitle" style={{ marginBottom: 0 }}>
          System overview — manage the entire SereniLink platform.
        </p>
      </div>

      <section className="dashboard-section" aria-labelledby="admin-quick-actions">
        <div className="quick-actions-panel">
          <div className="dashboard-section-header dashboard-section-header--compact">
            <h2 id="admin-quick-actions" className="dashboard-section-title">Quick Actions</h2>
          </div>
          <div className="quick-actions-grid">
            {QUICK_ACTIONS.map(({ label, to, icon: Icon, iconBg, iconColor }) => (
              <Link key={label} to={to} className="quick-action-btn">
                <span className="quick-action-icon" style={{ background: iconBg, color: iconColor }}>
                  <Icon aria-hidden />
                </span>
                <p className="quick-action-label">{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {actionMsg && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px", background: "rgba(103,213,140,0.1)", color: "#67d58c", border: "1px solid rgba(103,213,140,0.2)" }}>
          {actionMsg}
        </div>
      )}

      <div className="dashboard-grid dashboard-cards-4" style={{ marginBottom: "20px" }}>
        <StatCard title="Total Users"          value={t.users} />
        <StatCard title="Approved Counselors"  value={t.counselors}        color="#67d58c" />
        <StatCard title="Pending Applications" value={pending.length}      color="#f5c95f" />
        <StatCard title="Total Bookings"       value={t.bookings} />
      </div>

      <div className="dashboard-grid dashboard-cards-2" style={{ marginBottom: "20px" }}>
        <div className="dashboard-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0 }}>Pending Counselor Applications</h3>
            <Link to="/admin/applications" style={{ color: "var(--accent)", fontSize: "13px", textDecoration: "none" }}>View all →</Link>
          </div>
          {pending.length === 0 ? (
            <div className="empty-state" style={{ minHeight: "100px" }}>No pending applications.</div>
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

        <div className="dashboard-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0 }}>Recent Bookings</h3>
            <Link to="/admin/bookings" style={{ color: "var(--accent)", fontSize: "13px", textDecoration: "none" }}>All bookings →</Link>
          </div>
          {bookings.length === 0 ? (
            <div className="empty-state" style={{ minHeight: "100px" }}>No bookings yet.</div>
          ) : (
            <div className="list-stack">
              {bookings.slice(0, 4).map((b) => (
                <div key={b.id} className="simple-item">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "14px" }}>Booking #{b.id}</span>
                      <span className={`status-pill ${STATUS_CLASS[b.status] ?? "pending"}`} style={{ marginLeft: "8px" }}>{b.status}</span>
                      <p className="small-muted" style={{ margin: "4px 0 0" }}>
                        {new Date(b.scheduled_for).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-card">
        <h3>Platform Snapshot</h3>
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
