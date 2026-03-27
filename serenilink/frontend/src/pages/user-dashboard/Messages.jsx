import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

function Messages() {
  const [bookings, setBookings] = useState([]);
  const [previews, setPreviews] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/bookings/me", { params: { limit: 50 } })
      .then(async (res) => {
        const approved = res.data.filter((b) => b.status === "APPROVED");
        setBookings(approved);
        const previewMap = {};
        await Promise.all(
          approved.map(async (b) => {
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
      <p className="dashboard-page-subtitle">Chat threads from your active counseling sessions.</p>

      {bookings.length === 0 ? (
        <div className="dashboard-card">
          <div className="empty-state">
            No active sessions yet.{" "}
            <Link to="/dashboard/counselors" style={{ color: "var(--accent)" }}>
              Find a counselor 
            </Link>{" "}
             to get started.
          </div>
        </div>
      ) : (
        <div className="dashboard-card">
          <div className="list-stack">
            {bookings.map((b) => {
              const last = previews[b.id];
              return (
                <Link key={b.id} to={`/dashboard/chat/${b.id}`} style={{ textDecoration: "none" }}>
                  <div
                    className="simple-item"
                    style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", cursor: "pointer", transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(202,163,143,0.06)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{
                        width: "44px", height: "44px", borderRadius: "50%",
                        background: "rgba(202,163,143,0.15)", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        color: "var(--accent)", fontWeight: 700, fontSize: "15px", flexShrink: 0,
                      }}>
                        {b.counselor_name?.[0]?.toUpperCase() ?? "C"}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>
                          {b.counselor_name ?? `Booking #${b.id}`}
                        </p>
                        <p className="small-muted" style={{ margin: "3px 0 0", fontSize: "13px" }}>
                          {last
                            ? last.message.slice(0, 65) + (last.message.length > 65 ? "…" : "")
                            : "No messages yet — start the conversation"}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "12px" }}>
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

export default Messages;
