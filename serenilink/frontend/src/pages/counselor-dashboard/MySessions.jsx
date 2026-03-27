import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const STATUS_STYLE = {
  APPROVED:  { color: "#67d58c", bg: "rgba(103,213,140,0.12)", label: "Upcoming" },
  COMPLETED: { color: "var(--accent)", bg: "rgba(202,163,143,0.12)", label: "Completed" },
  CANCELLED: { color: "#e05555", bg: "rgba(224,85,85,0.12)", label: "Cancelled" },
  DECLINED:  { color: "#e05555", bg: "rgba(224,85,85,0.12)", label: "Declined" },
};

function timeUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  if (diff <= 0) return "Now / Past";
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `In ${d} day${d > 1 ? "s" : ""}`;
  if (h > 0) return `In ${h} hour${h > 1 ? "s" : ""}`;
  return "Very soon";
}

export default function MySessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("APPROVED");
  const [acting, setActing]     = useState(null);

  const load = (status) => {
    setLoading(true);
    const params = { limit: 100 };
    if (status) params.status = status;
    api.get("/bookings/counselor/me", { params })
      .then((res) => setSessions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

  const markComplete = async (id) => {
    if (!window.confirm("Mark this session as completed?")) return;
    setActing(id);
    try {
      await api.patch(`/bookings/${id}/counselor-status`, { status: "COMPLETED" });
      load(filter);
    } catch (err) {
      alert(err.response?.data?.detail || "Cannot complete this session.");
    } finally {
      setActing(null);
    }
  };

  const TABS = [
    { value: "APPROVED",  label: "Upcoming" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "DECLINED",  label: "Declined" },
  ];

  return (
    <div>
      <h1 className="dashboard-page-title">My Sessions</h1>
      <p className="dashboard-page-subtitle">Sessions that have been approved or already taken place.</p>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            style={{
              padding: "8px 18px", borderRadius: 999, cursor: "pointer", fontSize: 13,
              border: `1px solid ${filter === value ? "var(--accent)" : "var(--border-soft)"}`,
              background: filter === value ? "rgba(202,163,143,0.12)" : "transparent",
              color: filter === value ? "var(--accent)" : "var(--text-soft)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: 40, textAlign: "center" }}>Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="dashboard-card">
          <div className="empty-state">No {filter.toLowerCase()} sessions found.</div>
        </div>
      ) : (
        <div className="dashboard-card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-soft)" }}>
                {["Session", "Scheduled", "Client Note", "Status", "Actions"].map((h) => (
                  <th key={h} style={{
                    padding: "14px 20px", textAlign: "left",
                    fontSize: 13, fontWeight: 600,
                    color: "var(--text-muted)", letterSpacing: "0.04em",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((b, i) => {
                const ss = STATUS_STYLE[b.status] || STATUS_STYLE.APPROVED;
                const isUpcoming = b.status === "APPROVED";
                return (
                  <tr
                    key={b.id}
                    style={{ borderBottom: i < sessions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                  >
                    {/* Session */}
                    <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-main)" }}>
                        Session #{b.id}
                      </div>
                      {isUpcoming && (
                        <div style={{ fontSize: 12, color: "#67d58c", marginTop: 3 }}>
                          {timeUntil(b.scheduled_for)}
                        </div>
                      )}
                    </td>

                    {/* Scheduled */}
                    <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 13, color: "var(--text-soft)" }}>
                        {new Date(b.scheduled_for).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        {new Date(b.scheduled_for).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    {/* Client Note */}
                    <td style={{ padding: "16px 20px", maxWidth: 220 }}>
                      <span style={{
                        fontSize: 13, color: b.reason ? "var(--text-soft)" : "var(--text-muted)",
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {b.reason || "No note provided"}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                      <span style={{
                        display: "inline-block", padding: "5px 12px", borderRadius: 999,
                        fontSize: 12, fontWeight: 600,
                        color: ss.color, background: ss.bg,
                      }}>
                        {ss.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {isUpcoming ? (
                          <>
                            <Link
                              to={`/counselor/chat/${b.id}`}
                              style={{
                                height: 34, padding: "0 14px", borderRadius: 10, fontSize: 13,
                                fontWeight: 600, textDecoration: "none",
                                display: "inline-flex", alignItems: "center",
                                border: "1px solid rgba(255,255,255,0.12)",
                                background: "rgba(255,255,255,0.06)", color: "#e8e8e8",
                              }}
                            >
                              Chat
                            </Link>
                            <button
                              type="button"
                              onClick={() => markComplete(b.id)}
                              disabled={acting === b.id}
                              style={{
                                height: 34, padding: "0 14px", borderRadius: 10, fontSize: 13,
                                fontWeight: 600, cursor: "pointer",
                                border: "1px solid rgba(126,184,247,0.2)",
                                background: "rgba(126,184,247,0.1)", color: "#7eb8f7",
                              }}
                            >
                              {acting === b.id ? "..." : "Mark Complete"}
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
