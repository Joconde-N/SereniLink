import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuBell } from "react-icons/lu";
import { useUnreadCount } from "../../hooks/useUnreadCount";

function NotificationBell({ notifPath }) {
  const { unread } = useUnreadCount();
  const navigate = useNavigate();
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (unread > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(t);
    }
  }, [unread]);

  return (
    <button
      type="button"
      onClick={() => navigate(notifPath)}
      title={unread > 0 ? `${unread} unread notifications` : "Notifications"}
      className="notif-bell-btn"
      style={{
        position: "relative", background: "var(--notif-bell-bg)",
        border: "1px solid var(--notif-bell-border)", borderRadius: "10px",
        width: "38px", height: "38px", display: "flex",
        alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: "var(--text-soft)", flexShrink: 0,
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
    >
      <LuBell size={18} />
      {unread > 0 && (
        <span
          className={pulse ? "notif-badge notif-badge-pulse" : "notif-badge"}
          style={{
            position: "absolute", top: "-4px", right: "-4px",
            minWidth: "18px", height: "18px", borderRadius: "999px",
            background: "#E19A86", color: "#111", fontSize: "10px", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 5px", border: "2px solid var(--bg-main)",
          }}
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}

export default NotificationBell;
