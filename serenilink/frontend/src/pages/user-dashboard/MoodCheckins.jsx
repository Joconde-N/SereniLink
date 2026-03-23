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

function MoodCheckins() {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Assessment form
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
      await api.post("/assessments/", { mood: parseInt(mood) || 5, stress: parseInt(stress), sleep: parseInt(sleep), notes: notes || undefined });
      // also log mood entry
      await api.post("/moods/", { mood, note: notes || undefined });
      setSuccess("Check-in saved!");
      setNotes("");
      setMood("OKAY"); setStress(5); setSleep(5);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save check-in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="dashboard-page-title">Mood Check-ins</h1>
      <p className="dashboard-page-subtitle">Track how you feel over time.</p>

      <div className="dashboard-grid dashboard-cards-2">
        {/* Form */}
        <div className="dashboard-card">
          <h3>New Check-In</h3>
          {error && <p style={{ color: "#f08f8f", marginBottom: "12px", fontSize: "14px" }}>{error}</p>}
          {success && <p style={{ color: "#67d58c", marginBottom: "12px", fontSize: "14px" }}>{success}</p>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label className="form-label">How are you feeling?</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {MOODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "999px",
                      border: `1px solid ${mood === m ? "var(--accent)" : "var(--border-soft)"}`,
                      background: mood === m ? "rgba(202,163,143,0.15)" : "transparent",
                      color: mood === m ? "var(--accent)" : "var(--text-soft)",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    {MOOD_EMOJI[m]} {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-grid-2" style={{ marginBottom: "16px" }}>
              <div>
                <label className="form-label">Stress Level: <strong style={{ color: "var(--accent)" }}>{stress}/10</strong></label>
                <input type="range" min="1" max="10" value={stress} onChange={(e) => setStress(e.target.value)}
                  style={{ width: "100%", accentColor: "var(--accent)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)" }}>
                  <span>Low</span><span>High</span>
                </div>
              </div>

              <div>
                <label className="form-label">Sleep Quality: <strong style={{ color: "var(--accent)" }}>{sleep}/10</strong></label>
                <input type="range" min="1" max="10" value={sleep} onChange={(e) => setSleep(e.target.value)}
                  style={{ width: "100%", accentColor: "var(--accent)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)" }}>
                  <span>Poor</span><span>Great</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label className="form-label">Notes (optional)</label>
              <textarea
                className="form-textarea"
                placeholder="How are you feeling today? What's on your mind?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            <button className="primary-btn" type="submit" disabled={submitting} style={{ width: "100%" }}>
              {submitting ? "Saving..." : "Save Check-In"}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="dashboard-card">
          <h3>Check-In History</h3>
          {loadingHistory ? (
            <div style={{ color: "var(--text-muted)", padding: "20px" }}>Loading...</div>
          ) : history.length === 0 ? (
            <div className="empty-state">No check-ins yet. Submit your first one!</div>
          ) : (
            <div className="list-stack" style={{ maxHeight: "480px", overflowY: "auto" }}>
              {history.map((item) => (
                <div key={item.id} className="simple-item">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>Mood: {item.mood}/10</span>
                    <span className="small-muted">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
                    <span className="small-muted">Stress: <span style={{ color: "#f5c95f" }}>{item.stress}/10</span></span>
                    <span className="small-muted">Sleep: <span style={{ color: "#67d58c" }}>{item.sleep}/10</span></span>
                  </div>
                  {item.notes && <p className="small-muted" style={{ marginTop: "6px", fontStyle: "italic" }}>{item.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MoodCheckins;
