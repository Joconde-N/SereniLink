import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const TREND_COLOR = { IMPROVING: "#67d58c", STABLE: "#f5c95f", DECLINING: "#f08f8f" };
const TREND_ICON = { IMPROVING: "↑", STABLE: "→", DECLINING: "↓" };

function MiniBar({ value, max = 10, color }) {
  const pct = Math.min(100, ((value || 0) / max) * 100);
  return (
    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "999px", height: "8px", width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "999px", transition: "width 0.6s ease" }} />
    </div>
  );
}

function MetricCard({ title, value7, value30, trend, color }) {
  return (
    <div className="dashboard-card">
      <h3>{title}</h3>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "12px" }}>
        <div>
          <div className="metric-value" style={{ color }}>{value7 != null ? `${value7.toFixed(1)}/10` : "—"}</div>
          <p className="small-muted">Last 7 days</p>
        </div>
        {trend && (
          <span style={{ color: TREND_COLOR[trend], fontWeight: 700, fontSize: "18px" }}>
            {TREND_ICON[trend]} {trend}
          </span>
        )}
      </div>
      <MiniBar value={value7} color={color} />
      <p className="small-muted" style={{ marginTop: "8px" }}>
        30-day avg: {value30 != null ? `${value30.toFixed(1)}/10` : "—"}
      </p>
    </div>
  );
}

function Progress() {
  const [analytics, setAnalytics] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [newMilestone, setNewMilestone] = useState({ title: "", note: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = () => {
    Promise.all([
      api.get("/progress/me/analytics"),
      api.get("/progress/me"),
    ])
      .then(([aRes, mRes]) => { setAnalytics(aRes.data); setMilestones(mRes.data); })
      .catch(() => setError("Failed to load progress data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestone.title.trim()) return;
    setSaving(true); setSuccess(""); setError("");
    try {
      await api.post("/progress/", { title: newMilestone.title, note: newMilestone.note || undefined });
      setNewMilestone({ title: "", note: "" });
      setSuccess("Milestone added!");
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add milestone.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading progress...</div>;
  if (error && !analytics) return <div style={{ color: "#f08f8f", padding: "40px" }}>{error}</div>;

  const l7 = analytics?.last_7_days;
  const l30 = analytics?.last_30_days;
  const trend = analytics?.trend;

  return (
    <div>
      <h1 className="dashboard-page-title">Progress</h1>
      <p className="dashboard-page-subtitle">View trends in mood, stress, and sleep from your analytics.</p>

      {/* Metric Cards */}
      <div className="dashboard-grid dashboard-cards-3" style={{ marginBottom: "20px" }}>
        <MetricCard title="Mood" value7={l7?.avg_mood} value30={l30?.avg_mood} trend={trend?.mood} color="var(--accent)" />
        <MetricCard title="Stress" value7={l7?.avg_stress} value30={l30?.avg_stress} trend={trend?.stress} color="#f5c95f" />
        <MetricCard title="Sleep" value7={l7?.avg_sleep} value30={l30?.avg_sleep} trend={trend?.sleep} color="#67d58c" />
      </div>

      {/* Check-in counts */}
      <div className="dashboard-grid dashboard-cards-2" style={{ marginBottom: "20px" }}>
        <div className="dashboard-card">
          <h3>Check-in Summary</h3>
          <div className="list-stack">
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Last 7 days</span>
              <span style={{ color: "var(--accent)", fontWeight: 600 }}>{l7?.checkins ?? 0} check-ins</span>
            </div>
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Last 30 days</span>
              <span style={{ color: "var(--accent)", fontWeight: 600 }}>{l30?.checkins ?? 0} check-ins</span>
            </div>
          </div>
        </div>

        {/* Add Milestone */}
        <div className="dashboard-card">
          <h3>Add Milestone</h3>
          {error && <p style={{ color: "#f08f8f", fontSize: "13px", marginBottom: "8px" }}>{error}</p>}
          {success && <p style={{ color: "#67d58c", fontSize: "13px", marginBottom: "8px" }}>{success}</p>}
          <form onSubmit={handleAddMilestone}>
            <div style={{ marginBottom: "12px" }}>
              <label className="form-label">Title</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Completed 7-day streak"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label className="form-label">Note (optional)</label>
              <input
                className="form-input"
                type="text"
                placeholder="Any extra details..."
                value={newMilestone.note}
                onChange={(e) => setNewMilestone({ ...newMilestone, note: e.target.value })}
              />
            </div>
            <button className="primary-btn" type="submit" disabled={saving} style={{ width: "100%" }}>
              {saving ? "Saving..." : "Add Milestone"}
            </button>
          </form>
        </div>
      </div>

      {/* Milestones List */}
      <div className="dashboard-card">
        <h3>My Milestones ({milestones.length})</h3>
        {milestones.length === 0 ? (
          <div className="empty-state">No milestones yet. Add your first one above!</div>
        ) : (
          <div className="list-stack">
            {milestones.map((m) => (
              <div key={m.id} className="simple-item">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600 }}>🏆 {m.title}</span>
                  <span className="small-muted">{new Date(m.created_at).toLocaleDateString()}</span>
                </div>
                {m.note && <p className="small-muted" style={{ marginTop: "4px" }}>{m.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Progress;
