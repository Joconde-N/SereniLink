import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuHeartPulse,
  LuMessageCircle,
  LuCalendarPlus,
  LuClipboardList,
} from "react-icons/lu";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import RiskMonitorCard from "../../components/user-dashboard/RiskMonitorCard";

const WELLNESS_TIPS = [
  "Take 2 minutes to pause, breathe slowly, and notice how your body feels before starting your next task.",
  "Drink a glass of water and step outside for 5 minutes — small resets matter.",
  "Write down one thing you are grateful for today. It shifts your focus.",
  "You don't have to solve everything today. One step at a time is enough.",
  "Rest is productive. Giving yourself permission to pause is a form of self-care.",
  "Check in with your body — are you holding tension anywhere? Take a slow breath and release it.",
  "Reaching out for support is a sign of strength, not weakness.",
];

const QUICK_ACTIONS = [
  {
    label: "Mood Check-in",
    to: "/dashboard/checkins",
    icon: LuHeartPulse,
    iconBg: "rgba(103, 213, 140, 0.15)",
    iconColor: "#67d58c",
  },
  {
    label: "Start AI Chat",
    to: "/dashboard/ai-support",
    icon: LuMessageCircle,
    iconBg: "rgba(96, 165, 250, 0.15)",
    iconColor: "#60a5fa",
  },
  {
    label: "Book Counselor",
    to: "/dashboard/counselors",
    icon: LuCalendarPlus,
    iconBg: "rgba(202, 163, 143, 0.18)",
    iconColor: "var(--accent)",
  },
  {
    label: "Complete Assessment",
    to: "/dashboard/screenings",
    icon: LuClipboardList,
    iconBg: "rgba(167, 139, 250, 0.15)",
    iconColor: "#a78bfa",
  },
];

function StatCard({ title, value, label, accent }) {
  return (
    <div className="dashboard-card">
      <h3>{title}</h3>
      <div className="metric-value" style={accent ? { color: accent } : {}}>{value ?? "—"}</div>
      {label && <p className="metric-label">{label}</p>}
    </div>
  );
}

function formatSessionTime(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const day = isToday ? "Today" : isTomorrow ? "Tomorrow" : date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });

  return `${day}, ${time}`;
}

