import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Counselors.css";
import api from "../../api/axios";

const FALLBACK_IMAGE = "https://ui-avatars.com/api/?background=a78bfa&color=fff&size=200&name=";

function CounselorModal({ counselor, onClose }) {
  if (!counselor) return null;
  const avatar = counselor.profile_image_url || `${FALLBACK_IMAGE}${encodeURIComponent(counselor.full_name)}`;
  const specializations = (counselor.specialization || "").split(",").map(s => s.trim()).filter(Boolean);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="counselor-modal-body"
        style={{
          background: "#1a1a1d", borderRadius: 0, width: "100%", maxWidth: 680,
          maxHeight: "90vh", overflowY: "auto", border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div style={{ position: "relative" }}>
          <div style={{ height: 120, background: "linear-gradient(135deg, #2a2b2b, #1a1a1d)" }} />
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "rgba(255,255,255,0.08)", border: "none",
              color: "#fff", width: 34, height: 34, borderRadius: "50%",
              cursor: "pointer", fontSize: 18, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
          <img
            src={avatar}
            alt={counselor.full_name}
            onError={(e) => { e.target.src = `${FALLBACK_IMAGE}${encodeURIComponent(counselor.full_name)}`; }}
            style={{
              position: "absolute", bottom: -50, left: 32,
              width: 100, height: 100, borderRadius: "50%",
              objectFit: "cover", border: "4px solid #1a1a1d",
            }}
          />
        </div>

        {/* Body */}
        <div style={{ padding: "64px 32px 32px" }}>
          {/* Name + title */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: "#fff" }}>{counselor.full_name}</h2>
            <p style={{ margin: 0, color: "#e19a86", fontSize: 15 }}>{counselor.title || counselor.specialization}</p>
          </div>

          {/* Quick stats */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {counselor.general_location && (
              <span style={{ fontSize: 14, color: "#b8bfcc" }}>📍 {counselor.general_location}</span>
            )}
            {counselor.years_of_experience && (
              <span style={{ fontSize: 14, color: "#b8bfcc" }}>🕐 {counselor.years_of_experience} yrs experience</span>
            )}
            {counselor.offers_online && <span style={{ fontSize: 14, color: "#b8bfcc" }}>💻 Online</span>}
            {counselor.offers_in_person && <span style={{ fontSize: 14, color: "#b8bfcc" }}>🏢 In-Person</span>}
          </div>

          {/* Bio */}
          {counselor.bio && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "#8f97a8", textTransform: "uppercase", letterSpacing: "0.06em" }}>About</h4>
              <p style={{ margin: 0, color: "#d9d9d9", lineHeight: 1.8, fontSize: 15 }}>{counselor.bio}</p>
            </div>
          )}

          {/* Specializations */}
          {specializations.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#8f97a8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Specializations</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {specializations.map(s => (
                  <span key={s} style={{
                    padding: "6px 14px", borderRadius: 999, fontSize: 13,
                    background: "rgba(225,154,134,0.12)", color: "#e19a86",
                    border: "1px solid rgba(225,154,134,0.2)",
                  }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Counseling Approach + Languages — 2 col grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {counselor.counseling_approach && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px" }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#8f97a8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Counseling Approach</h4>
                <p style={{ margin: 0, color: "#d9d9d9", fontSize: 13, lineHeight: 1.7 }}>{counselor.counseling_approach}</p>
              </div>
            )}
            {counselor.languages_offered && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px" }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#8f97a8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Languages</h4>
                <p style={{ margin: 0, color: "#d9d9d9", fontSize: 13, lineHeight: 1.7 }}>{counselor.languages_offered}</p>
              </div>
            )}
          </div>

          {/* Education & Credentials */}
          {(counselor.highest_certification || counselor.issuing_institution) && (
            <div style={{ marginBottom: 28, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 600, color: "#8f97a8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Education & Credentials</h4>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22 }}>🎓</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 2 }}>{counselor.highest_certification}</div>
                  {counselor.issuing_institution && (
                    <div style={{ fontSize: 13, color: "#8f97a8" }}>{counselor.issuing_institution}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <Link to="/login" className="counselors-btn" style={{ display: "block", textAlign: "center", borderRadius: 12 }}>
            Book a Session
          </Link>
        </div>
      </div>
    </div>
  );
}

function Counselors() {
  const [counselors, setCounselors] = useState([]);
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selected, setSelected] = useState(null);
  const LIMIT = 9;

  const fetchCounselors = async (newSkip = 0, append = false) => {
    setLoading(true);
    try {
      const params = { skip: newSkip, limit: LIMIT };
      if (specialization) params.specialization = specialization;

      const res = await api.get("/counselors/", { params });
      const data = res.data;

      setCounselors((prev) => (append ? [...prev, ...data] : data));
      setHasMore(data.length === LIMIT);
      setSkip(newSkip + data.length);
    } catch {
      setError("Failed to load counselors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounselors(0, false);
  }, [specialization]);

  const displayed = search
    ? counselors.filter(
        (c) =>
          c.full_name.toLowerCase().includes(search.toLowerCase()) ||
          (c.specialization || "").toLowerCase().includes(search.toLowerCase())
      )
    : counselors;

  return (
    <div className="counselors-page">
      <section className="counselors-hero-section">
        <div className="counselors-shape counselors-shape-left"></div>
        <div className="counselors-shape counselors-shape-top"></div>
        <div className="counselors-shape counselors-shape-middle"></div>
        <div className="counselors-shape counselors-shape-right"></div>

        <div className="counselors-hero-content">
          <div className="counselors-hero-text">
            <h1>
              Find The Right <span>Counselors</span> For You
            </h1>
            <p>Browse verified counselors ready to support your mental wellbeing.</p>
            <Link to="/login" className="counselors-btn">
              Book a Session
            </Link>
          </div>
        </div>
      </section>

      <section className="counselors-list-section">
        <div className="counselors-top-bar">
          <div className="search-box">
            <span className="search-icon-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="search-icon">
                <path
                  fill="currentColor"
                  d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search counselors"
              className="counselors-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="counselors-filter"
            value={specialization}
            onChange={(e) => { setSpecialization(e.target.value); setSkip(0); }}
          >
            <option value="">Filter Counselors Professions</option>
            <option value="Anxiety">Anxiety</option>
            <option value="Depression">Depression</option>
            <option value="Trauma">Trauma</option>
            <option value="Youth Counseling">Youth Counseling</option>
            <option value="Relationship Counseling">Relationship Counseling</option>
          </select>
        </div>

        {error && <p style={{ color: "red", textAlign: "center", padding: "20px" }}>{error}</p>}

        {loading && counselors.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#888" }}>Loading counselors...</p>
        ) : displayed.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#888" }}>No counselors found.</p>
        ) : (
          <div className="counselors-grid">
            {displayed.map((counselor) => (
              <div className="counselor-card" key={counselor.id}>
                <img
                  src={
                    counselor.profile_image_url ||
                    `${FALLBACK_IMAGE}${encodeURIComponent(counselor.full_name)}`
                  }
                  alt={counselor.full_name}
                  className="counselor-image"
                  onError={(e) => {
                    e.target.src = `${FALLBACK_IMAGE}${encodeURIComponent(counselor.full_name)}`;
                  }}
                />
                <div className="counselor-card-body">
                  <h3>{counselor.full_name}</h3>
                  <h4>{counselor.title || counselor.specialization}</h4>
                  <p>{counselor.bio || `Specializes in ${counselor.specialization}.`}</p>
                  <div className="counselor-card-buttons">
                    <Link to="/login" className="book-btn">
                      Book Session
                    </Link>
                    <button
                      className="detail-btn"
                      onClick={() => setSelected(counselor)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && !search && (
          <div className="view-more-wrap">
            <button
              className="view-more-btn"
              onClick={() => fetchCounselors(skip, true)}
              disabled={loading}
            >
              {loading ? "Loading..." : "View More"}
            </button>
          </div>
        )}
      </section>

      <button type="button" className="counselors-chat-btn" title="Chat with SereniLink AI"
        onClick={() => window.dispatchEvent(new Event("open-guest-chat"))}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="chat-svg">
          <path fill="currentColor" d="M3 12c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2H9v3l-3-3zm18 6c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2h-6v1c0 2.2-1.8 4-4 4v2c0 1.1.9 2 2 2h2v3l3-3z" />
        </svg>
      </button>

      <CounselorModal counselor={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default Counselors;
