import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LuSend, LuMinimize2 } from "react-icons/lu";
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
  // Messages passed from the popup so the conversation continues seamlessly
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

    setMessages((prev) => [...prev, {
      id: Date.now(), role: "user", content: msg, created_at: new Date().toISOString(),
    }]);

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
        padding: "20px 32px", flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <Link to="/" style={{ color: "#b0b0b0", fontSize: "20px", fontWeight: 700, textDecoration: "none" }}>
          SereniLink
        </Link>
        <Link to="/" style={{ color: "#b0b0b0", fontSize: "13px", textDecoration: "none", transition: "color 0.2s" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#E19A86"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#b0b0b0"}
        >
          ← Back to Home
        </Link>
      </div>

      {/* Crisis banner */}
      <div style={{
        background: "rgba(220,80,80,0.08)", borderBottom: "1px solid rgba(220,80,80,0.12)",
        padding: "9px 32px", color: "#f08f8f", fontSize: "13px",
        textAlign: "center", lineHeight: 1.5, flexShrink: 0,
      }}>
        <strong>Crisis or emergency?</strong> Call <strong>112</strong> or <strong>114</strong> immediately.
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: "760px", width: "100%", margin: "0 auto", padding: "0 20px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0 10px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", color: "#f4f4f4", fontWeight: 700 }}>AI Support Assistant</h2>
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: messagesLeft > 1 ? "#67d58c" : "#f5c95f" }}>
              {messagesLeft} free message{messagesLeft !== 1 ? "s" : ""} left ·{" "}
              <Link to="/register" style={{ color: "#E19A86", textDecoration: "none" }}>Sign up for unlimited</Link>
            </p>
          </div>
          <Link
            to="/"
            title="Back to popup"
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              color: "#b0b0b0", fontSize: "13px", textDecoration: "none",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "9px", padding: "7px 12px", transition: "color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#E19A86"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#b0b0b0"}
          >
            <LuMinimize2 size={13} /> Minimize
          </Link>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", display: "flex", flexDirection: "column",
          gap: "12px", paddingBottom: "12px",
        }}>
          {messages.length === 0 && (
            <div style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              color: "#b0b0b0", fontSize: "14px", textAlign: "center",
              padding: "60px 20px", lineHeight: 1.8,
            }}>
              Hi there 👋 I'm here to listen and support you.<br />What's on your mind today?
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "72%", padding: "11px 15px", fontSize: "14px", lineHeight: 1.65,
                borderRadius: "16px",
                borderBottomRightRadius: msg.role === "user" ? "4px" : "16px",
                borderBottomLeftRadius: msg.role === "user" ? "16px" : "4px",
                background: msg.role === "user" ? "#a86955" : "rgba(255,255,255,0.06)",
                color: msg.role === "user" ? "#fff" : "#e0e0e0",
              }}>
                {msg.content}
                {msg.risk_level && RISK_COLOR[msg.risk_level] && (
                  <div style={{ marginTop: "5px", fontSize: "11px", color: RISK_COLOR[msg.risk_level] }}>
                    ⚠ {msg.risk_level} — consider reaching out to a professional.
                  </div>
                )}
                <div style={{ fontSize: "11px", opacity: 0.45, marginTop: "3px", textAlign: "right" }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
          {sending && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                padding: "10px 16px", borderRadius: "16px", borderBottomLeftRadius: "4px",
                background: "rgba(255,255,255,0.06)", color: "#b0b0b0", fontSize: "18px", letterSpacing: "4px",
              }}>···</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ paddingBottom: "24px", flexShrink: 0 }}>
          {limitReached ? (
            <div style={{
              background: "rgba(202,163,143,0.08)", border: "1px solid rgba(202,163,143,0.18)",
              borderRadius: "14px", padding: "16px", textAlign: "center",
            }}>
              <p style={{ margin: "0 0 12px", color: "#f4f4f4", fontSize: "14px" }}>You've used all 5 free messages.</p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <Link to="/register" style={{
                  height: "38px", padding: "0 20px", borderRadius: "10px",
                  background: "#a86955", color: "#fff", fontSize: "13px",
                  fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none",
                }}>Create Free Account</Link>
                <Link to="/login" style={{
                  height: "38px", padding: "0 20px", borderRadius: "10px",
                  border: "1px solid rgba(176,176,176,0.15)", background: "transparent",
                  color: "#b8bfcc", fontSize: "13px", fontWeight: 600,
                  display: "inline-flex", alignItems: "center", textDecoration: "none",
                }}>Log In</Link>
              </div>
            </div>
          ) : (
            <>
              {error && <p style={{ color: "#f08f8f", fontSize: "12px", marginBottom: "8px" }}>{error}</p>}
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type your message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKey}
                  disabled={sending}
                  autoFocus
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)", borderRadius: "14px",
                    color: "#f4f4f4", padding: "13px 16px", fontSize: "14px", outline: "none",
                  }}
                />
                <button
                  type="button" onClick={handleSend}
                  disabled={sending || !text.trim()}
                  style={{
                    width: "46px", height: "46px", borderRadius: "13px", border: "none",
                    background: sending || !text.trim() ? "rgba(168,105,85,0.35)" : "#a86955",
                    color: "#fff", cursor: sending || !text.trim() ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.2s", flexShrink: 0,
                  }}
                >
                  <LuSend size={17} />
                </button>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#555", textAlign: "center" }}>
                Support tool only — not a replacement for professional care. Guest conversations are not saved.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GuestAiSupport;
