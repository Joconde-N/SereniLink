import React, { useState, useEffect } from "react";
import api from "../../api/axios";

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed — or being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself in some way",
];

const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it is hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid, as if something awful might happen",
];

const OPTIONS = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

const SEVERITY_COLOR = {
  Minimal: "#67d58c",
  Mild: "#a3d58c",
  Moderate: "#f5c95f",
  "Moderately Severe": "#f0a05f",
  Severe: "#f08f8f",
};

function Screenings() {
  const [activeTab, setActiveTab] = useState("PHQ9");
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const questions = activeTab === "PHQ9" ? PHQ9_QUESTIONS : GAD7_QUESTIONS;

  useEffect(() => {
    setAnswers(new Array(questions.length).fill(null));
    setSubmitted(false);
    setResult(null);
    setError("");
  }, [activeTab]);

  useEffect(() => {
    setLoadingHistory(true);
    api.get("/screenings/me")
      .then((res) => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [submitted]);

  const allAnswered = answers.length === questions.length && answers.every((a) => a !== null);

  const handleAnswer = (index, value) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/screenings/", { type: activeTab, answers });
      setResult(res.data);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers(new Array(questions.length).fill(null));
    setSubmitted(false);
    setResult(null);
  };

  const thisHistory = history.filter((h) => h.type === activeTab);

  return (
    <div>
      <h1 className="dashboard-page-title">Mental Health Screenings</h1>
      <p className="dashboard-page-subtitle">
        Standardized self-assessment tools. Results are private and for personal
        awareness only.
      </p>

      {/* Disclaimer */}
      <div
        style={{
          background: "rgba(245,201,95,0.08)",
          border: "1px solid rgba(245,201,95,0.2)",
          borderRadius: "12px",
          padding: "10px 16px",
          marginBottom: "24px",
          color: "#f5c95f",
          fontSize: "13px",
        }}
      >
        These screenings are not a diagnosis. If you are concerned about your
        results, please speak with a professional counselor.
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
        {["PHQ9", "GAD7"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            style={{
              padding: "8px 24px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              border: activeTab === t ? "none" : "1px solid var(--border-soft)",
              background: activeTab === t ? "var(--accent)" : "transparent",
              color: activeTab === t ? "#111" : "var(--text-soft)",
            }}
          >
            {t === "PHQ9" ? "PHQ-9 Depression" : "GAD-7 Anxiety"}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: "20px",
        }}
      >
        {/* Questionnaire / Result */}
        <div className="dashboard-card">
          {!submitted ? (
            <>
              <h3 style={{ marginBottom: "4px" }}>
                {activeTab === "PHQ9"
                  ? "PHQ-9 Depression Screening"
                  : "GAD-7 Anxiety Screening"}
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginBottom: "24px",
                }}
              >
                Over the last 2 weeks, how often have you been bothered by the
                following?
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                {questions.map((q, i) => (
                  <div key={i}>
                    <p
                      style={{
                        margin: "0 0 10px",
                        fontSize: "14px",
                        color: "var(--text-main)",
                        lineHeight: 1.6,
                      }}
                    >
                      <span
                        style={{
                          color: "var(--accent)",
                          fontWeight: 700,
                          marginRight: "8px",
                        }}
                      >
                        {i + 1}.
                      </span>
                      {q}
                    </p>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                    >
                      {OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleAnswer(i, opt.value)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "999px",
                            fontSize: "13px",
                            fontWeight: 500,
                            cursor: "pointer",
                            border:
                              answers[i] === opt.value
                                ? "1px solid var(--accent)"
                                : "1px solid var(--border-soft)",
                            background:
                              answers[i] === opt.value
                                ? "rgba(202,163,143,0.15)"
                                : "transparent",
                            color:
                              answers[i] === opt.value
                                ? "var(--accent)"
                                : "var(--text-soft)",
                            transition: "all 0.15s",
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <p
                  style={{
                    color: "#f08f8f",
                    fontSize: "13px",
                    marginTop: "16px",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                style={{
                  marginTop: "28px",
                  height: "44px",
                  padding: "0 32px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: allAnswered ? "pointer" : "not-allowed",
                  border: "none",
                  background: allAnswered
                    ? "var(--accent)"
                    : "rgba(255,255,255,0.06)",
                  color: allAnswered ? "#111" : "var(--text-muted)",
                  transition: "background 0.2s",
                }}
              >
                {submitting ? "Submitting..." : "Get My Results"}
              </button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  margin: "0 auto 20px",
                  background: `${SEVERITY_COLOR[result.severity]}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "32px",
                    fontWeight: 800,
                    color: SEVERITY_COLOR[result.severity],
                  }}
                >
                  {result.total_score}
                </span>
              </div>

              <h2
                style={{
                  margin: "0 0 8px",
                  color: SEVERITY_COLOR[result.severity],
                }}
              >
                {result.severity}
              </h2>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  marginBottom: "4px",
                }}
              >
                {activeTab === "PHQ9"
                  ? "PHQ-9 Depression Score"
                  : "GAD-7 Anxiety Score"}
              </p>
              <p
                style={{
                  color: "var(--text-soft)",
                  fontSize: "13px",
                  marginBottom: "28px",
                }}
              >
                Score: <strong>{result.total_score}</strong> /{" "}
                {activeTab === "PHQ9" ? "27" : "21"}
              </p>

              {/* Score scale */}
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "24px",
                  textAlign: "left",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginBottom: "10px",
                    fontWeight: 600,
                  }}
                >
                  SCORE GUIDE
                </p>
                {(activeTab === "PHQ9"
                  ? [
                      ["0–4", "Minimal", "#67d58c"],
                      ["5–9", "Mild", "#a3d58c"],
                      ["10–14", "Moderate", "#f5c95f"],
                      ["15–19", "Moderately Severe", "#f0a05f"],
                      ["20–27", "Severe", "#f08f8f"],
                    ]
                  : [
                      ["0–4", "Minimal", "#67d58c"],
                      ["5–9", "Mild", "#a3d58c"],
                      ["10–14", "Moderate", "#f5c95f"],
                      ["15–21", "Severe", "#f08f8f"],
                    ]
                ).map(([range, label, color]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background:
                        result.severity === label
                          ? "rgba(202,163,143,0.06)"
                          : "transparent",
                      borderRadius: "6px",
                      paddingLeft: result.severity === label ? "8px" : "0",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        color:
                          result.severity === label
                            ? color
                            : "var(--text-muted)",
                      }}
                    >
                      {result.severity === label ? "▶ " : ""}
                      {label}
                    </span>

                    <span style={{ fontSize: "13px", color }}>{range}</span>
                  </div>
                ))}
              </div>

              {result.severity !== "Minimal" && result.severity !== "Mild" && (
                <div
                  style={{
                    background: "rgba(240,143,143,0.08)",
                    border: "1px solid rgba(240,143,143,0.2)",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    marginBottom: "20px",
                    color: "#f08f8f",
                    fontSize: "13px",
                    textAlign: "left",
                  }}
                >
                  Your score suggests you may benefit from speaking with a
                  professional counselor. Consider booking a session through the
                  platform.
                </div>
              )}

              <button
                type="button"
                onClick={handleRetake}
                style={{
                  height: "40px",
                  padding: "0 24px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid var(--border-soft)",
                  background: "transparent",
                  color: "var(--text-soft)",
                }}
              >
                Retake Screening
              </button>
            </div>
          )}
        </div>

        {/* History sidebar */}
        <div className="dashboard-card">
          <h3 style={{ marginBottom: "4px" }}>Past Results</h3>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginBottom: "16px",
            }}
          >
            {activeTab === "PHQ9" ? "PHQ-9" : "GAD-7"} history
          </p>
          {loadingHistory ? (
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Loading...
            </p>
          ) : thisHistory.length === 0 ? (
            <div
              className="empty-state"
              style={{ minHeight: "80px", fontSize: "13px" }}
            >
              No past results yet.
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {thisHistory.map((h) => (
                <div
                  key={h.id}
                  className="simple-item"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        fontSize: "13px",
                        color: SEVERITY_COLOR[h.severity],
                      }}
                    >
                      {h.severity}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {new Date(h.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: SEVERITY_COLOR[h.severity],
                    }}
                  >
                    {h.total_score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Screenings;
