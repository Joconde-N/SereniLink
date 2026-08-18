import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LuSendHorizontal, LuUserCheck } from "react-icons/lu";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useBookingChat } from "../../hooks/useBookingChat";

function SessionChat() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);
  const { messages, loading, sending, error, setError, live, sendMessage } = useBookingChat(bookingId);

  useEffect(() => {
    api.get("/bookings/me", { params: { limit: 50 } })
      .then((res) => {
        const found = res.data.find((b) => String(b.id) === String(bookingId));
        if (found) setBooking(found);
      })
      .catch(() => {});
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const ok = await sendMessage(text);
    if (ok) setText("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const counselorName = booking?.counselor_name || "Counselor";

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "14px", cursor: "pointer", padding: 0 }}
        >
          ← Back
        </button>
      </div>

      <h1 className="dashboard-page-title">Session Chat</h1>
      <p className="dashboard-page-subtitle">
        Conversation with {counselorName}
        {live ? " · Live" : ""}
      </p>

      <div style={{
        display: "flex", flexDirection: "column",
        background: "var(--bg-panel)",
        border: "1px solid var(--border-faint)", borderRadius: "20px",
        overflow: "hidden", height: "600px",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-faint)", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
            background: "rgba(202,163,143,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <LuUserCheck size={18} color="var(--accent)" />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "14px" }}>{counselorName}</p>
            <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>
              {live ? "Connected" : "Connecting…"}
            </p>
          </div>
        </div>

        <div className="message-list" style={{ flex: 1, overflowY: "auto", padding: "20px", gap: "16px" }}>
          {loading ? (
            <div style={{ color: "var(--text-muted)", textAlign: "center", paddingTop: "40px" }}>Loading messages...</div>
          ) : error && messages.length === 0 ? (
            <div style={{ color: "#f08f8f", textAlign: "center", paddingTop: "40px" }}>{error}</div>
          ) : messages.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
              <p style={{ color: "var(--text-soft)", fontSize: "14px", textAlign: "center" }}>
                No messages yet. Start the conversation with your counselor.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={msg.id} style={{
                  display: "flex", gap: "10px",
                  flexDirection: isMine ? "row-reverse" : "row",
                  alignItems: "flex-end",
                }}>
                  <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", gap: "4px", alignItems: isMine ? "flex-end" : "flex-start" }}>
                    <div style={{
                      padding: "12px 16px",
                      borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: isMine ? "#a86955" : "var(--chat-bubble-theirs)",
                      color: isMine ? "#fff" : "var(--text-main)",
                      fontSize: "14px", lineHeight: 1.6,
                    }}>
                      {msg.message}
                    </div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                      {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border-faint)" }}>
          {error && <p style={{ color: "#f08f8f", fontSize: "12px", marginBottom: "8px" }}>{error}</p>}
          <div style={{
            display: "flex", gap: "10px", alignItems: "center",
            background: "var(--bg-input)", border: "1px solid var(--border-soft)",
            borderRadius: "14px", padding: "6px 6px 6px 16px",
          }}>
            <input
              type="text"
              placeholder="Type your message..."
              value={text}
              onChange={(e) => { setText(e.target.value); setError(""); }}
              onKeyDown={handleKey}
              disabled={sending}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text-main)", fontSize: "14px" }}
            />
            <button
              type="button" onClick={handleSend}
              disabled={sending || !text.trim()}
              style={{
                width: "36px", height: "36px", borderRadius: "10px", border: "none",
                background: text.trim() ? "#a86955" : "rgba(128,128,128,0.15)",
                color: text.trim() ? "#fff" : "var(--text-muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: text.trim() ? "pointer" : "default", flexShrink: 0,
              }}
            >
              <LuSendHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionChat;
