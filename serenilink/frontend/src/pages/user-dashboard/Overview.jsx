import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const WELLNESS_TIPS = [
  "Take 2 minutes to pause, breathe slowly, and notice how your body feels before starting your next task.",
  "Drink a glass of water and step outside for 5 minutes — small resets matter.",
  "Write down one thing you are grateful for today. It shifts your focus.",
  "You don't have to solve everything today. One step at a time is enough.",
  "Rest is productive. Giving yourself permission to pause is a form of self-care.",
  "Check in with your body — are you holding tension anywhere? Take a slow breath and release it.",
  "Reaching out for support is a sign of strength, not weakness.",
];

const MOOD_EMOJI = {
  HAPPY: "😊", SAD: "😢", ANXIOUS: "😰", CALM: "😌",
  STRESSED: "😤", ANGRY: "😠", TIRED: "😴", OKAY: "🙂",
};

function StatCard({ title, value, label, accent }) {
  return (
    <div className="dashboard-card">
      <h3>{title}</h3>
      <div className="metric-value" style={accent ? { color: accent } : {}}>{value ?? "—"}</div>
      {label && <p className="metric-label">{label}</p>}
    </div>
  );
}

function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const tip = WELLNESS_TIPS[new Date().getDay() % WELLNESS_TIPS.length];

  useEffect(() => {
    api.get("/dashboard/me")
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading dashboard...</div>;
  if (error) return <div style={{ color: "#f08f8f", padding: "40px" }}>{error}</div>;

  const { moods_last_7_days, assessments_last_7_days, bookings, progress, recommended_content } = data;
  const nextBooking = bookings?.next_booking;

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: "28px" }}>
        <h1 className="dashboard-page-title">
          Welcome back, <span style={{ color: "var(--accent)" }}>{user?.nickname}</span> 👋
        </h1>
        <p className="dashboard-page-subtitle">Here is a quick view of your wellness journey.</p>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-card" style={{ marginBottom: "20px" }}>
        <h3>Quick Actions</h3>
        <div className="quick-links">
          <Link className="quick-link-chip" to="/dashboard/ai-support">💬 Start AI Chat</Link>
          <Link className="quick-link-chip" to="/dashboard/checkins">📝 New Check-in</Link>
          <Link className="quick-link-chip" to="/dashboard/counselors">🔍 Find Counselor</Link>
          <Link className="quick-link-chip" to="/dashboard/bookings">📅 View Bookings</Link>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="dashboard-grid dashboard-cards-4" style={{ marginBottom: "20px" }}>
        <StatCard
          title="Moods Logged"
          value={moods_last_7_days?.total ?? 0}
          label="Last 7 days"
        />
        <StatCard
          title="Avg Mood"
          value={assessments_last_7_days?.avg_mood != null ? `${assessments_last_7_days.avg_mood.toFixed(1)}/10` : "—"}
          label="Last 7 days"
        />
        <StatCard
          title="Avg Stress"
          value={assessments_last_7_days?.avg_stress != null ? `${assessments_last_7_days.avg_stress.toFixed(1)}/10` : "—"}
          label="Last 7 days"
          accent="#f5c95f"
        />
        <StatCard
          title="Milestones"
          value={progress?.milestones_count ?? 0}
          label="Total logged"
        />
      </div>

      {/* Middle Row */}
      <div className="dashboard-grid dashboard-cards-3" style={{ marginBottom: "20px" }}>
        {/* Mood Summary */}
        <div className="dashboard-card">
          <h3>Mood Summary</h3>
          <p className="small-muted" style={{ marginBottom: "12px" }}>Last 7 days — {moods_last_7_days?.total ?? 0} entries</p>
          {moods_last_7_days?.total > 0 ? (
            <div className="list-stack">
              {Object.entries(moods_last_7_days.counts).map(([mood, count]) => (
                <div key={mood} className="simple-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{MOOD_EMOJI[mood] || "🔵"} {mood}</span>
                  <span style={{ color: "var(--accent)", fontWeight: 600 }}>{count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ minHeight: "80px" }}>No mood entries this week.</div>
          )}
        </div>

        {/* Assessments Summary */}
        <div className="dashboard-card">
          <h3>Assessment Summary</h3>
          <p className="small-muted" style={{ marginBottom: "12px" }}>Last 7 days — {assessments_last_7_days?.checkins ?? 0} check-ins</p>
          <div className="list-stack">
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Avg Mood</span>
              <span style={{ color: "var(--accent)" }}>{assessments_last_7_days?.avg_mood?.toFixed(1) ?? "—"}/10</span>
            </div>
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Avg Stress</span>
              <span style={{ color: "#f5c95f" }}>{assessments_last_7_days?.avg_stress?.toFixed(1) ?? "—"}/10</span>
            </div>
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Avg Sleep</span>
              <span style={{ color: "#67d58c" }}>{assessments_last_7_days?.avg_sleep?.toFixed(1) ?? "—"}/10</span>
            </div>
          </div>
        </div>

        {/* Bookings Summary */}
        <div className="dashboard-card">
          <h3>Bookings</h3>
          <div className="list-stack">
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Total</span><span style={{ color: "var(--accent)", fontWeight: 600 }}>{bookings?.total ?? 0}</span>
            </div>
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Pending</span><span style={{ color: "#f5c95f", fontWeight: 600 }}>{bookings?.pending ?? 0}</span>
            </div>
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Approved</span><span style={{ color: "#67d58c", fontWeight: 600 }}>{bookings?.approved ?? 0}</span>
            </div>
          </div>
          {nextBooking && (
            <div style={{ marginTop: "12px", padding: "10px", background: "rgba(202,163,143,0.08)", borderRadius: "10px" }}>
              <p className="small-muted">Next Session</p>
              <p style={{ margin: "4px 0", fontWeight: 600 }}>
                {new Date(nextBooking.scheduled_for).toLocaleString()}
              </p>
              <span className="status-pill approved">Approved</span>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Content + Wellness Tip */}
      <div className="dashboard-grid dashboard-cards-2" style={{ marginBottom: "20px" }}>
        <div className="dashboard-card">
          <h3>Recommended Content</h3>
          {recommended_content?.length > 0 ? (
            <div className="list-stack">
              {recommended_content.map((c) => (
                <div key={c.id} className="simple-item">
                  <p style={{ margin: 0, fontWeight: 600 }}>{c.title}</p>
                  <p className="small-muted" style={{ margin: "4px 0 0" }}>{c.category}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No recommended content yet. Check back soon.</div>
          )}
        </div>

        <div className="dashboard-card">
          <h3>🌿 Daily Wellness Tip</h3>
          <p style={{ lineHeight: 1.7, color: "var(--text-soft)", marginTop: "10px" }}>{tip}</p>
        </div>
      </div>
    </div>
  );
}

export default Overview;
