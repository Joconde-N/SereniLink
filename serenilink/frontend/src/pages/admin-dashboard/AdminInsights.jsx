import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const STATUS_CLASS = {
  PENDING: "pending", APPROVED: "approved", DECLINED: "declined",
  CANCELLED: "cancelled", COMPLETED: "approved",
};
const PAYMENT_COLOR = { PENDING: "#f5c95f", PAID: "#67d58c", WAIVED: "#caa38f" };

function MetricRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-faint)" }}>
      <span style={{ color: "var(--text-soft)", fontSize: "14px" }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: "18px", color: color ?? "var(--text-main)" }}>{value ?? "—"}</span>
    </div>
  );
}

function AdminInsights() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/admin/insights")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading insights...</div>;
  if (!data) return <div className="empty-state">Failed to load insights.</div>;

  const t  = data.totals ?? {};
  const bs = data.bookings_by_status ?? {};
  const bp = data.bookings_by_payment_status ?? {};

  const totalBookings = Object.values(bs).reduce((a, b) => a + b, 0);

  return (
    <div>
      <h1 className="dashboard-page-title">Platform Insights</h1>
      <p className="dashboard-page-subtitle">Real-time metrics and reporting across the entire platform.</p>

      {/* Summary Cards */}
      <div className="dashboard-grid dashboard-cards-4" style={{ marginBottom: "24px" }}>
        {[
          { title: "Total Users",         value: t.users },
          { title: "Total Counselors",    value: t.counselors,        color: "#67d58c" },
          { title: "Total Bookings",      value: t.bookings },
          { title: "Total Assessments",   value: t.assessments,       color: "var(--accent)" },
          { title: "Total Content",       value: t.content },
          { title: "Published Content",   value: t.published_content, color: "#67d58c" },
          { title: "Mood Entries",        value: t.mood_entries,      color: "var(--accent)" },
        ].map((m) => (
          <div key={m.title} className="dashboard-card">
            <p className="metric-label" style={{ marginBottom: "8px" }}>{m.title}</p>
            <div className="metric-value" style={m.color ? { color: m.color } : {}}>{m.value ?? "—"}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid dashboard-cards-2">
        {/* Bookings by Status */}
        <div className="dashboard-card">
          <h3>Bookings by Status</h3>
          {Object.entries(bs).map(([status, count]) => {
            const pct = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
            return (
              <div key={status}>
                <MetricRow label={status} value={count} />
                <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", margin: "4px 0 8px" }}>
                  <div style={{ height: "100%", borderRadius: "4px", width: `${pct}%`, background: status === "APPROVED" || status === "COMPLETED" ? "#67d58c" : status === "PENDING" ? "#f5c95f" : "#f08f8f" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bookings by Payment */}
        <div className="dashboard-card">
          <h3>Bookings by Payment Status</h3>
          {Object.entries(bp).map(([ps, count]) => {
            const pct = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
            return (
              <div key={ps}>
                <MetricRow label={ps} value={count} color={PAYMENT_COLOR[ps]} />
                <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", margin: "4px 0 8px" }}>
                  <div style={{ height: "100%", borderRadius: "4px", width: `${pct}%`, background: PAYMENT_COLOR[ps] ?? "var(--accent)" }} />
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: "20px", padding: "14px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid var(--border-faint)" }}>
            <p className="metric-label" style={{ margin: "0 0 6px" }}>Content Publish Rate</p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }}>
                <div style={{ height: "100%", borderRadius: "4px", width: `${t.content > 0 ? Math.round((t.published_content / t.content) * 100) : 0}%`, background: "var(--accent)" }} />
              </div>
              <span style={{ fontWeight: 700, color: "var(--accent)", fontSize: "14px" }}>
                {t.content > 0 ? Math.round((t.published_content / t.content) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminInsights;
