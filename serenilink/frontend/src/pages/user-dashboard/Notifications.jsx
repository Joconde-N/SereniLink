import React, { useEffect, useState } from "react";
import api from "../../api/axios";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [marking, setMarking] = useState(null);

  const load = (unread = false) => {
    setLoading(true);
    api.get("/notifications/me", { params: { unread_only: unread, limit: 100 } })
      .then((res) => setNotifications(res.data))
      .catch(() => setError("Failed to load notifications."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(unreadOnly); }, [unreadOnly]);

  const markRead = async (id) => {
    setMarking(id);
    try {
      await api.patch(`/notifications/${id}/read`, { is_read: true });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ } finally {
      setMarking(null);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => api.patch(`/notifications/${n.id}/read`, { is_read: true }).catch(() => {})));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      <h1 className="dashboard-page-title">Notifications</h1>
      <p className="dashboard-page-subtitle">Stay updated on bookings, messages, and wellness reminders.</p>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "16px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-soft)", fontSize: "14px", cursor: "pointer" }}>
          <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
          Unread only
        </label>
        {unreadCount > 0 && (
          <button className="secondary-btn" type="button" onClick={markAllRead} style={{ fontSize: "13px" }}>
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading notifications...</div>
      ) : error ? (
        <div style={{ color: "#f08f8f", padding: "20px" }}>{error}</div>
      ) : (
        <div className="dashboard-card">
          {notifications.length === 0 ? (
            <div className="empty-state">
              {unreadOnly ? "No unread notifications." : "No notifications yet."}
            </div>
          ) : (
            <div className="list-stack">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className={`simple-item notification-item ${!item.is_read ? "unread" : ""}`}
                  style={{ opacity: item.is_read ? 0.65 : 1 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: item.is_read ? 400 : 600 }}>{item.title}</p>
                      <p className="small-muted" style={{ margin: "4px 0 0" }}>{item.message}</p>
                      <p className="small-muted" style={{ margin: "6px 0 0", fontSize: "12px" }}>
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!item.is_read && (
                      <button
                        className="secondary-btn"
                        type="button"
                        onClick={() => markRead(item.id)}
                        disabled={marking === item.id}
                        style={{ fontSize: "12px", padding: "6px 12px", marginLeft: "12px", whiteSpace: "nowrap" }}
                      >
                        {marking === item.id ? "..." : "Mark read"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Notifications;
