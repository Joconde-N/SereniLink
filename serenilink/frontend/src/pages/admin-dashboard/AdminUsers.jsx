import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const ROLE_TABS = ["ALL", "user", "counselor", "admin"];

const ROLE_STYLE = {
  admin:     { color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  counselor: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  user:      { color: "#9ca3af", bg: "rgba(156,163,175,0.08)" },
};

function Avatar({ name }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
      background: "var(--accent-bg)", color: "var(--accent)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: 13,
    }}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

function RolePill({ role }) {
  const s = ROLE_STYLE[role] || ROLE_STYLE.user;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
      color: s.color, background: s.bg, textTransform: "capitalize",
    }}>{role}</span>
  );
}

function StatusPill({ active }) {
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
      color: active ? "#67d58c" : "#f08f8f",
      background: active ? "rgba(103,213,140,0.1)" : "rgba(240,143,143,0.1)",
    }}>{active ? "Active" : "Inactive"}</span>
  );
}

function DetailsPanel({ user, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const patch = async (endpoint, optimistic) => {
    setLoading(true);
    try {
      await api.patch(`/admin/users/${user.id}/${endpoint}`);
      onUpdate(user.id, optimistic);
    } catch {/* ignore */} finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", justifyContent: "flex-end",
    }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} />
      <div style={{
        width: 360, background: "#111214", borderLeft: "1px solid var(--border-faint)",
        padding: "28px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>User Details</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-soft)", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        {/* Avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "var(--accent-bg)", color: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 20,
          }}>
            {(user.nickname || "?")[0].toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{user.nickname}</p>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-muted)" }}>{user.email || "No email"}</p>
          </div>
        </div>

        {/* Info rows */}
        {[
          ["ID", `#${user.id}`],
          ["Role", <RolePill role={user.role} />],
          ["Status", <StatusPill active={user.is_active} />],
          ["Joined", user.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"],
        ].map(([label, val]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-faint)", paddingBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
            <span style={{ fontSize: 13 }}>{val}</span>
          </div>
        ))}

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <button
            disabled={loading}
            onClick={() => patch("toggle-active", { is_active: !user.is_active })}
            style={{
              padding: "10px 0", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${user.is_active ? "rgba(240,143,143,0.3)" : "rgba(103,213,140,0.3)"}`,
              background: "transparent",
              color: user.is_active ? "#f08f8f" : "#67d58c",
            }}
          >
            {user.is_active ? "Deactivate Account" : "Activate Account"}
          </button>

          {user.role === "user" && (
            <button
              disabled={loading}
              onClick={() => patch("promote", { role: "admin" })}
              style={{
                padding: "10px 0", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
                border: "1px solid rgba(245,201,95,0.3)", background: "transparent", color: "#f5c95f",
              }}
            >
              Promote to Admin
            </button>
          )}

          {user.role === "admin" && (
            <button
              disabled={loading}
              onClick={() => patch("demote", { role: "user" })}
              style={{
                padding: "10px 0", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
                border: "1px solid rgba(184,191,204,0.2)", background: "transparent", color: "var(--text-soft)",
              }}
            >
              Demote to User
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [roleTab, setRoleTab] = useState("ALL");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get("/admin/users/")
      .then((r) => setUsers(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = (id, patch) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, ...patch } : u));
    setSelected((prev) => prev?.id === id ? { ...prev, ...patch } : prev);
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = (u.nickname ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q);
    const matchRole   = roleTab === "ALL" || u.role === roleTab;
    return matchSearch && matchRole;
  });

  return (
    <div>
      <h1 className="dashboard-page-title">Users</h1>
      <p className="dashboard-page-subtitle">Manage all registered platform users.</p>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="form-input"
          placeholder="Search by nickname or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          {ROLE_TABS.map((r) => (
            <button
              key={r} type="button"
              onClick={() => setRoleTab(r)}
              style={{
                padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: roleTab === r ? "none" : "1px solid var(--border-soft)",
                background: roleTab === r ? "var(--accent)" : "transparent",
                color: roleTab === r ? "#111" : "var(--text-soft)",
                textTransform: "capitalize",
              }}
            >
              {r === "ALL" ? "All" : r}
              {r !== "ALL" && ` (${users.filter((u) => u.role === r).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: 40 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No users found.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-faint)" }}>
                {["User", "Role", "Status", "Date Created", "Actions"].map((h) => (
                  <th key={h} style={{
                    padding: "10px 14px", textAlign: "left",
                    color: "var(--text-muted)", fontWeight: 600, fontSize: 12,
                    textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  style={{ borderBottom: "1px solid var(--border-faint)", transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  {/* User */}
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={u.nickname} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{u.nickname ?? "—"}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>{u.email ?? "No email"}</p>
                      </div>
                    </div>
                  </td>
                  {/* Role */}
                  <td style={{ padding: "14px" }}><RolePill role={u.role} /></td>
                  {/* Status */}
                  <td style={{ padding: "14px" }}><StatusPill active={u.is_active} /></td>
                  {/* Date */}
                  <td style={{ padding: "14px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                  </td>
                  {/* Actions */}
                  <td style={{ padding: "14px" }}>
                    <button
                      onClick={() => setSelected(u)}
                      style={{
                        padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", border: "1px solid var(--border-soft)",
                        background: "transparent", color: "var(--text-main)",
                      }}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailsPanel
          user={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

export default AdminUsers;
