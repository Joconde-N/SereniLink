import React, { useEffect, useState, useRef } from "react";
import { LuSendHorizontal, LuPlus, LuBot, LuChevronsLeft, LuChevronsRight } from "react-icons/lu";
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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isNewChat, setIsNewChat] = useState(false);

  useEffect(() => {
    api.get("/ai/conversations/me", { params: { limit: 20 } })
      .then((res) => {
        setConversations(res.data);
        if (res.data.length > 0) setActiveConvId(res.data[0].id);
      })
      .catch(() => {});
  }, []);

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

    setMessages((prev) => [...prev, {
      id: Date.now(), role: "user", content: msg,
      risk_level: "LOW", created_at: new Date().toISOString(),
    }]);

    try {
      const res = await api.post("/ai/chat", {
        message: msg,
        conversation_id: activeConvId || undefined,
        force_new: isNewChat,
      });

      if (!activeConvId) {
        setActiveConvId(res.data.conversation_id);
        setConversations((prev) => [{ id: res.data.conversation_id, created_at: new Date().toISOString() }, ...prev]);
        setIsNewChat(false);
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
    setIsNewChat(true);
  };

  return (
    <div>
      <h1 className="dashboard-page-title">AI Support</h1>
      <p className="dashboard-page-subtitle">Chat with SereniLink AI for guided emotional support.</p>

      {/* Crisis banner */}
      <div style={{
        background: "rgba(220,80,80,0.08)", border: "1px solid rgba(220,80,80,0.2)",
        borderRadius: "12px", padding: "10px 16px", marginBottom: "20px",
        color: "#f08f8f", fontSize: "13px", textAlign: "center",
      }}>
        <strong>In crisis or emergency?</strong> Call <strong>112</strong> or <strong>114</strong> for health services.
      </div>

      <div style={{ display: "flex", gap: "16px", height: "580px" }}>

        {/* Sidebar */}
        <div style={{
          width: sidebarCollapsed ? "48px" : "200px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px",
          background: "linear-gradient(180deg, #1a1a1d 0%, #171719 100%)",
          border: "1px solid var(--border-faint)", borderRadius: "20px", padding: "16px",
          transition: "width 0.25s ease", overflow: "hidden",
        }}>
          {/* Collapse toggle */}
          <div style={{ display: "flex", justifyContent: sidebarCollapsed ? "center" : "flex-end", marginBottom: "4px" }}>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
            >
              {sidebarCollapsed ? <LuChevronsRight size={16} /> : <LuChevronsLeft size={16} />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              <button
                type="button" onClick={startNew}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  width: "100%", height: "36px", borderRadius: "10px", border: "1px solid var(--border-soft)",
                  background: "transparent", color: "var(--accent)", fontSize: "13px",
                  fontWeight: 600, cursor: "pointer", marginBottom: "8px",
                }}
              >
                <LuPlus size={14} /> New Chat
              </button>

              <p style={{ margin: "0 0 6px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>History</p>

              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px",
                scrollbarWidth: "thin", scrollbarColor: "rgba(202,163,143,0.3) transparent" }}>
                {conversations.length === 0 && (
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", marginTop: "12px" }}>No chats yet.</p>
                )}
                {conversations.map((c) => (
                  <button
                    key={c.id} type="button"
                    onClick={() => setActiveConvId(c.id)}
                    style={{
                      width: "100%", textAlign: "left", padding: "10px 12px",
                      borderRadius: "10px", cursor: "pointer",
                      border: activeConvId === c.id ? "1px solid rgba(202,163,143,0.3)" : "1px solid transparent",
                      background: activeConvId === c.id ? "rgba(202,163,143,0.08)" : "transparent",
                      color: activeConvId === c.id ? "var(--accent)" : "var(--text-soft)",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: 600 }}>Chat #{c.id}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "10px", color: "var(--text-muted)" }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}

          {sidebarCollapsed && (
            <button
              type="button" onClick={startNew}
              title="New Chat"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", height: "36px", borderRadius: "10px", border: "1px solid var(--border-soft)",
                background: "transparent", color: "var(--accent)", cursor: "pointer",
              }}
            >
              <LuPlus size={16} />
            </button>
          )}
        </div>

        {/* Chat panel */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          background: "linear-gradient(180deg, #1a1a1d 0%, #171719 100%)",
          border: "1px solid var(--border-faint)", borderRadius: "20px", overflow: "hidden",
        }}>
          {/* Chat header */}
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid var(--border-faint)",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "rgba(202,163,143,0.15)", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <LuBot size={18} color="var(--accent)" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "14px" }}>SereniLink AI</p>
              <p style={{ margin: 0, fontSize: "11px", color: "#67d58c" }}>● Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="message-list" style={{ flex: 1, overflowY: "auto", padding: "20px", gap: "16px" }}>
            {loadingMsgs ? (
              <div style={{ color: "var(--text-muted)", textAlign: "center", paddingTop: "40px" }}>Loading...</div>
            ) : messages.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(202,163,143,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LuBot size={26} color="var(--accent)" />
                </div>
                <p style={{ color: "var(--text-soft)", fontSize: "14px", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>
                  Hi <strong style={{ color: "var(--accent)" }}>{user?.nickname}</strong>! I'm here to support you. What's on your mind?
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} style={{
                  display: "flex", gap: "10px",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  alignItems: "flex-end",
                }}>
                  {/* Avatar */}
                  {msg.role === "assistant" && (
                    <div style={{
                      width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
                      background: "rgba(202,163,143,0.12)", display: "flex",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <LuBot size={14} color="var(--accent)" />
                    </div>
                  )}

                  <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", gap: "4px",
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{
                      padding: "12px 16px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: msg.role === "user" ? "#a86955" : "rgba(255,255,255,0.06)",
                      color: msg.role === "user" ? "#fff" : "var(--text-main)",
                      fontSize: "14px", lineHeight: 1.6,
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {msg.risk_level && msg.risk_level !== "LOW" && (
                        <span style={{ fontSize: "10px", color: RISK_COLOR[msg.risk_level] }}>⚠ {msg.risk_level}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0, background: "rgba(202,163,143,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LuBot size={14} color="var(--accent)" />
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "rgba(255,255,255,0.06)", fontSize: "14px", color: "var(--text-muted)" }}>
                  <span>Typing</span>
                  <span style={{ animation: "none" }}> ...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border-faint)" }}>
            {error && <p style={{ color: "#f08f8f", fontSize: "12px", marginBottom: "8px" }}>{error}</p>}
            <div style={{ display: "flex", gap: "10px", alignItems: "center",
              background: "var(--bg-input)", border: "1px solid var(--border-soft)",
              borderRadius: "14px", padding: "6px 6px 6px 16px",
            }}>
              <input
                type="text"
                placeholder="Type your message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKey}
                disabled={sending}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "var(--text-main)", fontSize: "14px",
                }}
              />
              <button
                type="button" onClick={handleSend}
                disabled={sending || !text.trim()}
                style={{
                  width: "36px", height: "36px", borderRadius: "10px", border: "none",
                  background: text.trim() ? "#a86955" : "rgba(255,255,255,0.06)",
                  color: text.trim() ? "#fff" : "var(--text-muted)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: text.trim() ? "pointer" : "default", flexShrink: 0,
                  transition: "background 0.2s ease",
                }}
              >
                <LuSendHorizontal size={16} />
              </button>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: "11px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
              AI support tool only, not a replacement for professional medical advice, diagnosis, or treatment. Conversations are confidential but may be used to improve
support services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiSupport;
