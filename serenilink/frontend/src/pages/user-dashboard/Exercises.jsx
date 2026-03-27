import React, { useState, useEffect, useRef } from "react";
import {
  GiMeditation,       // GROUNDING
} from "react-icons/gi";
import {
  MdAir,              // BREATHING
  MdOutlineSelfImprovement, // VISUALIZATION
} from "react-icons/md";
import {
  RiMentalHealthLine, // REFLECTION
  RiQuillPenLine,     // JOURNAL
  RiAppsLine,         // ALL
} from "react-icons/ri";
import { LuClock3 } from "react-icons/lu";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { IoMdClose } from "react-icons/io";

/* ─── Type metadata ─────────────────────────────────────── */
const TYPE_META = {
  BREATHING:     { bg: "rgba(103,213,140,0.08)", border: "rgba(103,213,140,0.22)", text: "#67d58c",  label: "Breathing",     Icon: MdAir },
  GROUNDING:     { bg: "rgba(202,163,143,0.08)", border: "rgba(202,163,143,0.22)", text: "#E19A86",  label: "Grounding",     Icon: GiMeditation },
  JOURNAL:       { bg: "rgba(147,112,219,0.08)", border: "rgba(147,112,219,0.22)", text: "#b39ddb",  label: "Journal",       Icon: RiQuillPenLine },
  REFLECTION:    { bg: "rgba(126,184,247,0.08)", border: "rgba(126,184,247,0.22)", text: "#7eb8f7",  label: "Reflection",    Icon: RiMentalHealthLine },
  VISUALIZATION: { bg: "rgba(245,201,95,0.08)",  border: "rgba(245,201,95,0.22)",  text: "#f5c95f",  label: "Visualization", Icon: MdOutlineSelfImprovement },
};

const TYPES = ["ALL", "BREATHING", "GROUNDING", "REFLECTION", "JOURNAL", "VISUALIZATION"];

