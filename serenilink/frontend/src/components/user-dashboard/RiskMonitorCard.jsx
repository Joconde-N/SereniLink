import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const LEVEL_CONFIG = {
  Low:      { color: "#67d58c", bg: "rgba(103,213,140,0.08)", border: "rgba(103,213,140,0.2)" },
  Moderate: { color: "#f5c95f", bg: "rgba(245,201,95,0.08)",  border: "rgba(245,201,95,0.2)" },
  High:     { color: "#f08f8f", bg: "rgba(240,143,143,0.08)", border: "rgba(240,143,143,0.2)" },
};

function RiskMonitorCard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    api.get("/risk-monitoring/me")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!data) return null;

  const cfg = LEVEL_CONFIG[data.support_level] ?? LEVEL_CONFIG.Low;

  return (
    <div className="dashboard-card" style={{ border: `1px solid ${cfg.border}`, background: cfg.bg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Wellness Support Level</h3>
        <span style={{
          padding: "4px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700,
          background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.border}`,
        }}>
          {data.support_level}
        </span>
      </div>

      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, fontStyle: "italic" }}>
        {data.disclaimer}
      </p>

      {/* Screening scores */}
      <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        {[
          { label: "PHQ-9", info: data.phq9 },
          { label: "GAD-7", info: data.gad7 },
        ].map(({ label, info }) => (
          <div key={label} style={{
            flex: 1, minWidth: 120, padding: "10px 14px", borderRadius: 10,
            background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-faint)",
          }}>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>{label}</p>
            {info ? (
              <>
                <p style={{ margin: "4px 0 0", fontWeight: 700, fontSize: 18, color: cfg.color }}>{info.score}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-soft)" }}>{info.severity}</p>
              </>
            ) : (
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                Not completed — <Link to="/dashboard/screenings" style={{ color: "var(--accent)" }}>Take now</Link>
              </p>
            )}
          </div>
        ))}
        <div style={{
          flex: 1, minWidth: 120, padding: "10px 14px", borderRadius: 10,
          background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-faint)",
        }}>
          <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Mood (14d)</p>
          <p style={{ margin: "4px 0 0", fontWeight: 700, fontSize: 18, color: cfg.color }}>
            {Math.round(data.mood_summary.negative_ratio * 100)}%
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-soft)" }}>
            negative · {data.mood_summary.total_entries_14d} entries
          </p>
        </div>
      </div>

      {/* Recommendations */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          background: "transparent", border: "none", color: cfg.color,
          fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: expanded ? 10 : 0,
        }}
      >
        {expanded ? "Hide recommendations" : "View recommendations"}
      </button>

      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.recommendations.map((rec, i) => (
            <div key={i} style={{
              padding: "10px 14px", borderRadius: 10,
              background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-faint)",
              fontSize: 13, color: "var(--text-soft)", lineHeight: 1.5,
            }}>
              {data.support_level === "High" && rec.includes("112") ? (
                <span style={{ color: "#f08f8f", fontWeight: 600 }}>{rec}</span>
              ) : rec}
            </div>
          ))}
          {data.support_level !== "Low" && (
            <Link
              to="/dashboard/counselors"
              style={{
                display: "block", textAlign: "center", marginTop: 4,
                padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: `${cfg.color}18`, color: cfg.color,
                border: `1px solid ${cfg.border}`, textDecoration: "none",
              }}
            >
              Book a Counselor Session →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default RiskMonitorCard;
