import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const ROLE_COLOR = { admin: "#f5c95f", counselor: "#67d58c", pending_counselor: "var(--accent)", user: "var(--text-soft)" };

const ROLE_TABS = ["ALL", "user", "counselor", "admin"];

function AdminUsers() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleTab, setRoleTab] = useState("ALL");
  const [msg, setMsg]       = useState("");

  useEffect(() => {
    api.get("/admin/users/")
      .then((r) => setUsers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const promote = (userId) => {
    if (!window.confirm("Promote this user to admin?")) return;
    api.patch(`/admin/users/${userId}/promote`)
      .then(() => {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: "admin" } : u));
        setMsg("User promoted to admin.");
        setTimeout(() => setMsg(""), 3000);
      })
      .catch(() => setMsg("Promotion failed."));
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (u.nickname ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q);
    const matchesRole = roleTab === "ALL" || u.role === roleTab;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <h1 className="dashboard-page-title">Users</h1>
      <p className="dashboard-page-subtitle">All registered platform users.</p>

      {msg && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px", background: "rgba(103,213,140,0.1)", color: "#67d58c", border: "1px solid rgba(103,213,140,0.2)" }}>
          {msg}
        </div>
      )}

      {/* Role filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {ROLE_TABS.map((r) => (
          <button
            key={r} type="button"
            onClick={() => setRoleTab(r)}
            style={{
              padding: "7px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              border: roleTab === r ? "none" : "1px solid var(--border-soft)",
              background: roleTab === r ? "var(--accent)" : "transparent",
              color: roleTab === r ? "#111" : "var(--text-soft)",
              textTransform: "capitalize",
            }}
          >
            {r === "ALL" ? "All" : r}{r !== "ALL" && ` (${users.filter(u => u.role === r).length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: "20px" }}>
        <input
          className="form-input"
          placeholder="Search by nickname or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "400px" }}
        />
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No users found.</div>
      ) : (
        <div className="list-stack">
          {filtered.map((u) => (
            <div key={u.id} className="simple-item">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#111", fontWeight: 700, fontSize: "15px", flexShrink: 0 }}>
                    {(u.nickname ?? u.email ?? "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>{u.nickname ?? "—"}</p>
                    <p className="small-muted" style={{ margin: "2px 0 0" }}>{u.email ?? "No email"} · ID: {u.id}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: "rgba(255,255,255,0.05)", color: ROLE_COLOR[u.role] ?? "var(--text-soft)" }}>
                    {u.role}
                  </span>
                  {u.role !== "admin" && (
                    <button
                      onClick={() => promote(u.id)}
                      style={{ padding: "5px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid rgba(245,201,95,0.3)", background: "transparent", color: "#f5c95f" }}
                    >
                      Promote to Admin
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
