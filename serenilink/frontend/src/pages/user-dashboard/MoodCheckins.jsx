import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const MOODS = ["HAPPY", "OKAY", "CALM", "SAD", "ANXIOUS", "STRESSED", "ANGRY", "TIRED"];
const MOOD_EMOJI = {
  HAPPY: "😊", SAD: "😢", ANXIOUS: "😰", CALM: "😌",
  STRESSED: "😤", ANGRY: "😠", TIRED: "😴", OKAY: "🙂",
};

const SCORE_LABEL = (v) => {
  if (v <= 3) return "Low";
  if (v <= 6) return "Moderate";
  return "High";
};

const SLEEP_LABEL = (v) => {
  if (v <= 3) return "Poor";
  if (v <= 6) return "Fair";
  return "Great";
};

function SliderRow({ label, value, onChange, getLabel, color }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 14, color: "var(--text-soft)", fontWeight: 500 }}>{label}</span>
        <span style={{
          fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
          background: "rgba(202,163,143,0.1)", color: color || "var(--accent)",
        }}>
          {getLabel(value)} · {value}/10
        </span>
      </div>
      <input
        type="range" min="1" max="10" value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color || "var(--accent)", cursor: "pointer" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
        <span>1</span><span>10</span>
      </div>
    </div>
  );
}

function CheckinCard({ item }) {
  const moodScore = item.mood;
  const moodLabel = moodScore <= 3 ? "Low" : moodScore <= 6 ? "Moderate" : "High";
  return (
    <div className="simple-item">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-main)" }}>
            Mood: <span style={{ color: "var(--accent)" }}>{moodScore}/10</span>
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>({moodLabel})</span>
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Stress: <span style={{ color: "#f5c95f", fontWeight: 600 }}>{item.stress}/10</span>
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Sleep: <span style={{ color: "#67d58c", fontWeight: 600 }}>{item.sleep}/10</span>
        </span>
      </div>
      {item.notes && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text-soft)", fontStyle: "italic" }}>
          "{item.notes}"
        </p>
      )}
    </div>
  );
}

function MoodCheckins() {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const [mood, setMood] = useState("OKAY");
  const [stress, setStress] = useState(5);
  const [sleep, setSleep] = useState(5);
  const [notes, setNotes] = useState("");

  const loadHistory = () => {
    api.get("/assessments/me")
      .then((res) => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => { loadHistory(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setSubmitting(true);
    try {
      await api.post("/assessments/", {
        mood: 5, stress: parseInt(stress),
        sleep: parseInt(sleep), notes: notes || undefined,
      });
      await api.post("/moods/", { mood, note: notes || undefined });
      setSuccess("Check-in saved!");
      setNotes(""); setMood("OKAY"); setStress(5); setSleep(5);
      loadHistory();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save check-in.");
    } finally {
      setSubmitting(false);
    }
  };

  const recent = history.slice(0, 3);

  return (
    <div>
      <h1 className="dashboard-page-title">Mood Check-ins</h1>
      <p className="dashboard-page-subtitle">Track how you feel over time.</p>

      <div style={{ maxWidth: 999, margin: "0 auto" }}>

        {/* Main form card */}
        <div className="dashboard-card" style={{ marginBottom: 20 }}>

          {error && <p style={{ color: "#f08f8f", marginBottom: 14, fontSize: 13 }}>{error}</p>}
          {success && (
            <p style={{ color: "#67d58c", marginBottom: 14, fontSize: 13 }}>✓ {success}</p>
          )}

          <form onSubmit={handleSubmit}>

            {/* Current Mood */}
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Current Mood
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    gap: 4, padding: "20px 35px", borderRadius: 12, cursor: "pointer",
                    border: `1px solid ${mood === m ? "var(--accent)" : "var(--border-soft)"}`,
                    background: mood === m ? "rgba(202,163,143,0.15)" : "rgba(255,255,255,0.02)",
                    color: mood === m ? "var(--accent)" : "var(--text-soft)",
                    transition: "all 0.15s ease", minWidth: 80,
                  }}
                >
                  <span style={{ fontSize: 18, marginBottom:10 }}>{MOOD_EMOJI[m]}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>
                    {m.charAt(0) + m.slice(1).toLowerCase()}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ height: 1, background: "var(--border-soft)", marginBottom: 24 }} />

            {/* Sliders */}
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 18, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              How are your levels?
            </p>
            <SliderRow label="Stress Level" value={stress} onChange={setStress} getLabel={SCORE_LABEL} color="#f5c95f" />
            <SliderRow label="Sleep Quality" value={sleep} onChange={setSleep} getLabel={SLEEP_LABEL} color="#67d58c" />

            <div style={{ height: 1, background: "var(--border-soft)", marginBottom: 24 }} />

            {/* Notes */}
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Additional Notes{" "}
              <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
                (Optional)
              </span>
            </p>
            <textarea
              className="form-textarea"
              placeholder="How are you feeling today? What's on your mind?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ resize: "none", marginBottom: 22 }}
            />

            <button
              className="primary-btn"
              type="submit"
              disabled={submitting}
              style={{
                width: "auto", height: 42, padding: "0 24px", fontSize: 14, fontWeight: 600,
                borderRadius: 12,
              }}
            >
              {submitting ? "Saving..." : "Save Check-in"}
            </button>
          </form>
        </div>

        {/* Recent Check-ins */}
        <div className="dashboard-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Recent Check-ins</h3>
            {history.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                style={{ background: "transparent", border: "none", color: "var(--accent)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
              >
                View all
              </button>
            )}
          </div>

          {loadingHistory ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading...</p>
          ) : history.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 80 }}>No check-ins yet. Submit your first one!</div>
          ) : (
            <div className="list-stack">
              {recent.map((item) => <CheckinCard key={item.id} item={item} />)}
            </div>
          )}
        </div>
      </div>

      {/* All check-ins popup */}
      {showAll && (
        <div
          onClick={() => setShowAll(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
            zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-panel)", border: "1px solid var(--border-faint)",
              borderRadius: 20, padding: 28, width: "100%", maxWidth: 540,
              maxHeight: "80vh", display: "flex", flexDirection: "column",
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>All Check-in History</h3>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 20, cursor: "pointer", lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
              {history.map((item) => <CheckinCard key={item.id} item={item} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MoodCheckins;
