import React, { useState, useEffect } from "react";
import api from "../../api/axios";

const TABS = ["All", "Video", "Music", "Article"];
const LIMIT = 9;

function getActionLabel(category) {
  const key = (category || "").toLowerCase();
  if (key === "video") return "Watch Now";
  if (key === "music") return "Listen Now";
  return "Read Now";
}

function getCategoryIcon(category) {
  const key = (category || "").toLowerCase();
  if (key === "video") return "🎥";
  if (key === "music") return "🎵";
  return "📖";
}

function DashboardResources() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchContent = async (newSkip = 0, append = false) => {
    setLoading(true);
    try {
      const params = { skip: newSkip, limit: LIMIT };
      if (search) params.q = search;
      if (activeTab !== "All") params.category = activeTab;

      const res = await api.get("/content/", { params });
      const data = res.data;

      setItems((prev) => (append ? [...prev, ...data] : data));
      setHasMore(data.length === LIMIT);
      setSkip(newSkip + data.length);
    } catch {
      setError("Failed to load resources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSkip(0);
    fetchContent(0, false);
  }, [activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSkip(0);
    fetchContent(0, false);
  };

  return (
    <div>
      <h1 className="dashboard-page-title">Resources</h1>
      <p className="dashboard-page-subtitle">Explore videos, music, and articles curated for your mental health journey.</p>

      {/* Search + filter tabs row */}
      <div style={{ marginBottom: 24 }}>
        <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 14, background: "var(--bg-input)", border: "1px solid var(--border-soft)", borderRadius: 12, overflow: "hidden" }}>
          <input
            className="form-input"
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, border: "none", borderRadius: 0, background: "transparent" }}
          />
          <button type="submit" style={{
            height: 46, width: 46, flexShrink: 0,
            background: "transparent", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--accent)",
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14" />
            </svg>
          </button>
        </form>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 18px", borderRadius: 999, cursor: "pointer", fontSize: 13,
                border: `1px solid ${activeTab === tab ? "var(--accent)" : "var(--border-soft)"}`,
                background: activeTab === tab ? "rgba(202,163,143,0.12)" : "transparent",
                color: activeTab === tab ? "var(--accent)" : "var(--text-soft)",
              }}
            >
              {tab === "All" ? "All" : `${tab}s`}
            </button>
          ))}
        </div>
      </div>

      {error && <p style={{ color: "#f08f8f", marginBottom: 16 }}>{error}</p>}

      {loading && items.length === 0 ? (
        <div style={{ color: "var(--text-muted)", padding: 40, textAlign: "center" }}>Loading resources...</div>
      ) : items.length === 0 ? (
        <div className="dashboard-card">
          <div className="empty-state">No resources found.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {items.map((item) => (
            <div key={item.id} className="dashboard-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "18px 18px 0", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{getCategoryIcon(item.category)}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: "var(--accent)",
                  background: "rgba(202,163,143,0.12)", padding: "3px 10px", borderRadius: 999,
                }}>
                  {item.category}
                </span>
              </div>

              <div style={{ padding: "12px 18px 18px" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 15, lineHeight: 1.4, color: "var(--text-main)" }}>
                  {item.title}
                </h3>
                {item.summary && (
                  <p style={{
                    margin: "0 0 12px", fontSize: 13, color: "var(--text-soft)", lineHeight: 1.5,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {item.summary}
                  </p>
                )}
                <p style={{ margin: "0 0 14px", fontSize: 11, color: "var(--text-muted)" }}>
                  {new Date(item.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
                <button
                  type="button"
                  style={{
                    height: 34, padding: "0 16px", borderRadius: 10, fontSize: 13,
                    fontWeight: 600, cursor: "pointer", border: "none",
                    background: "var(--accent)", color: "#111",
                  }}
                >
                  {getActionLabel(item.category)}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <button
            type="button"
            onClick={() => fetchContent(skip, true)}
            style={{
              background: "transparent", border: "none", color: "var(--text-main)",
              textDecoration: "underline", fontSize: 14, cursor: "pointer",
            }}
          >
            View More
          </button>
        </div>
      )}

      {loading && items.length > 0 && (
        <div style={{ textAlign: "center", marginTop: 20, color: "var(--text-muted)", fontSize: 13 }}>Loading...</div>
      )}
    </div>
  );
}

export default DashboardResources;
