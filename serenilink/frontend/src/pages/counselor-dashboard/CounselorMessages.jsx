import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

function CounselorMessages() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [previews, setPreviews] = useState({});

  useEffect(() => {
    // Load approved bookings — these are the ones with active chats
    api.get("/bookings/counselor/me", { params: { limit: 50 } })
      .then(async (res) => {
        const active = res.data.filter((b) => b.status === "APPROVED" || b.status === "COMPLETED");
        setBookings(active);
        // Fetch last message preview for each booking
        const previewMap = {};
        await Promise.all(
          res.data.map(async (b) => {
            try {
              const msgRes = await api.get(`/chat/booking/${b.id}`, { params: { limit: 1 } });
              if (msgRes.data.length > 0) previewMap[b.id] = msgRes.data[msgRes.data.length - 1];
            } catch { /* no messages yet */ }
          })
        );
        setPreviews(previewMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading messages...</div>;

  return (
    <div>
      <h1 className="dashboard-page-title">Messages</h1>
      <p className="dashboard-page-subtitle">Chat threads from your approved and completed sessions.</p>

      {bookings.length === 0 ? (
        <div className="dashboard-card">
          <div className="empty-state">No active sessions with chat available.</div>
        </div>
      ) : (
        <div className="dashboard-card">
          <div className="list-stack">
            {bookings.map((b) => {
              const last = previews[b.id];
              return (
                <Link
                  key={b.id}
                  to={`/counselor/chat/${b.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="simple-item"
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      cursor: "pointer", transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(202,163,143,0.06)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      {/* Avatar */}
                      <div style={{
                        width: "44px", height: "44px", borderRadius: "50%",
                        background: "rgba(202,163,143,0.2)", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        color: "var(--accent)", fontWeight: 700, fontSize: "16px", flexShrink: 0,
                      }}>
                        #{b.user_id}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: "var(--text-main)" }}>
                          Booking #{b.id}
                        </p>
                        <p className="small-muted" style={{ margin: "3px 0 0" }}>
                          {last
                            ? last.message.slice(0, 60) + (last.message.length > 60 ? "..." : "")
                            : "No messages yet — start the conversation"}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p className="small-muted" style={{ margin: 0, fontSize: "12px" }}>
                        {last ? new Date(last.created_at).toLocaleDateString() : ""}
                      </p>
                      <span style={{ color: "var(--accent)", fontSize: "18px" }}>›</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default CounselorMessages;
