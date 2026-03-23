import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const TYPE_COLORS = {
  BREATHING: { bg: "rgba(103,213,140,0.1)", border: "rgba(103,213,140,0.3)", text: "#67d58c" },
  GROUNDING: { bg: "rgba(202,163,143,0.1)", border: "rgba(202,163,143,0.3)", text: "var(--accent)" },
  JOURNAL: { bg: "rgba(147,112,219,0.1)", border: "rgba(147,112,219,0.3)", text: "#b39ddb" },
  TIP: { bg: "rgba(245,201,95,0.1)", border: "rgba(245,201,95,0.3)", text: "#f5c95f" },
};

const TYPE_ICON = { BREATHING: "🌬️", GROUNDING: "🌿", JOURNAL: "📓", TIP: "💡" };

function Exercises() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeType, setActiveType] = useState("ALL");
  const [expanded, setExpanded] = useState(null);
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem("exercises_done") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    api.get("/exercises/", { params: { limit: 100 } })
      .then((res) => setExercises(res.data))
      .catch(() => setError("Failed to load exercises."))
      .finally(() => setLoading(false));
  }, []);

  const toggleDone = (id) => {
    const updated = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(updated);
    localStorage.setItem("exercises_done", JSON.stringify(updated));
  };

  const types = ["ALL", ...Array.from(new Set(exercises.map((e) => e.type)))];
  const filtered = activeType === "ALL" ? exercises : exercises.filter((e) => e.type === activeType);

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading exercises...</div>;
  if (error) return <div style={{ color: "#f08f8f", padding: "40px" }}>{error}</div>;

  return (
    <div>
      <h1 className="dashboard-page-title">Exercises</h1>
      <p className="dashboard-page-subtitle">Practice simple coping exercises anytime you need support.</p>

      {/* Type Filter Tabs */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
        {types.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveType(t)}
            style={{
              padding: "8px 18px",
              borderRadius: "999px",
              border: `1px solid ${activeType === t ? "var(--accent)" : "var(--border-soft)"}`,
              background: activeType === t ? "rgba(202,163,143,0.12)" : "transparent",
              color: activeType === t ? "var(--accent)" : "var(--text-soft)",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {TYPE_ICON[t] || "✦"} {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="dashboard-card">
          <div className="empty-state">No exercises found for this category.</div>
        </div>
      ) : (
        <div className="dashboard-grid dashboard-cards-3">
          {filtered.map((ex) => {
            const style = TYPE_COLORS[ex.type] || TYPE_COLORS.TIP;
            const isDone = done.includes(ex.id);
            const isOpen = expanded === ex.id;
            return (
              <div
                key={ex.id}
                className="dashboard-card"
                style={{ border: `1px solid ${style.border}`, background: style.bg, opacity: isDone ? 0.7 : 1 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ fontSize: "22px" }}>{TYPE_ICON[ex.type] || "✦"}</span>
                  {isDone && <span style={{ color: "#67d58c", fontSize: "13px", fontWeight: 600 }}>✓ Done</span>}
                </div>
                <h3 style={{ margin: "0 0 6px", fontSize: "17px" }}>{ex.title}</h3>
                <span style={{ color: style.text, fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>{ex.type}</span>

                {isOpen && (
                  <div style={{ marginTop: "14px", color: "var(--text-soft)", fontSize: "14px", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {ex.instructions}
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button
                    className="primary-btn"
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : ex.id)}
                    style={{ flex: 1 }}
                  >
                    {isOpen ? "Close" : "View"}
                  </button>
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => toggleDone(ex.id)}
                    style={{ flex: 1, color: isDone ? "#67d58c" : "var(--text-soft)" }}
                  >
                    {isDone ? "Undo" : "Mark Done"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Exercises;
