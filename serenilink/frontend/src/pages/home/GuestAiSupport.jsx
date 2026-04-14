import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LuBot, LuSendHorizontal, LuMinimize2 } from "react-icons/lu";
import api from "../../api/axios";

const RISK_COLOR = { MODERATE: "#f5c95f", HIGH: "#f08f8f" };
const MAX = 5;

function getGuestId() {
  let id = sessionStorage.getItem("guest_ai_id");
  if (!id) {
    id = "guest_" + Math.random().toString(36).slice(2, 10) + Date.now();
    sessionStorage.setItem("guest_ai_id", id);
  }
  return id;
}

function GuestAiSupport() {
  const location = useLocation();
  const seed = location.state || {};
  const [messages, setMessages] = useState(seed.messages || []);
  const [messagesLeft, setMessagesLeft] = useState(seed.messagesLeft ?? MAX);
  const [limitReached, setLimitReached] = useState(seed.limitReached || false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const guestId = useRef(getGuestId());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg || sending || limitReached) return;
    setText("");
    setSending(true);
    setError("");
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: msg, created_at: new Date().toISOString() }]);
    try {
      const res = await api.post("/ai/guest-chat", { guest_id: guestId.current, message: msg });
      setMessagesLeft(res.data.messages_left);
      if (res.data.messages_left <= 0) setLimitReached(true);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1, role: "assistant",
        content: res.data.reply, risk_level: res.data.risk_level,
        created_at: new Date().toISOString(),
      }]);
    } catch (err) {
      if (err.response?.status === 403) { setLimitReached(true); setMessagesLeft(0); }
      else setError(err.response?.data?.detail || "Failed to send message.");
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#070808", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 32px", flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <Link to="/" style={{ color: "#f4f4f4", fontSize: "20px", fontWeight: 700, textDecoration: "none" }}>
          SereniLink
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link to="/register" style={{ height: "34px", padding: "0 16px", borderRadius: "9px", background: "#a86955", color: "#fff", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            Sign Up Free
          </Link>
          <Link to="/login" style={{ height: "34px", padding: "0 16px", borderRadius: "9px", border: "1px solid rgba(176,176,176,0.15)", background: "transparent", color: "#b8bfcc", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            Log In
          </Link>
        </div>
      </div>

      {/* Crisis banner */}
      <div style={{
        background: "rgba(220,80,80,0.08)", borderBottom: "1px solid rgba(220,80,80,0.12)",
        padding: "9px 32px", color: "#f08f8f", fontSize: "13px",
        textAlign: "center", flexShrink: 0,
      }}>
        <strong>Crisis or emergency?</strong> Call <strong>112</strong> or <strong>114</strong> immediately.
      </div>

      {/* Chat panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: "760px", width: "100%", margin: "0 auto", padding: "0 20px 24px" }}>

        {/* Chat card */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", marginTop: "24px",
          background: "linear-gradient(180deg, #1a1a1d 0%, #171719 100%)",
          border: "1px solid rgba(176,176,176,0.08)", borderRadius: "20px", overflow: "hidden",
          boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
        }}>

          {/* Chat header */}
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "rgba(202,163,143,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <LuBot size={18} color="#E19A86" />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#f4f4f4" }}>SereniLink AI</p>
                <p style={{ margin: 0, fontSize: "11px", color: messagesLeft > 1 ? "#67d58c" : "#f5c95f" }}>
                  {messagesLeft} free message{messagesLeft !== 1 ? "s" : ""} left ·{" "}
                  <Link to="/register" style={{ color: "#E19A86", textDecoration: "none" }}>Sign up for unlimited</Link>
                </p>
              </div>
            </div>
            <Link
              to="/"
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                color: "#b0b0b0", fontSize: "13px", textDecoration: "none",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "9px", padding: "7px 12px",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#E19A86"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#b0b0b0"}
            >
              <LuMinimize2 size={13} /> Minimize
            </Link>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px",
            scrollbarWidth: "thin", scrollbarColor: "rgba(202,163,143,0.2) transparent",
          }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px", padding: "60px 20px", textAlign: "center" }}>
                <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(202,163,143,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LuBot size={28} color="#E19A86" />
                </div>
                <p style={{ margin: 0, color: "#b0b0b0", fontSize: "14px", lineHeight: 1.8, maxWidth: "320px" }}>
                  Hi there! I'm SereniLink AI.<br />I'm here to listen and support you.<br />What's on your mind today?
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", maxWidth: "400px" }}>
                  {["I'm feeling anxious", "I need someone to talk to", "What can you help with?"].map((prompt) => (
                    <button
                      key={prompt} type="button"
                      onClick={() => { setText(prompt); inputRef.current?.focus(); }}
                      style={{
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "999px", color: "#b8bfcc", fontSize: "13px", padding: "8px 16px",
                        cursor: "pointer", transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(202,163,143,0.08)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} style={{
                display: "flex", gap: "10px",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                alignItems: "flex-end",
              }}>
                {msg.role === "assistant" && (
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0, background: "rgba(202,163,143,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <LuBot size={14} color="#E19A86" />
                  </div>
                )}
                <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", gap: "4px", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    padding: "12px 16px", fontSize: "14px", lineHeight: 1.65,
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: msg.role === "user" ? "#a86955" : "rgba(255,255,255,0.06)",
                    color: msg.role === "user" ? "#fff" : "#e0e0e0",
                  }}>
                    {msg.content}
                    {msg.risk_level && RISK_COLOR[msg.risk_level] && (
                      <div style={{ marginTop: "5px", fontSize: "11px", color: RISK_COLOR[msg.risk_level] }}>
                        ⚠ {msg.risk_level} — consider reaching out to a professional.
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}

            {sending && (
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0, background: "rgba(202,163,143,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LuBot size={14} color="#E19A86" />
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "rgba(255,255,255,0.06)", color: "#b0b0b0", fontSize: "14px" }}>
                  Typing...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
            {limitReached ? (
              <div style={{ background: "rgba(202,163,143,0.08)", border: "1px solid rgba(202,163,143,0.18)", borderRadius: "14px", padding: "16px", textAlign: "center" }}>
                <p style={{ margin: "0 0 12px", color: "#f4f4f4", fontSize: "14px" }}>You've used all {MAX} free messages.</p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                  <Link to="/register" style={{ height: "38px", padding: "0 20px", borderRadius: "10px", background: "#a86955", color: "#fff", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Create Free Account</Link>
                  <Link to="/login" style={{ height: "38px", padding: "0 20px", borderRadius: "10px", border: "1px solid rgba(176,176,176,0.15)", background: "transparent", color: "#b8bfcc", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Log In</Link>
                </div>
              </div>
            ) : (
              <>
                {error && <p style={{ color: "#f08f8f", fontSize: "12px", marginBottom: "8px" }}>{error}</p>}
                <div style={{
                  display: "flex", gap: "10px", alignItems: "center",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "14px", padding: "6px 6px 6px 16px",
                }}>
                  <input
                    ref={inputRef}
                    type="text" placeholder="Type your message..."
                    value={text} onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKey} disabled={sending} autoFocus
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#f4f4f4", fontSize: "14px" }}
                  />
                  <button
                    type="button" onClick={handleSend}
                    disabled={sending || !text.trim()}
                    style={{
                      width: "36px", height: "36px", borderRadius: "10px", border: "none",
                      background: text.trim() ? "#a86955" : "rgba(255,255,255,0.06)",
                      color: text.trim() ? "#fff" : "#555",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: text.trim() ? "pointer" : "default", flexShrink: 0,
                      transition: "background 0.2s ease",
                    }}
                  >
                    <LuSendHorizontal size={16} />
                  </button>
                </div>
                <p style={{ margin: "8px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
                  Support tool only — not a replacement for professional care. Guest conversations are not saved.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestAiSupport;
