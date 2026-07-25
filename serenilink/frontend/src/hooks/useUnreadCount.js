import { useEffect, useState } from "react";
import api from "../api/axios";

/**
 * Polls unread notification count every 30 seconds.
 * Returns 0 when everything is read (so badges can hide).
 */
export function useUnreadCount() {
  const [unread, setUnread] = useState(0);

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

  return unread;
}