/* ─── Exercise data ─────────────────────────────────────── */
const EXERCISES = [
  { id: 1,  type: "GROUNDING",     durationSec: 300,  title: "5-4-3-2-1 Grounding",        desc: "Anchor yourself to the present by engaging all five senses one by one.",           instructions: `Name 5 things you can see.\nName 4 things you can touch — and feel them.\nName 3 things you can hear right now.\nName 2 things you can smell.\nName 1 thing you can taste.\n\nBreathe slowly between each step. Let each sense pull you gently back to the present moment.` },
  { id: 2,  type: "BREATHING",     durationSec: 180,  title: "Breathing Bubble",            desc: "Follow a gentle expanding and contracting bubble to regulate your breath.",          instructions: `Imagine a soft bubble in front of you.\n\nInhale for 4 counts as the bubble expands.\nHold for 2 counts at its fullest.\nExhale for 4 counts as it gently shrinks.\n\nRepeat 6–8 times. Let your shoulders drop with each exhale.` },
  { id: 3,  type: "GROUNDING",     durationSec: 480,  title: "Body Scan Awareness",         desc: "Slowly move your attention through your body to release tension and reconnect.",     instructions: `Close your eyes and take three deep breaths.\n\nStart at the top of your head. Notice any tension.\nSlowly move down — forehead, jaw, neck, shoulders, chest, belly, arms, hands, hips, legs, feet.\n\nAt each area, breathe in and consciously release any tightness on the exhale. No judgment — just notice.` },
  { id: 4,  type: "GROUNDING",     durationSec: 120,  title: "Cold Water Reset",            desc: "Use the sensation of cold water to interrupt stress and reset your nervous system.",  instructions: `Run cold water over your wrists and hands for 30 seconds.\n\nAlternatively, splash cold water on your face.\n\nFocus entirely on the sensation — the temperature, the sound, the feeling on your skin.\n\nThis activates your body's dive reflex, slowing your heart rate and calming your nervous system quickly.` },
  { id: 5,  type: "GROUNDING",     durationSec: 60,   title: "Name 3 Things",               desc: "A quick grounding reset — name three things around you to return to the now.",       instructions: `Look around you and name:\n\n3 things you can see.\n3 things you can physically feel right now.\n3 sounds you can hear.\n\nSay them out loud if you can. This simple act interrupts anxious thought loops and brings you back to the present.` },
  { id: 6,  type: "BREATHING",     durationSec: 240,  title: "Box Breathing",               desc: "A structured 4-count breathing pattern used to calm the mind and body.",             instructions: `Inhale slowly for 4 counts.\nHold your breath for 4 counts.\nExhale slowly for 4 counts.\nHold empty for 4 counts.\n\nRepeat 4–6 cycles. This technique is used by athletes and first responders to quickly restore calm under pressure.` },
  { id: 7,  type: "BREATHING",     durationSec: 300,  title: "4-7-8 Breathing",             desc: "A calming breath pattern that promotes relaxation and helps with sleep.",             instructions: `Place the tip of your tongue behind your upper front teeth.\n\nExhale completely through your mouth.\nInhale quietly through your nose for 4 counts.\nHold your breath for 7 counts.\nExhale completely through your mouth for 8 counts.\n\nRepeat 4 cycles. This pattern activates the parasympathetic nervous system.` },
  { id: 8,  type: "REFLECTION",    durationSec: 360,  title: "Thought Reframing",           desc: "Challenge unhelpful thoughts and gently shift your perspective.",                    instructions: `Write down a thought that's been bothering you.\n\nAsk yourself:\n• Is this thought 100% true?\n• What evidence supports or contradicts it?\n• What would I tell a friend who had this thought?\n• What's a more balanced way to see this?\n\nReplace the original thought with your reframed version and read it aloud.` },
  { id: 9,  type: "JOURNAL",       durationSec: 300,  title: "Gratitude Journaling",        desc: "Shift your focus toward what's good by writing down things you're grateful for.",    instructions: `Open a notebook or notes app.\n\nWrite down 3 things you're genuinely grateful for today — big or small.\n\nFor each one, write one sentence about why it matters to you.\n\nEnd by reading them back slowly. Let the feeling of appreciation settle in your chest.` },
  { id: 10, type: "REFLECTION",    durationSec: 180,  title: "Mood Labeling",               desc: "Name what you're feeling to reduce its intensity and gain emotional clarity.",        instructions: `Pause and check in with yourself.\n\nAsk: "What am I feeling right now?" Try to be specific — not just "bad" but perhaps "frustrated," "lonely," "overwhelmed," or "anxious."\n\nSay or write: "I notice I'm feeling _____." \n\nResearch shows that simply naming an emotion reduces its power over you. You don't need to fix it — just acknowledge it.` },
  { id: 11, type: "REFLECTION",    durationSec: 180,  title: "Positive Affirmations",       desc: "Reinforce self-worth and resilience with intentional, compassionate statements.",     instructions: `Stand or sit comfortably. Take a slow breath.\n\nRepeat each of these slowly, with intention:\n• "I am doing the best I can."\n• "I am worthy of care and kindness."\n• "This feeling is temporary."\n• "I have gotten through hard things before."\n• "I am enough, exactly as I am."\n\nChoose one that resonates and carry it with you today.` },
  { id: 12, type: "VISUALIZATION", durationSec: 420,  title: "Safe Space Visualization",    desc: "Mentally travel to a calm, safe place to find comfort and relief.",                  instructions: `Close your eyes and take three slow breaths.\n\nImagine a place where you feel completely safe and at peace — real or imagined. A beach, a forest, a cozy room.\n\nNotice the details: What do you see? What sounds are there? What does the air feel like?\n\nSpend a few minutes simply being in this space. When you're ready, slowly return, carrying that sense of calm with you.` },
  { id: 13, type: "JOURNAL",       durationSec: 600,  title: "Release Writing",             desc: "Write freely to release pent-up emotions without judgment or editing.",              instructions: `Set a timer for 10 minutes.\n\nWrite continuously about whatever is on your mind — worries, frustrations, fears, or anything weighing on you. Don't edit, don't judge, just let it flow.\n\nWhen the timer ends, you can choose to keep, shred, or delete what you wrote.\n\nThe act of externalizing thoughts reduces their emotional charge.` },
  { id: 14, type: "GROUNDING",     durationSec: 360,  title: "Stretch and Relax",           desc: "Release physical tension stored in the body through gentle, mindful movement.",      instructions: `Move slowly and gently through these stretches:\n\n• Neck rolls — 3 each direction\n• Shoulder shrugs — raise to ears, hold 3 sec, release\n• Chest opener — clasp hands behind back, open chest\n• Forward fold — hang head and arms toward the floor\n• Child's pose — kneel and stretch arms forward\n\nBreathe deeply into each stretch. Notice where you hold tension.` },
  { id: 15, type: "BREATHING",     durationSec: 60,   title: "Mindful Minute",              desc: "One focused minute of present-moment awareness to reset and recharge.",              instructions: `Close your eyes or soften your gaze.\n\nFocus only on your breath — the rise and fall of your chest, the air entering and leaving your nose.\n\nWhen your mind wanders (it will), gently bring it back without judgment.\n\nOne minute of this practice can meaningfully reduce stress and improve focus.` },
];

