import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuBell } from "react-icons/lu";
import api from "../../api/axios";

function NotificationBell({ notifPath }) {
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const poll = () => {
      api.get("/notifications/me", { params: { unread_only: true, limit: 100 } })
        .then((res) => setUnread(Array.isArray(res.data) ? res.data.length : 0))
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <button
      type="button"
      onClick={() => navigate(notifPath)}
      title="Notifications"
      style={{
        position: "relative", background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px",
        width: "38px", height: "38px", display: "flex",
        alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: "var(--text-soft)", flexShrink: 0,
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(202,163,143,0.1)";
        e.currentTarget.style.borderColor = "rgba(202,163,143,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      <LuBell size={18} />
      {unread > 0 && (
        <span style={{
          position: "absolute", top: "5px", right: "5px",
          width: "8px", height: "8px", borderRadius: "50%",
          background: "#E19A86", border: "1.5px solid #050505",
        }} />
      )}
    </button>
  );
}

export default NotificationBell;
