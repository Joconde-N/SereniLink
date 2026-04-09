import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { LuPencil, LuTrash2, LuEye, LuEyeOff } from "react-icons/lu";

const EMPTY_FORM = { title: "", summary: "", body: "", category: "", tags: "", video_url: "", is_published: false };
const CATEGORIES = ["Video", "Audio", "Article"];

const CATEGORY_STYLE = {
  Video:   { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  Audio:   { color: "#b39ddb", bg: "rgba(147,112,219,0.1)" },
  Article: { color: "#9ca3af", bg: "rgba(156,163,175,0.1)" },
};

function ContentManagement() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [editId, setEditId]     = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState("");
  const [search, setSearch]     = useState("");
  const [catFilter, setCatFilter] = useState("");

  const flash = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(""), 3000); };

  useEffect(() => {
    api.get("/content/admin/all", { params: { limit: 100 } })
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  const openEdit   = (item) => {
    setForm({ title: item.title, summary: item.summary ?? "", body: item.body, category: item.category, tags: item.tags ?? "", video_url: item.video_url ?? "", is_published: item.is_published });
    setEditId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    const req = editId ? api.put(`/content/${editId}`, form) : api.post("/content/", form);
    req.then((r) => {
        setItems((prev) => editId ? prev.map((i) => i.id === editId ? r.data : i) : [r.data, ...prev]);
        cancelForm();
        flash(editId ? "Content updated." : "Content created.");
      })
      .catch(() => flash("Save failed.", false))
      .finally(() => setSaving(false));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this content item?")) return;
    api.delete(`/content/${id}`)
      .then(() => { setItems((prev) => prev.filter((i) => i.id !== id)); flash("Content deleted."); })
      .catch(() => flash("Delete failed.", false));
  };

  const togglePublish = (item) => {
    api.put(`/content/${item.id}`, { is_published: !item.is_published })
      .then((r) => { setItems((prev) => prev.map((i) => i.id === item.id ? r.data : i)); flash(`Content ${r.data.is_published ? "published" : "unpublished"}.`); })
      .catch(() => flash("Update failed.", false));
  };

  const filtered = items
    .filter((i) => {
      const q = search.toLowerCase();
      const matchSearch = !q || i.title.toLowerCase().includes(q) || (i.category || "").toLowerCase().includes(q) || (i.tags || "").toLowerCase().includes(q);
      const matchCat = !catFilter || i.category.toLowerCase() === catFilter.toLowerCase();
      return matchSearch && matchCat;
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h1 className="dashboard-page-title" style={{ margin: 0 }}>Content Management</h1>
        {!showForm && <button className="primary-btn" onClick={openCreate}>+ New Content</button>}
      </div>
      <p className="dashboard-page-subtitle">Create, edit, publish, and delete resource content.</p>

      {msg && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: msg.ok ? "rgba(103,213,140,0.1)" : "rgba(239,68,68,0.1)", color: msg.ok ? "#67d58c" : "#f08f8f", border: `1px solid ${msg.ok ? "rgba(103,213,140,0.2)" : "rgba(239,68,68,0.2)"}` }}>
          {msg.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="dashboard-card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>{editId ? "Edit Content" : "Create Content"}</h3>
            <button className="secondary-btn" style={{ height: 36, padding: "0 14px", fontSize: 13 }} onClick={cancelForm}>Cancel</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-grid-2">
                <div>
                  <label className="form-label">Category *</label>
                  <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                    <option value="">Select category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Tags (comma-separated)</label>
                  <input className="form-input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label">Summary</label>
                <input className="form-input" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Video URL (YouTube — for Video category only)</label>
                <input className="form-input" placeholder="https://www.youtube.com/watch?v=..." value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Body *</label>
                <textarea className="form-textarea" style={{ minHeight: 160 }} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: "var(--text-soft)", fontSize: 14 }}>
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
                Publish immediately
              </label>
              <button className="primary-btn" type="submit" disabled={saving} style={{ alignSelf: "flex-start" }}>
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <input
          className="form-input"
          placeholder="Search by title, category or tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 340 }}
        />
        <select
          className="form-select"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || catFilter) && (
          <button onClick={() => { setSearch(""); setCatFilter(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
            Clear
          </button>
        )}
        <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-muted)" }}>
          {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: 40 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No content found.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-faint)" }}>
                {["Title", "Category", "Tags", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const catStyle = CATEGORY_STYLE[item.category] ?? { color: "var(--text-soft)", bg: "rgba(255,255,255,0.06)" };
                return (
                  <tr
                    key={item.id}
                    style={{ borderBottom: "1px solid var(--border-faint)", transition: "background 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Title */}
                    <td style={{ padding: "14px", maxWidth: 260 }}>
                      <p style={{ margin: 0, fontWeight: 600, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                      {item.summary && <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.summary}</p>}
                    </td>

                    {/* Category */}
                    <td style={{ padding: "14px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: catStyle.color, background: catStyle.bg }}>
                        {item.category}
                      </span>
                    </td>

                    {/* Tags */}
                    <td style={{ padding: "14px", color: "var(--text-muted)", fontSize: 12, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.tags || "—"}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: item.is_published ? "#67d58c" : "#f5c95f", background: item.is_published ? "rgba(103,213,140,0.1)" : "rgba(245,201,95,0.1)" }}>
                        {item.is_published ? "Published" : "Draft"}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "14px", color: "var(--text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                      {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => togglePublish(item)} title={item.is_published ? "Unpublish" : "Publish"} style={{ padding: "5px 8px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: `1px solid ${item.is_published ? "rgba(245,201,95,0.3)" : "rgba(103,213,140,0.3)"}`, background: "transparent", color: item.is_published ? "#f5c95f" : "#67d58c", display: "flex", alignItems: "center" }}>
                          {item.is_published ? <LuEyeOff size={15} /> : <LuEye size={15} />}
                        </button>
                        <button onClick={() => openEdit(item)} title="Edit" style={{ padding: "5px 8px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "1px solid var(--border-soft)", background: "transparent", color: "var(--text-main)", display: "flex", alignItems: "center" }}>
                          <LuPencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} title="Delete" style={{ padding: "5px 8px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "1px solid rgba(240,143,143,0.3)", background: "transparent", color: "#f08f8f", display: "flex", alignItems: "center" }}>
                          <LuTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ContentManagement;
