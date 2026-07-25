import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const LEVEL_STYLE = {
  Low:      { color: "#67d58c", bg: "rgba(103,213,140,0.12)" },
  Moderate: { color: "#f5c95f", bg: "rgba(245,201,95,0.12)" },
  High:     { color: "#f08f8f", bg: "rgba(240,143,143,0.12)" },
};

const TYPE_LABEL = { PHQ9: "PHQ-9 (Depression)", GAD7: "GAD-7 (Anxiety)" };

function SeverityBadge({ severity }) {
  const color = severity === "Severe" || severity === "Moderately Severe"
    ? "#f08f8f"
    : severity === "Moderate"
      ? "#f5c95f"
      : "#67d58c";
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: `${color}18`, color, border: `1px solid ${color}30`,
    }}>
      {severity}
    </span>
  );
}

export default function MyClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/bookings/counselor/me/assigned-users"),
      api.get("/screenings/counselor/clients"),
    ])
      .then(([usersRes, screeningsRes]) => {
        const screeningMap = {};
        (screeningsRes.data || []).forEach((c) => {
          screeningMap[c.user_id] = c.screenings || [];
        });

        const merged = (usersRes.data || []).map((u) => ({
          ...u,
          screenings: screeningMap[u.user_id] || [],
        }));
        setClients(merged);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="dashboard-page-title">My Clients</h1>
      <p className="dashboard-page-subtitle">
        Clients with approved or completed sessions. Expand a client to review their assessment history.
        Support levels are wellness indicators only — not a clinical diagnosis.
      </p>

      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: 40, textAlign: "center" }}>Loading...</div>
      ) : clients.length === 0 ? (
        <div className="dashboard-card">
          <div className="empty-state">No assigned clients yet. Approve a booking to get started.</div>
        </div>
      ) : (
        <div className="list-stack">
          {clients.map((client) => {
            const ls = LEVEL_STYLE[client.support_level] || LEVEL_STYLE.Low;
            const isOpen = expanded === client.user_id;
            return (
              <div key={client.user_id} className="dashboard-card">
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, cursor: "pointer", flexWrap: "wrap" }}
                  onClick={() => setExpanded(isOpen ? null : client.user_id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(202,163,143,0.15)", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      color: "var(--accent)", fontWeight: 700, fontSize: 16,
                    }}>
                      {client.user_nickname?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16 }}>{client.user_nickname}</h3>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                        {client.total_sessions} session{client.total_sessions !== 1 ? "s" : ""}
                        {client.last_session ? ` · Last: ${new Date(client.last_session).toLocaleDateString()}` : ""}
                        {" · "}
                        {client.screenings.length} assessment{client.screenings.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      display: "inline-block", padding: "5px 12px", borderRadius: 999,
                      fontSize: 12, fontWeight: 600, color: ls.color, background: ls.bg,
                    }}>
                      {client.support_level}
                    </span>
                    {client.latest_booking_id && (
                      <Link
                        to={`/counselor/bookings/${client.latest_booking_id}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", whiteSpace: "nowrap" }}
                      >
                        View booking
                      </Link>
                    )}
                    <span style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 600 }}>
                      {isOpen ? "Hide" : "Expand"}
                    </span>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border-faint)" }}>
                    <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--text-soft)" }}>Assessment History</h4>
                    {client.screenings.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>No screenings completed yet.</p>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border-faint)" }}>
                            {["Assessment", "Score", "Severity", "Date"].map((h) => (
                              <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {client.screenings.map((s) => (
                            <tr key={s.id} style={{ borderBottom: "1px solid var(--border-faint)" }}>
                              <td style={{ padding: "10px 12px", fontWeight: 600 }}>{TYPE_LABEL[s.type] || s.type}</td>
                              <td style={{ padding: "10px 12px", color: "var(--text-soft)" }}>{s.total_score}</td>
                              <td style={{ padding: "10px 12px" }}><SeverityBadge severity={s.severity} /></td>
                              <td style={{ padding: "10px 12px", color: "var(--text-soft)", whiteSpace: "nowrap" }}>
                                {new Date(s.created_at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