/* ─── Helpers ───────────────────────────────────────────── */
function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtDuration(sec) {
  const m = Math.floor(sec / 60);
  return m < 1 ? `${sec}s` : `${m} min`;
}

/* ─── Modal with countdown ──────────────────────────────── */
function ExerciseModal({ ex, onClose, onMarkDone, isDone }) {
  const meta = TYPE_META[ex.type];
  const { Icon } = meta;
  const [timeLeft, setTimeLeft] = useState(ex.durationSec);
  const [running, setRunning] = useState(false);
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
            onMarkDone(ex.id, true); // auto-mark done
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // close on backdrop click
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  const progress = ((ex.durationSec - timeLeft) / ex.durationSec) * 100;
  const circumference = 2 * Math.PI * 44; // r=44

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
    >
      <div style={{
        background: "linear-gradient(160deg, #1e1e22 0%, #18181b 100%)",
        border: `1px solid ${meta.border}`,
        borderRadius: "24px", padding: "32px",
        width: "100%", maxWidth: "520px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        position: "relative", maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Top strip */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "3px",
          background: `linear-gradient(90deg, ${meta.text}88, transparent)`,
          borderRadius: "24px 24px 0 0",
        }} />

        {/* Close */}
        <button
          type="button" onClick={onClose}
          style={{
            position: "absolute", top: "16px", right: "16px",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px", width: "32px", height: "32px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#b8bfcc",
          }}
        >
          <IoMdClose size={16} />
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <div style={{
            width: "46px", height: "46px", borderRadius: "13px",
            background: meta.bg, border: `1px solid ${meta.border}`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon size={22} color={meta.text} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#f4f4f4" }}>{ex.title}</h2>
              <Icon size={15} color={meta.text} style={{ opacity: 0.7 }} />
            </div>
            <span style={{ fontSize: "12px", color: meta.text, fontWeight: 600 }}>{meta.label}</span>
          </div>
        </div>

        {/* Countdown ring */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "8px 0 24px" }}>
          <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="55" cy="55" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle
              cx="55" cy="55" r="44" fill="none"
              stroke={finished ? "#67d58c" : meta.text}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * progress) / 100}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.4s ease" }}
            />
          </svg>
          <div style={{ marginTop: "-74px", textAlign: "center", zIndex: 1 }}>
            <div style={{ fontSize: "26px", fontWeight: 700, color: finished ? "#67d58c" : "#f4f4f4", fontVariantNumeric: "tabular-nums" }}>
              {finished ? "✓" : fmtTime(timeLeft)}
            </div>
            <div style={{ fontSize: "11px", color: "#b0b0b0", marginTop: "2px" }}>
              {finished ? "Complete" : `of ${fmtDuration(ex.durationSec)}`}
            </div>
          </div>

          {/* Timer controls */}
          <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
            {!finished && (
              <button
                type="button"
                onClick={() => setRunning(r => !r)}
                style={{
                  height: "34px", padding: "0 20px", borderRadius: "9px", border: "none",
                  background: running ? "rgba(202,163,143,0.18)" : "#a86955",
                  color: running ? "#E19A86" : "#fff",
                  fontSize: "13px", fontWeight: 600, cursor: "pointer",
                }}
              >
                {running ? "Pause" : timeLeft < ex.durationSec ? "Resume" : "Start Timer"}
              </button>
            )}
            <button
              type="button"
              onClick={() => { setTimeLeft(ex.durationSec); setRunning(false); setFinished(false); }}
              style={{
                height: "34px", padding: "0 16px", borderRadius: "9px",
                border: "1px solid rgba(176,176,176,0.15)", background: "transparent",
                color: "#b8bfcc", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "14px", padding: "18px",
          color: "#c8cdd6", fontSize: "14px", lineHeight: 1.85,
          whiteSpace: "pre-wrap", marginBottom: "20px",
        }}>
          {ex.instructions}
        </div>

        {/* Mark done */}
        <button
          type="button"
          onClick={() => { onMarkDone(ex.id); onClose(); }}
          style={{
            width: "100%", height: "40px", borderRadius: "10px",
            border: `1px solid ${isDone ? "rgba(103,213,140,0.4)" : "rgba(176,176,176,0.15)"}`,
            background: isDone ? "rgba(103,213,140,0.1)" : "transparent",
            color: isDone ? "#67d58c" : "#b8bfcc",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
          }}
        >
          <IoCheckmarkCircleOutline size={16} />
          {isDone ? "Marked as Done — Undo" : "Mark as Done"}
        </button>
      </div>
    </div>
  );
}

