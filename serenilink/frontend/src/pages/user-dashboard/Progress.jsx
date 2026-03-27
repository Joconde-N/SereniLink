import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const TREND_COLOR = { IMPROVING: "#67d58c", STABLE: "#f5c95f", DECLINING: "#f08f8f" };
const TREND_ICON = { IMPROVING: "↑", STABLE: "→", DECLINING: "↓" };

const METRICS = [
  { key: "avg_mood", label: "Mood", color: "var(--accent)" },
  { key: "avg_stress", label: "Stress", color: "#f5c95f" },
  { key: "avg_sleep", label: "Sleep", color: "#67d58c" },
];

function MiniBar({ value, max = 10, color }) {
  const pct = Math.min(100, ((value || 0) / max) * 100);
  return (
    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "999px", height: "8px", width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "999px", transition: "width 0.6s ease" }} />
    </div>
  );
}

function MetricCard({ title, value7, trend, color }) {
  return (
    <div className="dashboard-card">
      <h3>{title}</h3>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "12px" }}>
        <div>
          <div className="metric-value" style={{ color }}>{value7 != null ? value7.toFixed(1) : "—"}</div>
          <p className="small-muted">Last 7 days avg</p>
        </div>
        {trend && (
          <span style={{ color: TREND_COLOR[trend], fontWeight: 700, fontSize: "14px" }}>
            {TREND_ICON[trend]} {trend}
          </span>
        )}
      </div>
      <MiniBar value={value7} color={color} />
    </div>
  );
}

function StreakCard({ streak }) {
  return (
    <div className="dashboard-card">
      <h3>Streak</h3>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "12px" }}>
        <div>
          <div className="metric-value" style={{ color: "#f08f8f" }}>{streak}</div>
          <p className="small-muted">Consecutive days</p>
        </div>
      </div>
      <MiniBar value={Math.min(streak, 30)} max={30} color="#f08f8f" />
    </div>
  );
}

function WellnessChart({ data, days }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ padding: "40px 0" }}>
        No check-in data for the last {days} days.
      </div>
    );
  }

  const W = 600, H = 200, PAD = { top: 16, right: 16, bottom: 32, left: 32 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = 10;

  const xStep = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const toX = (i) => PAD.left + (data.length > 1 ? i * xStep : innerW / 2);
  const toY = (v) => PAD.top + innerH - ((v ?? 0) / max) * innerH;

  const linePath = (key) =>
    data
      .map((d, i) => (d[key] != null ? `${i === 0 ? "M" : "L"}${toX(i)},${toY(d[key])}` : ""))
      .filter(Boolean)
      .join(" ");

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const formatLabel = (str) => {
    const d = new Date(str);
    return DAYS[d.getDay()];
  };

  const segments = days === 30
    ? [[1, 7], [8, 14], [15, 21], [22, 31]]
    : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {/* Y gridlines */}
      {[0, 2.5, 5, 7.5, 10].map((v) => {
        const y = toY(v);
        return (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">{v}</text>
          </g>
        );
      })}

      {/* Metric lines */}
      {METRICS.map(({ key, color }) => (
        <path key={key} d={linePath(key)} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      ))}

      {/* Dots */}
      {METRICS.map(({ key, color }) =>
        data.map((d, i) =>
          d[key] != null ? (
            <circle key={`${key}-${i}`} cx={toX(i)} cy={toY(d[key])} r="3" fill={color} />
          ) : null
        )
      )}

      {/* X labels */}
      {segments
        ? segments.map(([start, end]) => {
            const label = `${start}–${end}`;
            // find indices of data points within this segment
            const indices = data
              .map((d, i) => ({ day: new Date(d.date).getDate(), i }))
              .filter(({ day }) => day >= start && day <= end)
              .map(({ i }) => i);
            if (indices.length === 0) return null;
            const midX = (toX(indices[0]) + toX(indices[indices.length - 1])) / 2;
            const segX1 = toX(indices[0]);
            const segX2 = toX(indices[indices.length - 1]);
            return (
              <g key={label}>
                <line x1={segX1} x2={segX2} y1={H - PAD.bottom + 6} y2={H - PAD.bottom + 6}
                  stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <text x={midX} y={H - 6} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)">
                  Days {label}
                </text>
              </g>
            );
          })
        : data.map((d, i) => (
            <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)">
              {formatLabel(d.date)}
            </text>
          ))
      }
    </svg>
  );
}

function Progress() {
  const [analytics, setAnalytics] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [chartDays, setChartDays] = useState(7);
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

  const loadDaily = (days) => {
    api.get(`/progress/me/daily?days=${days}`)
      .then((res) => setDailyData(res.data))
      .catch(() => {});
  };

  useEffect(() => { load(); loadDaily(7); }, []);

  const handleChartDaysChange = (e) => {
    const d = Number(e.target.value);
    setChartDays(d);
    loadDaily(d);
  };

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
  const trend = analytics?.trend;

  return (
    <div>
      <h1 className="dashboard-page-title">Progress</h1>
      <p className="dashboard-page-subtitle">View trends in mood, stress, and sleep from your analytics.</p>

      {/* Metric Cards */}
      <div className="dashboard-grid dashboard-cards-4" style={{ marginBottom: "20px" }}>
        <MetricCard title="Mood" value7={l7?.avg_mood} trend={trend?.mood} color="var(--accent)" />
        <MetricCard title="Stress" value7={l7?.avg_stress} trend={trend?.stress} color="#f5c95f" />
        <MetricCard title="Sleep" value7={l7?.avg_sleep} trend={trend?.sleep} color="#67d58c" />
        <StreakCard streak={analytics?.streak ?? 0} />
      </div>

      {/* Wellness Trends Chart */}
      <div className="dashboard-card" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0 }}>Wellness Trends</h3>
            <p className="small-muted" style={{ margin: "4px 0 0" }}>Daily avg mood, stress &amp; sleep</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Legend */}
            <div style={{ display: "flex", gap: "12px" }}>
              {METRICS.map(({ label, color }) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, display: "inline-block" }} />
                  {label}
                </span>
              ))}
            </div>
            {/* Dropdown */}
            <select
              value={chartDays}
              onChange={handleChartDaysChange}
              style={{
                background: "var(--bg-panel)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "8px",
                color: "var(--text-main)",
                padding: "6px 10px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
        </div>
        <WellnessChart data={dailyData} days={chartDays} />
      </div>

      {/* Milestones */}
      <div className="dashboard-grid dashboard-cards-2">
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
    </div>
  );
}

export default Progress;
