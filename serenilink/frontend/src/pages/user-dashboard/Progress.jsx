import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function WellnessChart({ data, days }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ padding: "40px 0" }}>
        No check-in data for the last {days} days.
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: days === 7
      ? DAYS[new Date(d.date).getDay()]
      : new Date(d.date).toLocaleDateString([], { month: "short", day: "numeric" }),
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#1a1a1d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", fontSize: "12px" }}>
        <p style={{ margin: "0 0 6px", color: "var(--text-muted)" }}>{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ margin: "2px 0", color: p.color }}>
            {p.name}: <strong>{p.value?.toFixed(1)}</strong>
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 10]} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        {METRICS.map(({ key, label, color }) => (
          <Line
            key={key} type="monotone" dataKey={key} name={label}
            stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }} connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
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
