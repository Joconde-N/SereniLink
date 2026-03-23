import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const STATUS_CLASS = { PENDING: "pending", APPROVED: "approved", REJECTED: "cancelled" };

const TABS = ["ALL", "PENDING", "APPROVED", "REJECTED"];

function ApplicationCard({ app, onAction }) {
  return (
    <div className="dashboard-card" style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>{app.full_name}</h3>
            <span className={`status-pill ${STATUS_CLASS[app.status] ?? "pending"}`}>
              {app.status}
            </span>
          </div>
          {app.title && <p className="small-muted" style={{ margin: "0 0 4px" }}>{app.title}</p>}
          <p style={{ margin: "0 0 4px", color: "var(--accent)", fontSize: "14px" }}>{app.specialization}</p>
          {app.bio && <p className="small-muted" style={{ margin: "0 0 8px" }}>{app.bio}</p>}

          <div className="form-grid-2" style={{ gap: "8px", marginTop: "8px" }}>
            {app.general_location && (
              <p className="small-muted" style={{ margin: 0 }}>📍 {app.general_location}</p>
            )}
            {app.phone_number && (
              <p className="small-muted" style={{ margin: 0 }}>📞 {app.phone_number}</p>
            )}
            {app.office_address && (
              <p className="small-muted" style={{ margin: 0 }}>🏢 {app.office_address}</p>
            )}
            <p className="small-muted" style={{ margin: 0 }}>
              {app.offers_online ? "✅ Online" : "❌ Online"} &nbsp;
              {app.offers_in_person ? "✅ In-person" : "❌ In-person"}
            </p>
          </div>
          <p className="small-muted" style={{ margin: "8px 0 0", fontSize: "12px" }}>
            Submitted: {new Date(app.created_at).toLocaleString()} · Email: {app.email}
          </p>
        </div>

      {app.status === "PENDING" && (
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button className="primary-btn" style={{ height: "38px", padding: "0 16px", fontSize: "13px" }} onClick={() => onAction(app.id, "approve")}>
              Approve
            </button>
            <button className="secondary-btn" style={{ height: "38px", padding: "0 16px", fontSize: "13px", color: "#f08f8f", borderColor: "rgba(239,68,68,0.3)" }} onClick={() => onAction(app.id, "reject")}>
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CounselorApplications() {
  const [all, setAll]         = useState([]);
  const [tab, setTab]         = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState("");

  const load = (status) => {
    setLoading(true);
    const params = status !== "ALL" ? { status } : {};
    api.get("/counselor-applications/", { params })
      .then((r) => setAll(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(tab); }, [tab]);

  const handleAction = (id, action) => {
    api.patch(`/counselor-applications/${id}/${action}`)
      .then((r) => {
        setAll((prev) => prev.map((a) => a.id === id ? r.data : a));
        setMsg(`Application ${action}d.`);
        setTimeout(() => setMsg(""), 3000);
      })
      .catch((e) => setMsg(e?.response?.data?.detail ?? "Action failed."));
  };

  const filtered = all;

  return (
    <div>
      <h1 className="dashboard-page-title">Counselor Applications</h1>
      <p className="dashboard-page-subtitle">Review and approve or reject counselor applications.</p>

      {msg && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px", background: "rgba(103,213,140,0.1)", color: "#67d58c", border: "1px solid rgba(103,213,140,0.2)" }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 18px", borderRadius: "999px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              border: tab === t ? "none" : "1px solid var(--border-soft)",
              background: tab === t ? "var(--accent)" : "transparent",
              color: tab === t ? "#111" : "var(--text-soft)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: "40px" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          {tab === "PENDING" ? "No pending applications." : `No ${tab.toLowerCase()} applications to show.`}
        </div>
      ) : (
        filtered.map((a) => (
          <ApplicationCard key={a.id} app={a} onAction={handleAction} />
        ))
      )}
    </div>
  );
}

export default CounselorApplications;
