import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Counselors.css";
import api from "../../api/axios";

const FALLBACK_IMAGE = "https://ui-avatars.com/api/?background=a78bfa&color=fff&size=200&name=";

function Counselors() {
  const [counselors, setCounselors] = useState([]);
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
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
                    <Link to="#" className="detail-btn">
                      View Details
                    </Link>
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

      <Link to="/guest-ai" className="counselors-chat-btn" title="Chat with SereniLink AI">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="chat-svg">
          <path
            fill="currentColor"
            d="M3 12c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2H9v3l-3-3zm18 6c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2h-6v1c0 2.2-1.8 4-4 4v2c0 1.1.9 2 2 2h2v3l3-3z"
          />
        </svg>
      </Link>
    </div>
  );
}

export default Counselors;
