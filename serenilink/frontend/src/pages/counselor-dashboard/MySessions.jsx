import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const STATUS_CLASS = {
  PENDING: "pending", APPROVED: "approved",
  DECLINED: "declined", CANCELLED: "cancelled", COMPLETED: "approved",
};

function MySessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("APPROVED");
  const [acting, setActing]     = useState(null);

  const load = (status) => {
    setLoading(true);
    const params = { limit: 100 };
    if (status) params.status = status;
    api.get("/bookings/counselor/me", { params })
      .then((res) => setSessions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

  const markComplete = async (id) => {
    if (!window.confirm("Mark this session as completed?")) return;
    setActing(id);
    try {
      await api.patch(`/bookings/${id}/counselor-status`, { status: "COMPLETED" });
      load(filter);
    } catch (err) {
      alert(err.response?.data?.detail || "Cannot complete this session.");
    } finally {
      setActing(null);
    }
  };

  return (
    <div>
      <h1 className="dashboard-page-title">My Sessions</h1>
      <p className="dashboard-page-subtitle">View and manage your approved and completed sessions.</p>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
        {["APPROVED", "COMPLETED", "CANCELLED", "DECLINED"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            style={{
              padding: "8px 18px", borderRadius: "999px", cursor: "pointer", fontSize: "14px",
              border: `1px solid ${filter === s ? "var(--accent)" : "var(--border-soft)"}`,
              background: filter === s ? "rgba(202,163,143,0.12)" : "transparent",
              color: filter === s ? "var(--accent)" : "var(--text-soft)",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: "40px", textAlign: "center" }}>Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="dashboard-card">
          <div className="empty-state">No {filter.toLowerCase()} sessions found.</div>
        </div>
      ) : (
        <div className="dashboard-grid dashboard-cards-2">
          {sessions.map((b) => (
            <div className="dashboard-card" key={b.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "17px" }}>Session #{b.id}</h3>
                  <p className="small-muted" style={{ margin: 0 }}>
                    {new Date(b.scheduled_for).toLocaleString()}
                  </p>
                </div>
                <span className={`status-pill ${STATUS_CLASS[b.status] || "pending"}`}>{b.status}</span>
              </div>

              {b.reason && (
                <div className="simple-item" style={{ marginBottom: "14px" }}>
                  <span className="small-muted">Client Note</span>
                  <p style={{ margin: "4px 0 0" }}>{b.reason}</p>
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <Link
                  to={`/counselor/bookings/${b.id}`}
                  className="secondary-btn"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", height: "38px", padding: "0 14px", fontSize: "13px" }}
                >
                  Details
                </Link>

                {b.status === "APPROVED" && (
                  <>
                    <Link
                      to={`/counselor/chat/${b.id}`}
                      className="secondary-btn"
                      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", height: "38px", padding: "0 14px", fontSize: "13px", color: "var(--accent)", borderColor: "rgba(202,163,143,0.3)" }}
                    >
                      Chat
                    </Link>
                    <button
                      type="button"
                      onClick={() => markComplete(b.id)}
                      disabled={acting === b.id}
                      style={{
                        height: "38px", padding: "0 14px", borderRadius: "12px", fontSize: "13px",
                        fontWeight: 600, cursor: "pointer",
                        border: "1px solid rgba(103,213,140,0.3)",
                        background: "rgba(103,213,140,0.1)", color: "#67d58c",
                      }}
                    >
                      {acting === b.id ? "..." : "Mark Complete"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MySessions;
