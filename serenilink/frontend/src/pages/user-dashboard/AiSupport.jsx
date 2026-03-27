import React, { useEffect, useState, useRef } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const RISK_COLOR = { LOW: "#67d58c", MODERATE: "#f5c95f", HIGH: "#f08f8f" };

function AiSupport() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  // Load conversations list
  useEffect(() => {
    api.get("/ai/conversations/me", { params: { limit: 20 } })
      .then((res) => {
        setConversations(res.data);
        if (res.data.length > 0) setActiveConvId(res.data[0].id);
      })
      .catch(() => {});
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    setLoadingMsgs(true);
    api.get(`/ai/conversations/${activeConvId}`, { params: { limit: 100 } })
      .then((res) => setMessages(res.data))
      .catch(() => setError("Failed to load messages."))
      .finally(() => setLoadingMsgs(false));
  }, [activeConvId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text.trim();
    setText("");
    setSending(true);
    setError("");

    // Optimistic user message
    setMessages((prev) => [...prev, {
      id: Date.now(), role: "user", content: msg,
      risk_level: "LOW", created_at: new Date().toISOString(),
    }]);

    try {
      const res = await api.post("/ai/chat", {
        message: msg,
        conversation_id: activeConvId || undefined,
      });

      if (!activeConvId) {
        setActiveConvId(res.data.conversation_id);
        setConversations((prev) => [{ id: res.data.conversation_id, created_at: new Date().toISOString() }, ...prev]);
      }

      setMessages((prev) => [...prev, {
        id: Date.now() + 1, role: "assistant", content: res.data.reply,
        risk_level: res.data.risk_level, created_at: new Date().toISOString(),
      }]);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const startNew = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  return (
    <div>
      <h1 className="dashboard-page-title">AI Support</h1>
      <p className="dashboard-page-subtitle">Chat with SereniLink AI for guided emotional support.</p>

      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        {/* Crisis banner */}
        <div style={{
          position: "absolute",
          left: 0, right: 0,
        }} />
      </div>

      {/* Crisis banner */}
      <div style={{
        background: "rgba(220, 80, 80, 0.12)",
        border: "1px solid rgba(220, 80, 80, 0.3)",
        borderRadius: "10px",
        padding: "12px 18px",
        marginBottom: "16px",
        color: "#f08f8f",
        fontSize: "14px",
        lineHeight: 1.5,
      }}>
       <center> <strong>In case you are in crisis or emergency</strong>, call emergency services <strong>112</strong> or <strong>114</strong> for health services.</center>
      </div>

      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        {/* Sidebar: conversation list */}
        <div className="dashboard-card" style={{ width: "220px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "16px" }}>Chats</h3>
            <button className="primary-btn" type="button" onClick={startNew}
              style={{ padding: "6px 12px", fontSize: "12px", height: "auto" }}>
              + New
            </button>
          </div>
          <div className="list-stack" style={{ maxHeight: "400px", overflowY: "auto" }}>
            {conversations.length === 0 && (
              <p className="small-muted" style={{ textAlign: "center" }}>No chats yet.</p>
            )}
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className="simple-item"
                style={{
                  cursor: "pointer",
                  border: activeConvId === c.id ? "1px solid var(--accent)" : "1px solid var(--border-faint)",
                  background: activeConvId === c.id ? "rgba(202,163,143,0.08)" : "transparent",
                }}
              >
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>Chat #{c.id}</p>
                <p className="small-muted" style={{ margin: "2px 0 0", fontSize: "11px" }}>
                  {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="dashboard-card" style={{ flex: 1 }}>
          {error && <p style={{ color: "#f08f8f", fontSize: "13px", marginBottom: "10px" }}>{error}</p>}

          <div className="message-list" style={{ maxHeight: "460px", overflowY: "auto", paddingRight: "4px" }}>
            {loadingMsgs ? (
              <div style={{ color: "var(--text-muted)", padding: "40px", textAlign: "center" }}>Loading...</div>
            ) : messages.length === 0 ? (
              <div className="empty-state" style={{ flexDirection: "column", gap: "8px" }}>
                <p>Hi {user?.nickname}! I'm here to support you. What's on your mind?</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.role === "user" ? "mine" : "theirs"}`}>
                  <div className="message-bubble">
                    {msg.content}
                    <span className="message-time" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {msg.risk_level && msg.risk_level !== "LOW" && (
                        <span style={{ color: RISK_COLOR[msg.risk_level], marginLeft: "8px", fontSize: "10px" }}>
                          ⚠ {msg.risk_level}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <input
              className="form-input"
              type="text"
              placeholder="Type your message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              disabled={sending}
            />
            <button className="primary-btn" type="button" onClick={handleSend} disabled={sending || !text.trim()}>
              {sending ? "..." : "Send"}
            </button>
          </div>

          <p style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginTop: "10px",
            lineHeight: 1.6,
            textAlign: "center",
          }}>
            <strong>Disclaimer:</strong> This AI is a support tool, not a replacement for professional medical advice, diagnosis, or treatment. Conversations are confidential but may be used to improve support services.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AiSupport;
