import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { LuSendHorizontal, LuUser } from "react-icons/lu";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

function CounselorChat() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [booking, setBooking] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const loadMessages = () => {
    api.get(`/chat/booking/${bookingId}`, { params: { limit: 200 } })
      .then((res) => setMessages(res.data))
      .catch(() => setError("Failed to load messages."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then((res) => setBooking(res.data)).catch(() => {});
    loadMessages();
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post("/chat/", { booking_id: parseInt(bookingId), message: text.trim() });
      setText("");
      loadMessages();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clientName = booking?.user_name || "Client";

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <Link to={`/counselor/bookings/${bookingId}`} style={{ color: "var(--accent)", textDecoration: "none", fontSize: "14px" }}>
          ← Back to Booking
        </Link>
      </div>

      <h1 className="dashboard-page-title">Session Chat</h1>
      <p className="dashboard-page-subtitle">Booking #{bookingId} — conversation with your client.</p>

      <div style={{
        display: "flex", flexDirection: "column",
        background: "linear-gradient(180deg, #1a1a1d 0%, #171719 100%)",
        border: "1px solid var(--border-faint)", borderRadius: "20px",
        overflow: "hidden", height: "600px",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-faint)", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
            background: "rgba(202,163,143,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <LuUser size={18} color="var(--accent)" />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "14px" }}>{clientName}</p>
            <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>Session #{bookingId}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="message-list" style={{ flex: 1, overflowY: "auto", padding: "20px", gap: "16px" }}>
          {loading ? (
            <div style={{ color: "var(--text-muted)", textAlign: "center", paddingTop: "40px" }}>Loading messages...</div>
          ) : error ? (
            <div style={{ color: "#f08f8f", textAlign: "center", paddingTop: "40px" }}>{error}</div>
          ) : messages.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(202,163,143,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <LuUser size={26} color="var(--accent)" />
              </div>
              <p style={{ color: "var(--text-soft)", fontSize: "14px", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>
                No messages yet. Start the conversation with your client.
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
                  {!isMine && (
                    <div style={{
                      width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
                      background: "rgba(202,163,143,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <LuUser size={14} color="var(--accent)" />
                    </div>
                  )}
                  <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", gap: "4px", alignItems: isMine ? "flex-end" : "flex-start" }}>
                    <div style={{
                      padding: "12px 16px",
                      borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: isMine ? "#a86955" : "rgba(255,255,255,0.06)",
                      color: isMine ? "#fff" : "var(--text-main)",
                      fontSize: "14px", lineHeight: 1.6,
                    }}>
                      {msg.message}
                    </div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
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
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              disabled={sending}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text-main)", fontSize: "14px" }}
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
        </div>
      </div>
    </div>
  );
}

export default CounselorChat;
