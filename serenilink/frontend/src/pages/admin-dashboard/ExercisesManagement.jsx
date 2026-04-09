import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const EMPTY_FORM = { title: "", type: "", description: "", instructions: "", duration_sec: "", is_active: true };
const CATEGORY_STYLE = {
  BREATHING:     { color: "#67d58c", bg: "rgba(103,213,140,0.1)" },
  GROUNDING:     { color: "#E19A86", bg: "rgba(202,163,143,0.1)" },
  REFLECTION:    { color: "#7eb8f7", bg: "rgba(126,184,247,0.1)" },
  JOURNAL:       { color: "#b39ddb", bg: "rgba(147,112,219,0.1)" },
  VISUALIZATION: { color: "#f5c95f", bg: "rgba(245,201,95,0.1)"  },
};
const TYPES = ["BREATHING", "GROUNDING", "REFLECTION", "JOURNAL", "VISUALIZATION"];

function fmtDuration(sec) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}

function titleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export default function ExercisesManagement() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState("");
  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const flash = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(""), 3000); };

  useEffect(() => {
    api.get("/exercises/admin/all")
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };
  const openEdit   = (item) => {
    setForm({ title: item.title, type: item.type, description: item.description ?? "", instructions: item.instructions, duration_sec: item.duration_sec ?? "", is_active: item.is_active });
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancelForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, duration_sec: form.duration_sec !== "" ? parseInt(form.duration_sec) : null };
    const req = editingId ? api.patch(`/exercises/${editingId}`, payload) : api.post("/exercises/", payload);
    req.then((r) => {
        setItems((prev) => editingId ? prev.map((i) => i.id === editingId ? r.data : i) : [r.data, ...prev]);
        cancelForm();
        flash(editingId ? "Exercise updated." : "Exercise created.");
      })
      .catch(() => flash("Save failed.", false))
      .finally(() => setSaving(false));
  };

  const toggleActive = (item) => {
    api.patch(`/exercises/${item.id}/toggle-active`)
      .then((r) => {
        setItems((prev) => prev.map((i) => i.id === item.id ? r.data : i));
        flash(`Exercise ${r.data.is_active ? "activated" : "deactivated"}.`);
      })
      .catch(() => flash("Failed to update status.", false));
  };

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      i.title.toLowerCase().includes(q) ||
      i.type.toLowerCase().includes(q) ||
      (i.duration_sec && `${Math.floor(i.duration_sec / 60)}`.includes(q));
    const matchType = !typeFilter || i.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h1 className="dashboard-page-title" style={{ margin: 0 }}>Exercises Management</h1>
        {!showForm && <button className="primary-btn" onClick={openCreate}>+ New Exercise</button>}
      </div>
      <p className="dashboard-page-subtitle">Create and manage coping exercises for users.</p>

      {/* Flash message */}
      {msg && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: msg.ok ? "rgba(103,213,140,0.1)" : "rgba(239,68,68,0.1)", color: msg.ok ? "#67d58c" : "#f08f8f", border: `1px solid ${msg.ok ? "rgba(103,213,140,0.2)" : "rgba(239,68,68,0.2)"}` }}>
          {msg.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="dashboard-card" style={{ marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px" }}>{editingId ? "Edit Exercise" : "New Exercise"}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-grid-2">
                <div>
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Category *</label>
                  <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
                    <option value="">Select category...</option>
                    {TYPES.map(t => <option key={t} value={t}>{titleCase(t)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-grid-2">
                <div>
                  <label className="form-label">Description</label>
                  <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short summary shown on the card" />
                </div>
                <div>
                  <label className="form-label">Duration (seconds)</label>
                  <input className="form-input" type="number" value={form.duration_sec} onChange={(e) => setForm({ ...form, duration_sec: e.target.value })} placeholder="e.g. 300 = 5 min" />
                </div>
              </div>
              <div>
                <label className="form-label">Instructions *</label>
                <textarea className="form-textarea" style={{ minHeight: 140 }} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} required />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: "var(--text-soft)", fontSize: 14 }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Active (visible to users)
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="primary-btn" type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save Changes" : "Create Exercise"}</button>
                <button className="secondary-btn" type="button" onClick={cancelForm}>Cancel</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar: search + filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <input
          className="form-input"
          placeholder="Search by title, category or minutes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 340 }}
        />
        <select
          className="form-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          <option value="">All Categories</option>
          {TYPES.map(t => <option key={t} value={t}>{titleCase(t)}</option>)}
        </select>
        {(search || typeFilter) && (
          <button
            onClick={() => { setSearch(""); setTypeFilter(""); }}
            style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
          >
            Clear
          </button>
        )}
        <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-muted)" }}>
          {filtered.length} exercise{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: 40 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No exercises found.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-faint)" }}>
                {["Exercise Name", "Category", "Duration", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: "1px solid var(--border-faint)", transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  {/* Exercise Name */}
                  <td style={{ padding: "14px" }}>
                    <p style={{ margin: 0, fontWeight: 600, color: "var(--text-main)" }}>{item.title}</p>
                    {item.description && (
                      <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-muted)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.description}
                      </p>
                    )}
                  </td>

                  {/* Category */}
                  <td style={{ padding: "14px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: (CATEGORY_STYLE[item.type] ?? CATEGORY_STYLE.GROUNDING).bg, color: (CATEGORY_STYLE[item.type] ?? CATEGORY_STYLE.GROUNDING).color }}>
                      {titleCase(item.type)}
                    </span>
                  </td>

                  {/* Duration */}
                  <td style={{ padding: "14px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {fmtDuration(item.duration_sec)}
                  </td>

                  {/* Status */}
                  <td style={{ padding: "14px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: item.is_active ? "#67d58c" : "#f08f8f", background: item.is_active ? "rgba(103,213,140,0.1)" : "rgba(240,143,143,0.1)" }}>
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => openEdit(item)}
                        style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid var(--border-soft)", background: "transparent", color: "var(--text-main)", whiteSpace: "nowrap" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(item)}
                        style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${item.is_active ? "rgba(240,143,143,0.3)" : "rgba(103,213,140,0.3)"}`, background: "transparent", color: item.is_active ? "#f08f8f" : "#67d58c", whiteSpace: "nowrap" }}
                      >
                        {item.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
