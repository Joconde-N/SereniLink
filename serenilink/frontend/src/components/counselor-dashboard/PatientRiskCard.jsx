import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const LEVEL_CONFIG = {
  Low:      { color: "#67d58c", bg: "rgba(103,213,140,0.06)", border: "rgba(103,213,140,0.2)", icon: "🌿" },
  Moderate: { color: "#f5c95f", bg: "rgba(245,201,95,0.06)",  border: "rgba(245,201,95,0.2)",  icon: "🌤️" },
  High:     { color: "#f08f8f", bg: "rgba(240,143,143,0.06)", border: "rgba(240,143,143,0.2)", icon: "🆘" },
};

function PatientRiskCard({ userId }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (!userId) return;
    api.get(`/risk-monitoring/user/${userId}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.detail || "Unable to load support data."))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading support data...</div>;
  if (error)   return <div style={{ color: "var(--text-muted)", fontSize: 13, fontStyle: "italic" }}>{error}</div>;
  if (!data)   return null;

  const cfg = LEVEL_CONFIG[data.support_level] ?? LEVEL_CONFIG.Low;

  return (
    <div style={{ border: `1px solid ${cfg.border}`, background: cfg.bg, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>Client Support Level</h3>
        <span style={{
          padding: "3px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700,
          background: `${cfg.color}22`, color: cfg.color,
        }}>
          {cfg.icon} {data.support_level}
        </span>
      </div>

      <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, fontStyle: "italic" }}>
        {data.disclaimer}
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "PHQ-9", info: data.phq9 },
          { label: "GAD-7", info: data.gad7 },
        ].map(({ label, info }) => (
          <div key={label} style={{
            flex: 1, minWidth: 100, padding: "8px 12px", borderRadius: 10,
            background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-faint)",
          }}>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>{label}</p>
            {info ? (
              <>
                <p style={{ margin: "3px 0 0", fontWeight: 700, fontSize: 16, color: cfg.color }}>{info.score}</p>
                <p style={{ margin: "1px 0 0", fontSize: 11, color: "var(--text-soft)" }}>{info.severity}</p>
              </>
            ) : (
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Not completed</p>
            )}
          </div>
        ))}
        <div style={{
          flex: 1, minWidth: 100, padding: "8px 12px", borderRadius: 10,
          background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-faint)",
        }}>
          <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Mood (14d)</p>
          <p style={{ margin: "3px 0 0", fontWeight: 700, fontSize: 16, color: cfg.color }}>
            {Math.round(data.mood_summary.negative_ratio * 100)}%
          </p>
          <p style={{ margin: "1px 0 0", fontSize: 11, color: "var(--text-soft)" }}>
            negative · {data.mood_summary.total_entries_14d} entries
          </p>
        </div>
      </div>

      {data.support_level === "High" && (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(240,143,143,0.1)", border: "1px solid rgba(240,143,143,0.25)" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#f08f8f", fontWeight: 600 }}>
            🆘 This client may need urgent support. Consider prioritizing their session.
          </p>
        </div>
      )}
    </div>
  );
}

export default PatientRiskCard;
