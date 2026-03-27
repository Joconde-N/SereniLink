import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuSend, LuMaximize2, LuX } from "react-icons/lu";
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
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [sending, setSending] = useState(false);
  const [messagesLeft, setMessagesLeft] = useState(MAX);
  const [limitReached, setLimitReached] = useState(false);
  const bottomRef = useRef(null);
  const guestId = useRef(getGuestId());

  // Listen for the custom "open-guest-chat" event fired by the floating buttons
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-guest-chat", handler);
    return () => window.removeEventListener("open-guest-chat", handler);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

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

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 1000,
      width: "360px", height: "520px", borderRadius: "20px",
      background: "linear-gradient(160deg, #1c1c1f 0%, #171719 100%)",
      border: "1px solid rgba(176,176,176,0.1)",
      boxShadow: "0 16px 60px rgba(0,0,0,0.55)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
      }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#f4f4f4" }}>AI Support Assistant</p>
          <p style={{ margin: 0, fontSize: "11px", color: messagesLeft > 1 ? "#67d58c" : "#f5c95f" }}>
            {messagesLeft} message{messagesLeft !== 1 ? "s" : ""} left ·{" "}
            <Link to="/register" style={{ color: "#E19A86", textDecoration: "none" }}>Sign up</Link>
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button type="button" onClick={goFullscreen} title="Full screen"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "7px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#b8bfcc" }}>
            <LuMaximize2 size={13} />
          </button>
          <button type="button" onClick={() => setOpen(false)} title="Close"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "7px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#b8bfcc" }}>
            <LuX size={13} />
          </button>
        </div>
      </div>

      {/* Crisis strip */}
      <div style={{ background: "rgba(220,80,80,0.08)", borderBottom: "1px solid rgba(220,80,80,0.12)", padding: "6px 16px", color: "#f08f8f", fontSize: "11px", textAlign: "center", flexShrink: 0 }}>
        <strong>Crisis?</strong> Call <strong>112</strong> or <strong>114</strong>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 6px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#b0b0b0", fontSize: "13px", textAlign: "center", padding: "30px 16px", lineHeight: 1.7 }}>
            Hi there 👋 I'm here to listen.<br />What's on your mind?
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "84%", padding: "9px 13px", fontSize: "13px", lineHeight: 1.6,
              borderRadius: "14px",
              borderBottomRightRadius: msg.role === "user" ? "3px" : "14px",
              borderBottomLeftRadius: msg.role === "user" ? "14px" : "3px",
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
          </div>
        ))}
        {sending && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "9px 14px", borderRadius: "14px", borderBottomLeftRadius: "3px", background: "rgba(255,255,255,0.06)", color: "#b0b0b0", fontSize: "16px", letterSpacing: "4px" }}>···</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px 14px", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {limitReached ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 8px", color: "#f4f4f4", fontSize: "12px" }}>You've used all 5 free messages.</p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <Link to="/register" style={{ height: "32px", padding: "0 14px", borderRadius: "8px", background: "#a86955", color: "#fff", fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Create Account</Link>
              <Link to="/login" style={{ height: "32px", padding: "0 14px", borderRadius: "8px", border: "1px solid rgba(176,176,176,0.15)", background: "transparent", color: "#b8bfcc", fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Log In</Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="text" placeholder="Type your message..."
              value={chatText} onChange={(e) => setChatText(e.target.value)}
              onKeyDown={handleKey} disabled={sending} autoFocus
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "10px", color: "#f4f4f4", padding: "9px 12px", fontSize: "13px", outline: "none" }}
            />
            <button type="button" onClick={handleSend} disabled={sending || !chatText.trim()}
              style={{ width: "36px", height: "36px", borderRadius: "10px", border: "none", background: sending || !chatText.trim() ? "rgba(168,105,85,0.35)" : "#a86955", color: "#fff", cursor: sending || !chatText.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <LuSend size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GuestChatWidget;
