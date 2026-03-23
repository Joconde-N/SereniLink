import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

function SessionChat() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
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

  useEffect(() => { loadMessages(); }, [bookingId]);

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
      alert(err.response?.data?.detail || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <Link to={`/dashboard/bookings/${bookingId}`} style={{ color: "var(--accent)", textDecoration: "none", fontSize: "14px" }}>
          ← Back to Booking
        </Link>
      </div>

      <h1 className="dashboard-page-title">Session Chat</h1>
      <p className="dashboard-page-subtitle">Booking #{bookingId} — conversation with your counselor.</p>

      <div className="dashboard-card">
        {loading ? (
          <div style={{ color: "var(--text-muted)", padding: "40px", textAlign: "center" }}>Loading messages...</div>
        ) : error ? (
          <div style={{ color: "#f08f8f", padding: "20px" }}>{error}</div>
        ) : (
          <div className="message-list" style={{ maxHeight: "480px", overflowY: "auto", paddingRight: "4px" }}>
            {messages.length === 0 ? (
              <div className="empty-state">No messages yet. Start the conversation.</div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`message-row ${isMine ? "mine" : "theirs"}`}>
                    <div className="message-bubble">
                      {msg.message}
                      <span className="message-time">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        )}

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
      </div>
    </div>
  );
}

export default SessionChat;
