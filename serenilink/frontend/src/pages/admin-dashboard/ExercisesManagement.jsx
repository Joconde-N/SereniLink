import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const EMPTY_FORM = { title: "", type: "", instructions: "", is_active: true };

function ExercisesManagement() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [typeFilter, setTypeFilter] = useState("");

  const flash = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(""), 3000); };

  const load = () => {
    api.get("/exercises/", { params: { limit: 100 } })
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    api.post("/exercises/", form)
      .then((r) => {
        setItems((prev) => [r.data, ...prev]);
        setForm(EMPTY_FORM);
        setShowForm(false);
        flash("Exercise created.");
      })
      .catch(() => flash("Create failed.", false))
      .finally(() => setSaving(false));
  };

  const types = [...new Set(items.map((i) => i.type))].filter(Boolean);
  const filtered = typeFilter ? items.filter((i) => i.type === typeFilter) : items;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h1 className="dashboard-page-title" style={{ margin: 0 }}>Exercises Management</h1>
        <button className="primary-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Exercise"}
        </button>
      </div>
      <p className="dashboard-page-subtitle">Create and manage coping exercises for users.</p>

      <div style={{ marginBottom: "20px", padding: "14px 18px", borderRadius: "12px", background: "rgba(245,201,95,0.08)", border: "1px solid rgba(245,201,95,0.2)", color: "#f5c95f", fontSize: "13px", lineHeight: 1.6 }}>
        <strong>Note:</strong> The user-facing exercises page currently uses a built-in set of 15 curated exercises defined in the frontend. Exercises created here are stored in the database and can be used for future API-driven features or a separate exercise library. Both sets are independent.
      </div>

      {msg && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px", background: msg.ok ? "rgba(103,213,140,0.1)" : "rgba(239,68,68,0.1)", color: msg.ok ? "#67d58c" : "#f08f8f", border: `1px solid ${msg.ok ? "rgba(103,213,140,0.2)" : "rgba(239,68,68,0.2)"}` }}>
          {msg.text}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="dashboard-card" style={{ marginBottom: "24px" }}>
          <h3 style={{ margin: "0 0 16px" }}>New Exercise</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="form-grid-2">
                <div>
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Type * (e.g. Breathing, Mindfulness)</label>
                  <input className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="form-label">Instructions *</label>
                <textarea className="form-textarea" style={{ minHeight: "140px" }} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} required />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--text-soft)", fontSize: "14px" }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Active (visible to users)
              </label>
              <button className="primary-btn" type="submit" disabled={saving} style={{ alignSelf: "flex-start" }}>
                {saving ? "Saving..." : "Create Exercise"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Type Filter */}
      {types.length > 0 && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          <button
            onClick={() => setTypeFilter("")}
            style={{ padding: "7px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: !typeFilter ? "none" : "1px solid var(--border-soft)", background: !typeFilter ? "var(--accent)" : "transparent", color: !typeFilter ? "#111" : "var(--text-soft)" }}
          >
            All
          </button>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{ padding: "7px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: typeFilter === t ? "none" : "1px solid var(--border-soft)", background: typeFilter === t ? "var(--accent)" : "transparent", color: typeFilter === t ? "#111" : "var(--text-soft)" }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No exercises found.</div>
      ) : (
        <div className="list-stack">
          {filtered.map((item) => {
            const expanded = expandedId === item.id;
            return (
              <div key={item.id} className="simple-item">
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>{item.title}</span>
                    <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: "rgba(202,163,143,0.1)", color: "var(--accent)" }}>
                      {item.type}
                    </span>
                    <span className={`status-pill ${item.is_active ? "approved" : "cancelled"}`}>
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <span style={{ color: "var(--text-muted)", fontSize: "18px" }}>{expanded ? "▲" : "▼"}</span>
                </div>
                {expanded && (
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-faint)" }}>
                    <p style={{ margin: "0 0 8px", color: "var(--text-soft)", fontSize: "14px", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                      {item.instructions}
                    </p>
                    <p className="small-muted" style={{ margin: 0, fontSize: "12px" }}>
                      Created: {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ExercisesManagement;
