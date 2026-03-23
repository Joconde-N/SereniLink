import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const EMPTY_FORM = { title: "", summary: "", body: "", category: "", tags: "", is_published: false };

function ContentManagement() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [editId, setEditId]     = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState("");

  const flash = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(""), 3000);
  };

  const load = () => {
    // Admin needs all content including unpublished — backend public endpoint only returns published.
    // We fetch published content; unpublished items created here will appear after publish.
    api.get("/content/", { params: { limit: 50 } })
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };

  const openEdit = (item) => {
    setForm({
      title: item.title, summary: item.summary ?? "",
      body: item.body, category: item.category,
      tags: item.tags ?? "", is_published: item.is_published,
    });
    setEditId(item.id);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    const req = editId
      ? api.put(`/content/${editId}`, payload)
      : api.post("/content/", payload);

    req
      .then((r) => {
        if (editId) {
          setItems((prev) => prev.map((i) => i.id === editId ? r.data : i));
        } else {
          setItems((prev) => [r.data, ...prev]);
        }
        setShowForm(false);
        setEditId(null);
        flash(editId ? "Content updated." : "Content created.");
      })
      .catch(() => flash("Save failed.", false))
      .finally(() => setSaving(false));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this content item?")) return;
    api.delete(`/content/${id}`)
      .then(() => {
        setItems((prev) => prev.filter((i) => i.id !== id));
        flash("Content deleted.");
      })
      .catch(() => flash("Delete failed.", false));
  };

  const togglePublish = (item) => {
    api.put(`/content/${item.id}`, { is_published: !item.is_published })
      .then((r) => {
        setItems((prev) => prev.map((i) => i.id === item.id ? r.data : i));
        flash(`Content ${r.data.is_published ? "published" : "unpublished"}.`);
      })
      .catch(() => flash("Update failed.", false));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h1 className="dashboard-page-title" style={{ margin: 0 }}>Content Management</h1>
        <button className="primary-btn" onClick={openCreate}>+ New Content</button>
      </div>
      <p className="dashboard-page-subtitle">Create, edit, publish, and delete resource content.</p>

      {msg && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px", background: msg.ok ? "rgba(103,213,140,0.1)" : "rgba(239,68,68,0.1)", color: msg.ok ? "#67d58c" : "#f08f8f", border: `1px solid ${msg.ok ? "rgba(103,213,140,0.2)" : "rgba(239,68,68,0.2)"}` }}>
          {msg.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="dashboard-card" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0 }}>{editId ? "Edit Content" : "Create Content"}</h3>
            <button className="secondary-btn" style={{ height: "36px", padding: "0 14px", fontSize: "13px" }} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-grid-2">
                <div>
                  <label className="form-label">Category *</label>
                  <input className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
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
                <label className="form-label">Body *</label>
                <textarea className="form-textarea" style={{ minHeight: "160px" }} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--text-soft)", fontSize: "14px" }}>
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

      {/* List */}
      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">No content yet. Create your first item.</div>
      ) : (
        <div className="list-stack">
          {items.map((item) => (
            <div key={item.id} className="simple-item">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>{item.title}</span>
                    <span className={`status-pill ${item.is_published ? "approved" : "pending"}`}>
                      {item.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="small-muted" style={{ margin: "0 0 2px" }}>{item.category}{item.tags ? ` · ${item.tags}` : ""}</p>
                  {item.summary && <p className="small-muted" style={{ margin: 0 }}>{item.summary}</p>}
                </div>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button
                    onClick={() => togglePublish(item)}
                    style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid var(--border-soft)", background: "transparent", color: item.is_published ? "#f5c95f" : "#67d58c" }}
                  >
                    {item.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button className="secondary-btn" style={{ height: "34px", padding: "0 12px", fontSize: "13px" }} onClick={() => openEdit(item)}>Edit</button>
                  <button onClick={() => handleDelete(item.id)} style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#f08f8f" }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ContentManagement;
