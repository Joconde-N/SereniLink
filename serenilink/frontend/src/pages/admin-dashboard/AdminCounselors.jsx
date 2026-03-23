import React, { useEffect, useState } from "react";
import api from "../../api/axios";

function AdminCounselors() {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api.get("/counselors/", { params: { limit: 50 } })
      .then((r) => setCounselors(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = counselors.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.specialization.toLowerCase().includes(q) ||
      (c.general_location ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h1 className="dashboard-page-title">Counselors</h1>
      <p className="dashboard-page-subtitle">All approved and active counselors on the platform.</p>

      <div style={{ marginBottom: "20px" }}>
        <input
          className="form-input"
          placeholder="Search by name, specialization, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "400px" }}
        />
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No counselors found.</div>
      ) : (
        <div className="list-stack">
          {filtered.map((c) => {
            const expanded = expandedId === c.id;
            return (
              <div key={c.id} className="simple-item">
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                  onClick={() => setExpandedId(expanded ? null : c.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {c.profile_image_url ? (
                      <img src={c.profile_image_url} alt={c.full_name} style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#111", fontWeight: 700, fontSize: "16px", flexShrink: 0 }}>
                        {c.full_name[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "15px" }}>{c.full_name}</p>
                      <p className="small-muted" style={{ margin: "2px 0 0" }}>
                        {c.specialization}{c.title ? ` · ${c.title}` : ""}{c.general_location ? ` · 📍 ${c.general_location}` : ""}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className="status-pill approved">Active</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "18px" }}>{expanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {expanded && (
                  <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border-faint)" }}>
                    {c.bio && <p style={{ margin: "0 0 10px", color: "var(--text-soft)", fontSize: "14px" }}>{c.bio}</p>}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                      <span className="small-muted">{c.offers_online ? "✅ Online" : "❌ Online"}</span>
                      <span className="small-muted">{c.offers_in_person ? "✅ In-person" : "❌ In-person"}</span>
                      <span className="small-muted">ID: {c.id}</span>
                    </div>
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

export default AdminCounselors;
