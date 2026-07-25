/**
 * Build a websocket URL for booking chat.
 * Uses VITE_API_URL and swaps http -> ws.
 */
export function getChatWsUrl(bookingId) {
  const base = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const wsBase = base.replace(/^http/, "ws").replace(/\/$/, "");
  const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
  return `${wsBase}/chat/ws/${bookingId}?token=${encodeURIComponent(token)}`;
}
