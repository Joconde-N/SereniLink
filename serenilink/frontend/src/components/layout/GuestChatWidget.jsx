import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuBot, LuSendHorizontal, LuMaximize2, LuX, LuMinus, LuMessagesSquare } from "react-icons/lu";
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

function GuestChatWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [sending, setSending] = useState(false);
  const [messagesLeft, setMessagesLeft] = useState(MAX);
  const [limitReached, setLimitReached] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const guestId = useRef(getGuestId());

  useEffect(() => {
    const handler = () => { setOpen(true); setMinimized(false); setHasUnread(false); };
    window.addEventListener("open-guest-chat", handler);
    return () => window.removeEventListener("open-guest-chat", handler);
  }, []);

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, sending, open, minimized]);

  const handleSend = async () => {
    const msg = chatText.trim();
    if (!msg || sending || limitReached) return;
    setChatText("");
    setSending(true);
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
      if (minimized) setHasUnread(true);
    } catch (err) {
      if (err.response?.status === 403) { setLimitReached(true); setMessagesLeft(0); }
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const goFullscreen = () => {
    setOpen(false);
    navigate("/guest-ai", { state: { messages, messagesLeft, limitReached } });
  };

  const handleMinimize = () => { setMinimized(true); setHasUnread(false); };
  const handleReopen = () => { setMinimized(false); setHasUnread(false); };
  const handleClose = () => { setOpen(false); setMinimized(false); };

  // Minimized badge — replaced by the always-visible floating button below
  if (open && minimized) {
    return (
      <button
        type="button"
        onClick={handleReopen}
        title="Open chat"
        className="home-chat-btn"
        style={{ position: "fixed", right: "35px", bottom: "35px", zIndex: 999, background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
      >
        <div style={{ position: "relative", display: "inline-flex" }}>
          <LuMessagesSquare size={42} color="#a86955" fill="#a86955" strokeWidth={1} />
          {hasUnread && (
            <span style={{
              position: "absolute", top: "2px", right: "2px",
              width: "11px", height: "11px", borderRadius: "50%",
              background: "#67d58c", border: "2px solid #050505",
            }} />
          )}
        </div>
      </button>
    );
  }

  if (!open) return (
    <button
      type="button"
      onClick={() => { setOpen(true); setMinimized(false); }}
      title="Chat with SereniLink AI"
      className="home-chat-btn"
      style={{ position: "fixed", right: "35px", bottom: "35px", zIndex: 999, background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
    >
      <LuMessagesSquare size={42} color="#a86955" fill="#a86955" strokeWidth={1} />
    </button>
  );

  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 1000,
      width: "370px", height: "540px", borderRadius: "20px",
      background: "linear-gradient(180deg, #1a1a1d 0%, #171719 100%)",
      border: "1px solid rgba(176,176,176,0.1)",
      boxShadow: "0 20px 70px rgba(0,0,0,0.6)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      animation: "slideUp 0.25s ease",
    }}>
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
            background: "rgba(202,163,143,0.15)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <LuBot size={18} color="var(--accent, #E19A86)" />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#f4f4f4" }}>SereniLink AI</p>
            <p style={{ margin: 0, fontSize: "11px", color: messagesLeft > 1 ? "#67d58c" : "#f5c95f" }}>
              {messagesLeft} message{messagesLeft !== 1 ? "s" : ""} left ·{" "}
              <Link to="/register" style={{ color: "#E19A86", textDecoration: "none" }}>Sign up free</Link>
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button type="button" onClick={goFullscreen} title="Full screen" style={btnStyle}>
            <LuMaximize2 size={13} />
          </button>
          <button type="button" onClick={handleMinimize} title="Minimize" style={btnStyle}>
            <LuMinus size={13} />
          </button>
          <button type="button" onClick={handleClose} title="Close" style={btnStyle}>
            <LuX size={13} />
          </button>
        </div>
      </div>

      {/* Crisis strip */}
      <div style={{
        background: "rgba(220,80,80,0.08)", borderBottom: "1px solid rgba(220,80,80,0.12)",
        padding: "6px 16px", color: "#f08f8f", fontSize: "11px", textAlign: "center", flexShrink: 0,
      }}>
        <strong>Crisis?</strong> Call <strong>112</strong> or <strong>114</strong> immediately.
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px 14px 8px",
        display: "flex", flexDirection: "column", gap: "12px",
        scrollbarWidth: "thin", scrollbarColor: "rgba(202,163,143,0.2) transparent",
      }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "30px 16px", textAlign: "center" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(202,163,143,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuBot size={24} color="#E19A86" />
            </div>
            <p style={{ margin: 0, color: "#b0b0b0", fontSize: "13px", lineHeight: 1.7, maxWidth: "240px" }}>
              Hi there! I'm SereniLink AI.<br />I'm here to listen and support you. What's on your mind?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
              {["I'm feeling anxious", "I need someone to talk to", "What can you help with?"].map((prompt) => (
                <button
                  key={prompt} type="button"
                  onClick={() => { setChatText(prompt); inputRef.current?.focus(); }}
                  style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px", color: "#b8bfcc", fontSize: "12px", padding: "8px 12px",
                    cursor: "pointer", textAlign: "left", transition: "background 0.2s",
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
            display: "flex", gap: "8px",
            flexDirection: msg.role === "user" ? "row-reverse" : "row",
            alignItems: "flex-end",
          }}>
            {msg.role === "assistant" && (
              <div style={{
                width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
                background: "rgba(202,163,143,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <LuBot size={13} color="#E19A86" />
              </div>
            )}
            <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: "3px", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                padding: "10px 14px", fontSize: "13px", lineHeight: 1.6,
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user" ? "#a86955" : "rgba(255,255,255,0.06)",
                color: msg.role === "user" ? "#fff" : "#e0e0e0",
              }}>
                {msg.content}
                {msg.risk_level && RISK_COLOR[msg.risk_level] && (
                  <div style={{ marginTop: "4px", fontSize: "10px", color: RISK_COLOR[msg.risk_level] }}>
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
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0, background: "rgba(202,163,143,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuBot size={13} color="#E19A86" />
            </div>
            <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "rgba(255,255,255,0.06)", color: "#b0b0b0", fontSize: "13px" }}>
              Typing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px 14px", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {limitReached ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 10px", color: "#f4f4f4", fontSize: "12px" }}>You've used all {MAX} free messages.</p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <Link to="/register" style={{ height: "34px", padding: "0 16px", borderRadius: "9px", background: "#a86955", color: "#fff", fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Create Account</Link>
              <Link to="/login" style={{ height: "34px", padding: "0 16px", borderRadius: "9px", border: "1px solid rgba(176,176,176,0.15)", background: "transparent", color: "#b8bfcc", fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Log In</Link>
            </div>
          </div>
        ) : (
          <div style={{
            display: "flex", gap: "8px", alignItems: "center",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: "13px", padding: "5px 5px 5px 14px",
          }}>
            <input
              ref={inputRef}
              type="text" placeholder="Type your message..."
              value={chatText} onChange={(e) => setChatText(e.target.value)}
              onKeyDown={handleKey} disabled={sending}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#f4f4f4", fontSize: "13px" }}
            />
            <button
              type="button" onClick={handleSend}
              disabled={sending || !chatText.trim()}
              style={{
                width: "32px", height: "32px", borderRadius: "9px", border: "none",
                background: chatText.trim() ? "#a86955" : "rgba(255,255,255,0.06)",
                color: chatText.trim() ? "#fff" : "#555",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: chatText.trim() ? "pointer" : "default", flexShrink: 0,
                transition: "background 0.2s ease",
              }}
            >
              <LuSendHorizontal size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const btnStyle = {
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "7px", width: "28px", height: "28px",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", color: "#b8bfcc",
};

export default GuestChatWidget;
