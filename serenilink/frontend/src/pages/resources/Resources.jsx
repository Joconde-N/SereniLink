import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Resources.css";
import api from "../../api/axios";

import featuredVideo from "../../assets/resources/featured-video.jpg";
import featuredMusic from "../../assets/resources/featured-music.jpg";
import featuredArticle from "../../assets/resources/featured-article.jpg";

const CATEGORY_IMAGES = {
  video: featuredVideo,
  music: featuredMusic,
  article: featuredArticle,
};

function getCategoryImage(category) {
  const key = (category || "").toLowerCase();
  return CATEGORY_IMAGES[key] || featuredArticle;
}

function getActionLabel(category) {
  const key = (category || "").toLowerCase();
  if (key === "video") return "Watch Now";
  if (key === "music") return "Listen Now";
  return "Read Now";
}

function ResourceCard({ item }) {
  const cat = (item.category || "").toLowerCase();
  return (
    <div className="resource-item-card">
      <div className="resource-image-wrap">
        <img
          src={getCategoryImage(item.category)}
          alt={item.title}
          className="resource-item-image"
        />
        <div className="resource-badge">{item.category}</div>

        {(cat === "video" || cat === "music") && (
          <div className="resource-center-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="play-svg">
              <path
                fill="currentColor"
                d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.68L9.54 5.98A1 1 0 0 0 8 6.82"
              />
            </svg>
          </div>
        )}

        {cat === "article" && (
          <div className="resource-corner-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="corner-svg">
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7S9 1 2 6v22c7-5 14 0 14 0s7-5 14 0V6c-7-5-14 1-14 1m0 0v21"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="resource-item-body">
        <h3>{item.title}</h3>
        <p className="resource-meta">
          {new Date(item.created_at).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}{" "}
          | {item.category}
        </p>
        <Link to="/login" className="resource-action-btn">
          {getActionLabel(item.category)}
        </Link>
      </div>
    </div>
  );
}

function Resources() {
  const [allItems, setAllItems] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 9;

  const fetchContent = async (newSkip = 0, append = false) => {
    setLoading(true);
    try {
      const params = { skip: newSkip, limit: LIMIT };
      if (search) params.q = search;
      if (activeTab !== "All") params.category = activeTab;

      const res = await api.get("/content/", { params });
      const data = res.data;

      setAllItems((prev) => (append ? [...prev, ...data] : data));
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

  const featured = allItems.slice(0, 3);
  const rest = allItems.slice(3);

  return (
    <div className="resources-page">
      <section className="resources-hero-section">
        <div className="resources-shape resources-shape-left"></div>
        <div className="resources-shape resources-shape-top"></div>
        <div className="resources-shape resources-shape-small"></div>

        <div className="resources-hero-content">
          <h1>Resources</h1>
          <p>Explore videos, music, and articles curated to support your mental health journey.</p>

          <div className="resources-toolbar">
            <form className="resources-search-box" onSubmit={handleSearch}>
              <span className="resources-search-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="toolbar-svg">
                  <path
                    fill="currentColor"
                    d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search resources"
                className="resources-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>

            <div className="resources-filter-box">
              <span>Filter by Type</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="toolbar-svg filter-svg">
                <path
                  fill="currentColor"
                  d="M3 5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25c0 .53-.187 1.042-.528 1.447L14.25 14v4.19c0 .344-.177.663-.469.844l-3 1.875A1 1 0 0 1 9.25 20v-6L3.528 6.697A2.25 2.25 0 0 1 3 5.25"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section className="resources-main-section">
        {error && <p style={{ color: "red", textAlign: "center", padding: "20px" }}>{error}</p>}

        {loading && allItems.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#888" }}>Loading resources...</p>
        ) : (
          <>
            {featured.length > 0 && (
              <>
                <div className="section-heading-row">
                  <h2>Featured Resources</h2>
                  <div className="section-line"></div>
                </div>
                <div className="resources-grid featured-grid">
                  {featured.map((item) => (
                    <ResourceCard key={item.id} item={item} />
                  ))}
                </div>
              </>
            )}

            <div className="section-heading-row all-row">
              <h2>All Resources</h2>
              <div className="section-line"></div>
            </div>

            <div className="resource-tabs">
              {["All", "Video", "Music", "Article"].map((tab) => (
                <button
                  key={tab}
                  className={`resource-tab${activeTab === tab ? " active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}s
                </button>
              ))}
            </div>

            {rest.length === 0 && !loading ? (
              <p style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                No resources found.
              </p>
            ) : (
              <div className="resources-grid all-grid">
                {rest.map((item) => (
                  <ResourceCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}

        {hasMore && (
          <div className="view-more-wrap">
            <button
              className="view-more-btn"
              onClick={() => fetchContent(skip, true)}
              disabled={loading}
            >
              {loading ? "Loading..." : "View More"}
            </button>
          </div>
        )}
      </section>

      <button type="button" className="resources-chat-btn" title="Chat with SereniLink AI"
        onClick={() => window.dispatchEvent(new Event("open-guest-chat"))}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="chat-svg">
          <path fill="currentColor" d="M3 12c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2H9v3l-3-3zm18 6c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2h-6v1c0 2.2-1.8 4-4 4v2c0 1.1.9 2 2 2h2v3l3-3z" />
        </svg>
      </button>
    </div>
  );
}

export default Resources;
