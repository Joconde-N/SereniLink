import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const FALLBACK_IMAGE = "https://ui-avatars.com/api/?background=a78bfa&color=fff&size=200&name=";

function FindCounselors() {
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
      setError("Failed to load counselors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCounselors(0, false); }, [specialization]);

  const displayed = search
    ? counselors.filter((c) =>
        c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (c.specialization || "").toLowerCase().includes(search.toLowerCase())
      )
    : counselors;

  return (
    <div>
      <h1 className="dashboard-page-title">Find Counselors</h1>
      <p className="dashboard-page-subtitle">Browse available counselors and request a session.</p>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input
          className="form-input"
          type="text"
          placeholder="Search by name or specialization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px" }}
        />
        <select
          className="form-select"
          value={specialization}
          onChange={(e) => { setSpecialization(e.target.value); setSkip(0); }}
          style={{ width: "220px" }}
        >
          <option value="">All Specializations</option>
          <option value="Anxiety">Anxiety</option>
          <option value="Depression">Depression</option>
          <option value="Trauma">Trauma</option>
          <option value="Youth Counseling">Youth Counseling</option>
          <option value="Relationship Counseling">Relationship Counseling</option>
        </select>
      </div>

      {error && <p style={{ color: "#f08f8f", marginBottom: "16px" }}>{error}</p>}

      {loading && counselors.length === 0 ? (
        <div style={{ color: "var(--text-muted)", padding: "40px", textAlign: "center" }}>Loading counselors...</div>
      ) : displayed.length === 0 ? (
        <div className="dashboard-card">
          <div className="empty-state">No counselors found.</div>
        </div>
      ) : (
        <div className="dashboard-grid dashboard-cards-3">
          {displayed.map((c) => (
            <div className="dashboard-card" key={c.id}>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "14px" }}>
                <img
                  src={c.profile_image_url || `${FALLBACK_IMAGE}${encodeURIComponent(c.full_name)}`}
                  alt={c.full_name}
                  style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                  onError={(e) => { e.target.src = `${FALLBACK_IMAGE}${encodeURIComponent(c.full_name)}`; }}
                />
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "16px" }}>{c.full_name}</h3>
                  <p className="small-muted" style={{ margin: 0 }}>{c.title || c.specialization}</p>
                </div>
              </div>

              {c.bio && <p style={{ color: "var(--text-soft)", fontSize: "13px", marginBottom: "12px", lineHeight: 1.6 }}>
                {c.bio.slice(0, 120)}{c.bio.length > 120 ? "..." : ""}
              </p>}

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
                <span style={{ padding: "4px 10px", borderRadius: "999px", background: "rgba(202,163,143,0.1)", color: "var(--accent)", fontSize: "12px" }}>
                  {c.specialization}
                </span>
                {c.offers_online && <span style={{ padding: "4px 10px", borderRadius: "999px", background: "rgba(103,213,140,0.1)", color: "#67d58c", fontSize: "12px" }}>Online</span>}
                {c.offers_in_person && <span style={{ padding: "4px 10px", borderRadius: "999px", background: "rgba(147,112,219,0.1)", color: "#b39ddb", fontSize: "12px" }}>In-Person</span>}
              </div>

              {c.general_location && (
                <p className="small-muted" style={{ marginBottom: "14px", fontSize: "13px" }}>📍 {c.general_location}</p>
              )}

              <Link
                to="/dashboard/bookings"
                className="primary-btn"
                style={{ textDecoration: "none", display: "block", textAlign: "center", width: "100%" }}
              >
                Book Session
              </Link>
            </div>
          ))}
        </div>
      )}

      {hasMore && !search && (
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button className="secondary-btn" type="button" onClick={() => fetchCounselors(skip, true)} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}

export default FindCounselors;
