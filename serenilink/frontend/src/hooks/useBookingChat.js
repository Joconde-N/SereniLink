import { useEffect, useRef, useState, useCallback } from "react";
import { getChatWsUrl } from "../utils/chatWs";
import api from "../api/axios";

/**
 * Booking chat with WebSocket (falls back to REST if WS fails).
 * Does NOT apply to the AI chatbot.
 */
export function useBookingChat(bookingId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const wsRef = useRef(null);

  const loadViaRest = useCallback(() => {
    return api.get(`/chat/booking/${bookingId}`, { params: { limit: 200 } })
      .then((res) => setMessages(res.data))
      .catch(() => setError("Failed to load messages."));
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;

    let closed = false;
    setLoading(true);
    setError("");

    const url = getChatWsUrl(bookingId);
    let ws;

    try {
      ws = new WebSocket(url);
      wsRef.current = ws;
    } catch {
      loadViaRest().finally(() => setLoading(false));
      return;
    }

    ws.onopen = () => {
      if (!closed) setLive(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "history") {
          setMessages(data.messages || []);
          setLoading(false);
        } else if (data.type === "message" || data.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) return prev;
            const { type, ...msg } = data;
            return [...prev, msg];
          });
        }
      } catch {
        // ignore bad payloads
      }
    };

    ws.onerror = () => {
      setLive(false);
      // Fall back to REST history
      loadViaRest().finally(() => setLoading(false));
    };

    ws.onclose = () => {
      setLive(false);
      wsRef.current = null;
    };

    return () => {
      closed = true;
      if (ws && ws.readyState <= 1) ws.close();
    };
  }, [bookingId, loadViaRest]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    setError("");

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ message: trimmed }));
      setSending(false);
      return true;
    }

    // REST fallback
    try {
      await api.post("/chat/", { booking_id: parseInt(bookingId, 10), message: trimmed });
      await loadViaRest();
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send message.");
      return false;
    } finally {
      setSending(false);
    }
  };

  return { messages, loading, sending, error, setError, live, sendMessage };
}
