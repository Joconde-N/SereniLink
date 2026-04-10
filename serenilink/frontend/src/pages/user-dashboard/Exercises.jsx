import React, { useState, useEffect, useRef } from "react";
import { GiMeditation } from "react-icons/gi";
import { MdAir, MdOutlineSelfImprovement } from "react-icons/md";
import { RiMentalHealthLine, RiQuillPenLine, RiAppsLine } from "react-icons/ri";
import { LuClock3 } from "react-icons/lu";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { IoMdClose } from "react-icons/io";
import api from "../../api/axios";

const TYPE_META = {
  BREATHING:     { bg: "rgba(103,213,140,0.08)", border: "rgba(103,213,140,0.22)", text: "#67d58c",  label: "Breathing",     Icon: MdAir },
  GROUNDING:     { bg: "rgba(202,163,143,0.08)", border: "rgba(202,163,143,0.22)", text: "#E19A86",  label: "Grounding",     Icon: GiMeditation },
  JOURNAL:       { bg: "rgba(147,112,219,0.08)", border: "rgba(147,112,219,0.22)", text: "#b39ddb",  label: "Journal",       Icon: RiQuillPenLine },
  REFLECTION:    { bg: "rgba(126,184,247,0.08)", border: "rgba(126,184,247,0.22)", text: "#7eb8f7",  label: "Reflection",    Icon: RiMentalHealthLine },
  VISUALIZATION: { bg: "rgba(245,201,95,0.08)",  border: "rgba(245,201,95,0.22)",  text: "#f5c95f",  label: "Visualization", Icon: MdOutlineSelfImprovement },
};

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtDuration(sec) {
  const m = Math.floor(sec / 60);
  return m < 1 ? `${sec}s` : `${m} min`;
}

