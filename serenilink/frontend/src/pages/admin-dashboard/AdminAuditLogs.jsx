import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";

const ROLE_COLOR = { admin: "#f5c95f", counselor: "#60a5fa", user: "#67d58c" };

const ACTION_OPTIONS = [
  "USER_LOGIN", "USER_REGISTERED", "PROFILE_UPDATED",
  "COUNSELOR_APPROVED", "COUNSELOR_REJECTED",
  "BOOKING_CREATED", "BOOKING_STATUS_UPDATED", "BOOKING_CANCELLED",
  "ASSESSMENT_COMPLETED",
  "USER_PROMOTED", "USER_DEMOTED", "USER_TOGGLE_ACTIVE",
  "CONTENT_CREATED", "CONTENT_UPDATED", "CONTENT_DELETED",
  "EXERCISE_CREATED", "EXERCISE_UPDATED", "EXERCISE_TOGGLED",
];

const RESOURCE_OPTIONS = [
  "auth", "user", "booking", "screening",
  "counselor_application", "content", "exercise",
];

const ACTION_COLOR = {
  USER_LOGIN: "#60a5fa", USER_REGISTERED: "#67d58c",
  COUNSELOR_APPROVED: "#67d58c", COUNSELOR_REJECTED: "#f08f8f",
  BOOKING_CREATED: "var(--accent)", BOOKING_STATUS_UPDATED: "#f5c95f", BOOKING_CANCELLED: "#f08f8f",
  ASSESSMENT_COMPLETED: "#a78bfa", USER_PROMOTED: "#f5c95f",
  USER_DEMOTED: "#f08f8f", USER_TOGGLE_ACTIVE: "#b8bfcc",
  PROFILE_UPDATED: "var(--accent)",
  CONTENT_CREATED: "#67d58c", CONTENT_UPDATED: "#f5c95f", CONTENT_DELETED: "#f08f8f",
  EXERCISE_CREATED: "#67d58c", EXERCISE_UPDATED: "#f5c95f", EXERCISE_TOGGLED: "#60a5fa",
};

const PAGE_SIZE = 50;

function Badge({ label, color }) {
  return (
    <span style={{
      padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: `${color}18`, color, border: `1px solid ${color}30`,
      whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

function AdminAuditLogs() {
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(0);

  const [filters, setFilters] = useState({
    action: "", user_nickname: "", user_role: "", resource: "",
    date_from: "", date_to: "",
  });
  const [applied, setApplied] = useState(filters);

  const fetchLogs = useCallback((f, p) => {
    setLoading(true);
    const params = { skip: p * PAGE_SIZE, limit: PAGE_SIZE };
    if (f.action)        params.action        = f.action;
    if (f.user_nickname) params.user_nickname = f.user_nickname;
    if (f.user_role)     params.user_role     = f.user_role;
    if (f.resource)      params.resource      = f.resource;
    if (f.date_from)     params.date_from     = f.date_from;
    if (f.date_to)       params.date_to       = f.date_to;

    api.get("/audit-logs/", { params })
      .then((r) => { setLogs(r.data.logs); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLogs(applied, page); }, [applied, page, fetchLogs]);

  const handleApply = () => { setPage(0); setApplied({ ...filters }); };
  const handleReset = () => {
    const empty = { action: "", user_nickname: "", user_role: "", resource: "", date_from: "", date_to: "" };
    setFilters(empty); setApplied(empty); setPage(0);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (applied.action)        params.set("action",        applied.action);
    if (applied.user_nickname) params.set("user_nickname", applied.user_nickname);
    if (applied.user_role)     params.set("user_role",     applied.user_role);
    if (applied.resource)      params.set("resource",      applied.resource);
    if (applied.date_from)     params.set("date_from",     applied.date_from);
    if (applied.date_to)       params.set("date_to",       applied.date_to);
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    const url = `${baseUrl}/audit-logs/export-csv?${params}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error("Export failed");
        return r.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
      });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const inputStyle = {
    background: "var(--bg-input, rgba(255,255,255,0.04))", border: "1px solid var(--border-soft)",
    borderRadius: 10, padding: "8px 12px", color: "var(--text-main)", fontSize: 13,
    outline: "none", width: "100%",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <h1 className="dashboard-page-title" style={{ margin: 0 }}>Audit Logs</h1>
        <button
          onClick={handleExport}
          style={{
            padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: "1px solid rgba(225,154,134,0.3)", background: "rgba(225,154,134,0.08)",
            color: "var(--accent)", whiteSpace: "nowrap",
          }}
        >Export CSV</button>
      </div>
      <p className="dashboard-page-subtitle">Track all important system activities across the platform.</p>

      <div className="dashboard-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
          <select
            style={inputStyle} value={filters.action}
            onChange={(e) => setFilters((p) => ({ ...p, action: e.target.value }))}
          >
            <option value="">All Actions</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <input
            style={inputStyle} placeholder="Nickname"
            value={filters.user_nickname}
            onChange={(e) => setFilters((p) => ({ ...p, user_nickname: e.target.value }))}
          />
          <select
            style={inputStyle} value={filters.resource}
            onChange={(e) => setFilters((p) => ({ ...p, resource: e.target.value }))}
          >
            <option value="">All Resources</option>
            {RESOURCE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            style={inputStyle} value={filters.user_role}
            onChange={(e) => setFilters((p) => ({ ...p, user_role: e.target.value }))}
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="counselor">Counselor</option>
            <option value="admin">Admin</option>
          </select>
          <input type="date" style={inputStyle} value={filters.date_from}
            onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value }))} />
          <input type="date" style={inputStyle} value={filters.date_to}
            onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value }))} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleApply} className="primary-btn" style={{ height: 38, padding: "0 20px", fontSize: 13 }}>
            Apply Filters
          </button>
          <button onClick={handleReset} className="secondary-btn" style={{ height: 38, padding: "0 16px", fontSize: 13 }}>
            Reset
          </button>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-muted)", alignSelf: "center" }}>
            {total.toLocaleString()} total entries
          </span>
        </div>
      </div>

      <div className="dashboard-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>No audit logs found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-faint)" }}>
                  {["Timestamp", "User", "Role", "Action", "Resource", "Detail"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid var(--border-faint)" }}>
                    <td style={{ padding: "10px 16px", color: "var(--text-soft)", whiteSpace: "nowrap" }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 16px", fontWeight: 600 }}>
                      {log.user_nickname ?? <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      {log.user_role ? (
                        <Badge label={log.user_role} color={ROLE_COLOR[log.user_role] ?? "#b8bfcc"} />
                      ) : "—"}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <Badge label={log.action} color={ACTION_COLOR[log.action] ?? "#b8bfcc"} />
                    </td>
                    <td style={{ padding: "10px 16px", color: "var(--text-soft)" }}>
                      {log.resource ? `${log.resource}${log.resource_id ? ` #${log.resource_id}` : ""}` : "—"}
                    </td>
                    <td
                      title={log.detail || ""}
                      style={{
                        padding: "10px 16px", color: "var(--text-soft)", maxWidth: 280,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: log.detail ? "help" : "default",
                      }}
                    >
                      {log.detail ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 20 }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="secondary-btn" style={{ height: 36, padding: "0 16px", fontSize: 13 }}
          >← Prev</button>
          <span style={{ fontSize: 13, color: "var(--text-soft)" }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="secondary-btn" style={{ height: 36, padding: "0 16px", fontSize: 13 }}
          >Next →</button>
        </div>
      )}
    </div>
  );
}

export default AdminAuditLogs;