/* ─── Exercise Card ─────────────────────────────────────── */
function ExerciseCard({ ex, isDone, onToggleDone, onOpen }) {
  const meta = TYPE_META[ex.type];
  const { Icon } = meta;

  return (
    <div
      style={{
        background: "linear-gradient(160deg, #1c1c1f 0%, #171719 100%)",
        border: "1px solid rgba(176,176,176,0.09)",
        borderRadius: "20px", padding: "20px",
        boxShadow: "0 6px 28px rgba(0,0,0,0.22)",
        display: "flex", flexDirection: "column",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        opacity: isDone ? 0.65 : 1,
        position: "relative", overflow: "hidden",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 14px 40px rgba(0,0,0,0.32)";
        e.currentTarget.style.borderColor = meta.border;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,0,0,0.22)";
        e.currentTarget.style.borderColor = "rgba(176,176,176,0.09)";
      }}
    >
      {/* Top accent strip */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "3px",
        background: `linear-gradient(90deg, ${meta.text}55, transparent)`,
        borderRadius: "20px 20px 0 0",
      }} />

      {/* Title + type icon */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f4f4f4", lineHeight: 1.3 }}>
          {ex.title}
        </h3>
        <Icon size={16} color={meta.text} style={{ flexShrink: 0, marginTop: "2px" }} />
      </div>

      {/* Description */}
      <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#b8bfcc", lineHeight: 1.6 }}>
        {ex.desc}
      </p>

      {/* Duration */}
      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "16px" }}>
        <LuClock3 size={13} color="#b0b0b0" />
        <span style={{ fontSize: "12px", color: "#b0b0b0" }}>{fmtDuration(ex.durationSec)}</span>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
        <button
          type="button"
          onClick={() => onOpen(ex)}
          style={{
            flex: 1, height: "34px", borderRadius: "9px", border: "none",
            background: "#a86955", color: "#fff",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#c07a62"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#a86955"; }}
        >
          Start Exercise
        </button>
        <button
          type="button"
          onClick={() => onToggleDone(ex.id)}
          style={{
            flex: 1, height: "34px", borderRadius: "9px",
            border: `1px solid ${isDone ? "rgba(103,213,140,0.35)" : "rgba(176,176,176,0.12)"}`,
            background: isDone ? "rgba(103,213,140,0.08)" : "transparent",
            color: isDone ? "#67d58c" : "#b8bfcc",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = isDone ? "rgba(103,213,140,0.15)" : "rgba(255,255,255,0.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = isDone ? "rgba(103,213,140,0.08)" : "transparent"; }}
        >
          {isDone ? "Undo" : "Mark Done"}
        </button>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
function Exercises() {
  const [activeType, setActiveType] = useState("ALL");
  const [activeEx, setActiveEx] = useState(null);
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem("exercises_done") || "[]"); } catch { return []; }
  });

  const toggleDone = (id, forceAdd = false) => {
    const updated = forceAdd
      ? done.includes(id) ? done : [...done, id]
      : done.includes(id) ? done.filter(x => x !== id) : [...done, id];
    setDone(updated);
    localStorage.setItem("exercises_done", JSON.stringify(updated));
  };

  const filtered = activeType === "ALL" ? EXERCISES : EXERCISES.filter(e => e.type === activeType);
  const doneCount = done.filter(id => EXERCISES.find(e => e.id === id)).length;

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

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
        {TYPES.map(t => {
          const meta = TYPE_META[t];
          const active = activeType === t;
          const TabIcon = t === "ALL" ? RiAppsLine : meta.Icon;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setActiveType(t)}
              style={{
                padding: "6px 14px", borderRadius: "999px", cursor: "pointer",
                fontSize: "13px", fontWeight: 600, transition: "all 0.2s ease",
                display: "flex", alignItems: "center", gap: "6px",
                border: `1px solid ${active ? (meta?.border || "rgba(202,163,143,0.4)") : "rgba(176,176,176,0.1)"}`,
                background: active ? (meta?.bg || "rgba(202,163,143,0.1)") : "transparent",
                color: active ? (meta?.text || "#E19A86") : "#b8bfcc",
              }}
            >
              <TabIcon size={14} />
              {t === "ALL" ? "All" : meta.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
        gap: "18px",
      }}>
        {filtered.map(ex => (
          <ExerciseCard
            key={ex.id}
            ex={ex}
            isDone={done.includes(ex.id)}
            onToggleDone={toggleDone}
            onOpen={setActiveEx}
          />
        ))}
      </div>

      {/* Modal */}
      {activeEx && (
        <ExerciseModal
          ex={activeEx}
          isDone={done.includes(activeEx.id)}
          onMarkDone={toggleDone}
          onClose={() => setActiveEx(null)}
        />
      )}
    </div>
  );
}

export default Exercises;