function ExerciseModal({ ex, onClose, onMarkDone, isDone }) {
  const meta = TYPE_META[ex.type] ?? TYPE_META.GROUNDING;
  const { Icon } = meta;
  const [timeLeft, setTimeLeft] = useState(ex.durationSec);
  const [running, setRunning]   = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setFinished(true);
            onMarkDone(ex.id, true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const progress      = ((ex.durationSec - timeLeft) / ex.durationSec) * 100;
  const circumference = 2 * Math.PI * 44;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <div style={{ background: "linear-gradient(160deg, #1e1e22 0%, #18181b 100%)", border: `1px solid ${meta.border}`, borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "520px", boxShadow: "0 24px 80px rgba(0,0,0,0.5)", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${meta.text}88, transparent)`, borderRadius: "24px 24px 0 0" }} />

        <button type="button" onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#b8bfcc" }}>
          <IoMdClose size={16} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "13px", background: meta.bg, border: `1px solid ${meta.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={22} color={meta.text} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#f4f4f4" }}>{ex.title}</h2>
            <span style={{ fontSize: "12px", color: meta.text, fontWeight: 600 }}>{meta.label}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "8px 0 24px" }}>
          <div style={{ position: "relative", width: "110px", height: "110px" }}>
            <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="55" cy="55" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="55" cy="55" r="44" fill="none" stroke={finished ? "#67d58c" : meta.text} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={circumference - (circumference * progress) / 100} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.4s ease" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: "26px", fontWeight: 700, color: finished ? "#67d58c" : "#f4f4f4", fontVariantNumeric: "tabular-nums" }}>{finished ? "✓" : fmtTime(timeLeft)}</div>
              <div style={{ fontSize: "11px", color: "#b0b0b0", marginTop: "2px" }}>{finished ? "Complete" : `of ${fmtDuration(ex.durationSec)}`}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
            {!finished && (
              <button type="button" onClick={() => setRunning(r => !r)} style={{ height: "34px", padding: "0 20px", borderRadius: "9px", border: "none", background: running ? "rgba(202,163,143,0.18)" : "#a86955", color: running ? "#E19A86" : "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                {running ? "Pause" : timeLeft < ex.durationSec ? "Resume" : "Start Timer"}
              </button>
            )}
            <button type="button" onClick={() => { setTimeLeft(ex.durationSec); setRunning(false); setFinished(false); }} style={{ height: "34px", padding: "0 16px", borderRadius: "9px", border: "1px solid rgba(176,176,176,0.15)", background: "transparent", color: "#b8bfcc", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              Reset
            </button>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "18px", color: "#c8cdd6", fontSize: "14px", lineHeight: 1.85, whiteSpace: "pre-wrap", marginBottom: "20px" }}>
          {ex.instructions}
        </div>

        <button type="button" onClick={() => { onMarkDone(ex.id); onClose(); }} style={{ width: "100%", height: "40px", borderRadius: "10px", border: `1px solid ${isDone ? "rgba(103,213,140,0.4)" : "rgba(176,176,176,0.15)"}`, background: isDone ? "rgba(103,213,140,0.1)" : "transparent", color: isDone ? "#67d58c" : "#b8bfcc", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
          <IoCheckmarkCircleOutline size={16} />
          {isDone ? "Marked as Done — Undo" : "Mark as Done"}
        </button>
      </div>
    </div>
  );
}

function ExerciseCard({ ex, isDone, onToggleDone, onOpen }) {
  const meta = TYPE_META[ex.type] ?? TYPE_META.GROUNDING;
  const { Icon } = meta;

  return (
    <div
      style={{ background: "linear-gradient(160deg, #1c1c1f 0%, #171719 100%)", border: "1px solid rgba(176,176,176,0.09)", borderRadius: "20px", padding: "20px", boxShadow: "0 6px 28px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column", transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease", opacity: isDone ? 0.65 : 1, position: "relative", overflow: "hidden" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 14px 40px rgba(0,0,0,0.32)"; e.currentTarget.style.borderColor = meta.border; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,0,0,0.22)"; e.currentTarget.style.borderColor = "rgba(176,176,176,0.09)"; }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${meta.text}55, transparent)`, borderRadius: "20px 20px 0 0" }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f4f4f4", lineHeight: 1.3 }}>{ex.title}</h3>
        <Icon size={16} color={meta.text} style={{ flexShrink: 0, marginTop: "2px" }} />
      </div>

      <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#b8bfcc", lineHeight: 1.6 }}>{ex.desc}</p>

      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "16px" }}>
        <LuClock3 size={13} color="#b0b0b0" />
        <span style={{ fontSize: "12px", color: "#b0b0b0" }}>{fmtDuration(ex.durationSec)}</span>
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
        <button type="button" onClick={() => onOpen(ex)} style={{ flex: 1, height: "34px", borderRadius: "9px", border: "none", background: "#a86955", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#c07a62"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#a86955"; }}
        >
          Start Exercise
        </button>
        <button type="button" onClick={() => onToggleDone(ex.id)} style={{ flex: 1, height: "34px", borderRadius: "9px", border: `1px solid ${isDone ? "rgba(103,213,140,0.35)" : "rgba(176,176,176,0.12)"}`, background: isDone ? "rgba(103,213,140,0.08)" : "transparent", color: isDone ? "#67d58c" : "#b8bfcc", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          {isDone ? "Undo" : "Mark Done"}
        </button>
      </div>
    </div>
  );
}

function Exercises() {
  const [exercises, setExercises]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeType, setActiveType] = useState("ALL");
  const [activeEx, setActiveEx]     = useState(null);
  const [done, setDone]             = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/exercises/", { params: { limit: 100 } }),
      api.get("/exercises/completed/today"),
    ])
      .then(([exRes, doneRes]) => {
        setExercises(exRes.data);
        setDone(doneRes.data.completed_ids);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleDone = (id, forceAdd = false) => {
    const alreadyDone = done.includes(id);
    if (forceAdd && alreadyDone) return;
    api.post(`/exercises/${id}/complete`)
      .then((r) => {
        setDone((prev) =>
          r.data.completed ? [...prev, id] : prev.filter((x) => x !== id)
        );
      })
      .catch(() => {});
  };

  const types    = ["ALL", ...Object.keys(TYPE_META).filter(t => exercises.some(e => e.type === t))];
  const filtered = activeType === "ALL" ? exercises : exercises.filter(e => e.type === activeType);
  const doneCount = done.filter(id => exercises.find(e => e.id === id)).length;

  const toEx = (e) => ({ ...e, durationSec: e.duration_sec ?? 300, desc: e.description ?? "" });

  return (
    <div>
      <h1 className="dashboard-page-title">Exercises</h1>
      <p className="dashboard-page-subtitle">
        Practice simple coping exercises anytime you need support.
        {doneCount > 0 && (
          <span style={{ marginLeft: "12px", color: "#67d58c", fontSize: "14px" }}>
            <IoCheckmarkCircleOutline size={13} style={{ verticalAlign: "middle", marginRight: "3px" }} />
            {doneCount} completed
          </span>
        )}
      </p>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
        {types.map(t => {
          const meta   = TYPE_META[t];
          const active = activeType === t;
          const TabIcon = t === "ALL" ? RiAppsLine : meta?.Icon ?? RiAppsLine;
          return (
            <button key={t} type="button" onClick={() => setActiveType(t)} style={{ padding: "6px 14px", borderRadius: "999px", cursor: "pointer", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", border: `1px solid ${active ? (meta?.border || "rgba(202,163,143,0.4)") : "rgba(176,176,176,0.1)"}`, background: active ? (meta?.bg || "rgba(202,163,143,0.1)") : "transparent", color: active ? (meta?.text || "#E19A86") : "#b8bfcc" }}>
              <TabIcon size={14} />
              {t === "ALL" ? "All" : (meta?.label ?? t)}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: 40 }}>Loading exercises...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "18px" }}>
          {filtered.map(ex => (
            <ExerciseCard key={ex.id} ex={toEx(ex)} isDone={done.includes(ex.id)} onToggleDone={toggleDone} onOpen={(e) => setActiveEx(e)} />
          ))}
        </div>
      )}

      {activeEx && (
        <ExerciseModal ex={activeEx} isDone={done.includes(activeEx.id)} onMarkDone={toggleDone} onClose={() => setActiveEx(null)} />
      )}
    </div>
  );
}

export default Exercises;