/** Shuffle an array using a numeric seed so the order stays stable for one login session. */
function seededShuffle(items, seed) {
  const arr = [...items];
  let s = Number(seed) || Date.now();
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function UpcomingSessions() {
  const [sessions, setSessions] = useState([]);
  const [counselors, setCounselors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/bookings/me", { params: { limit: 50 } })
      .then(async (res) => {
        const now = new Date();
        const upcoming = res.data
          .filter((b) => b.status === "APPROVED" && new Date(b.scheduled_for) >= now)
          .sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for))
          .slice(0, 4);

        setSessions(upcoming);

        const ids = [...new Set(upcoming.map((b) => b.counselor_id))];
        const res2 = await api.get("/counselors/");
        const map = {};
        res2.data.forEach((c) => { if (ids.includes(c.id)) map[c.id] = c; });
        setCounselors(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0 }}>Upcoming Sessions</h3>
        <Link to="/dashboard/bookings" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>View all</Link>
      </div>

      {loading ? (
        <p className="small-muted">Loading...</p>
      ) : sessions.length === 0 ? (
        <div className="empty-state" style={{ minHeight: "80px" }}>No upcoming sessions.</div>
      ) : (
        <div className="list-stack">
          {sessions.map((b) => {
            const c = counselors[b.counselor_id];
            const name = c?.full_name || b.counselor_name || "Counselor";
            return (
              <div key={b.id} className="simple-item" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {c?.profile_image_url ? (
                  <img src={c.profile_image_url} alt={name}
                    style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(202,163,143,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                    {name.charAt(0)}
                  </div>
                )}
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "var(--text-main)" }}>
                    {name}
                  </p>
                  {c?.title && (
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>{c.title}</p>
                  )}
                  <p style={{ margin: 0, fontSize: 12, color: "var(--accent)" }}>
                    {formatSessionTime(b.scheduled_for)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Overview() {
  const { user } = useAuth();
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

  const { moods_last_7_days, assessments_last_7_days, progress, recommended_content } = data;

  // Shuffle once per login (seed set in AuthContext). Order stays stable until logout/login again.
  let seed = sessionStorage.getItem("sl_login_seed");
  if (!seed) {
    seed = String(Date.now());
    sessionStorage.setItem("sl_login_seed", seed);
  }
  const shuffledContent = seededShuffle(recommended_content || [], seed);

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 className="dashboard-page-title" style={{ marginBottom: 8 }}>
          Welcome back, <span style={{ color: "var(--accent)" }}>{user?.nickname}</span>
        </h1>
        <p className="dashboard-page-subtitle" style={{ marginBottom: 0 }}>
          Here is a quick view of your wellness journey.
        </p>
      </div>

      <section className="dashboard-section" aria-labelledby="quick-actions-heading">
        <div className="quick-actions-panel">
          <div className="dashboard-section-header dashboard-section-header--compact">
            <h2 id="quick-actions-heading" className="dashboard-section-title">Quick Actions</h2>
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

      <section className="dashboard-section" aria-labelledby="stats-heading">
        <div className="dashboard-section-header dashboard-section-header--compact">
          <h2 id="stats-heading" className="dashboard-section-title">Your week at a glance</h2>
        </div>
        <div className="dashboard-grid dashboard-cards-4">
          <StatCard
            title="Moods Logged"
            value={moods_last_7_days?.total ?? 0}
            label="Last 7 days"
          />
          <StatCard
            title="Avg Mood"
            value={assessments_last_7_days?.avg_mood != null ? assessments_last_7_days.avg_mood.toFixed(1) : "—"}
            label="Last 7 days"
          />
          <StatCard
            title="Avg Stress"
            value={assessments_last_7_days?.avg_stress != null ? assessments_last_7_days.avg_stress.toFixed(1) : "—"}
            label="Last 7 days"
            accent="#f5c95f"
          />
          <StatCard
            title="Milestones"
            value={progress?.milestones_count ?? 0}
            label="Total logged"
          />
        </div>
      </section>

      <section className="dashboard-section">
        <RiskMonitorCard />
      </section>

      <div className="dashboard-grid dashboard-cards-2" style={{ marginBottom: 20 }}>
        <UpcomingSessions />
        <div className="dashboard-card">
          <h3>Daily Wellness Tip</h3>
          <p style={{ lineHeight: 1.75, color: "var(--text-soft)", margin: "4px 0 0", fontSize: 15 }}>
            {tip}
          </p>
        </div>
      </div>

      <div className="dashboard-grid dashboard-cards-2">
        <div className="dashboard-card">
          <h3>Assessment Summary</h3>
          <p className="small-muted" style={{ marginBottom: 12 }}>
            Last 7 days — {assessments_last_7_days?.checkins ?? 0} check-ins
          </p>
          <div className="list-stack">
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Average Mood</span>
              <span style={{ color: "var(--accent)" }}>{assessments_last_7_days?.avg_mood?.toFixed(1) ?? "—"}/10</span>
            </div>
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Average Stress</span>
              <span style={{ color: "#f5c95f" }}>{assessments_last_7_days?.avg_stress?.toFixed(1) ?? "—"}/10</span>
            </div>
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Average Sleep</span>
              <span style={{ color: "#67d58c" }}>{assessments_last_7_days?.avg_sleep?.toFixed(1) ?? "—"}/10</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0 }}>Recommended Content</h3>
            <Link to="/dashboard/resources" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>View all</Link>
          </div>
          {shuffledContent.length > 0 ? (
            <div className="list-stack">
              {shuffledContent.slice(0, 4).map((c) => (
                <div key={c.id} className="simple-item">
                  <p style={{ margin: 0, fontWeight: 500, fontSize: 15 }}>{c.title}</p>
                  <p className="small-muted" style={{ margin: "4px 0 0" }}>{c.category}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ minHeight: 100 }}>No recommended content yet. Check back soon.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Overview;
