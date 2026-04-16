import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { LuEye, LuCheck, LuX, LuDownload, LuFileText } from "react-icons/lu";

const BASE_URL = "http://localhost:8000";

// Use protected /files/ endpoint instead of public /uploads/
function toProtectedUrl(uploadPath) {
  // uploadPath is like /uploads/applications/certifications/abc.pdf
  // convert to /files/applications/certifications/abc.pdf
  return `${BASE_URL}/files${uploadPath.replace("/uploads", "")}`;
}

const STATUS_STYLE = {
  PENDING:  { color: "#f5c95f", bg: "rgba(245,201,95,0.1)"  },
  APPROVED: { color: "#67d58c", bg: "rgba(103,213,140,0.1)" },
  REJECTED: { color: "#f08f8f", bg: "rgba(240,143,143,0.1)" },
};

const TABS = ["ALL", "PENDING", "APPROVED", "REJECTED"];

function tabLabel(t) {
  return t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase();
}

function Badge({ value }) {
  const s = STATUS_STYLE[value] ?? STATUS_STYLE.PENDING;
  return (
    <span style={{ padding: "3px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: s.color, background: s.bg }}>
      {tabLabel(value)}
    </span>
  );
}

function SectionBox({ title, children }) {
  return (
    <div style={{ border: "1px solid var(--border-faint)", borderRadius: 10, padding: "16px 18px", marginBottom: 14 }}>
      <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Field({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 14, color: "var(--text-main)", lineHeight: 1.6 }}>{value}</div>
    </div>
  );
}

function TwoCol({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>{children}</div>;
}

function ThreeCol({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 20px" }}>{children}</div>;
}

function CertFile({ url, index }) {
  const filename = url.split("/").pop();
  const isPdf    = filename.toLowerCase().endsWith(".pdf");
  return (
    <a
      href={toProtectedUrl(url)}
      target="_blank"
      rel="noreferrer"
      download
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-faint)", background: "rgba(255,255,255,0.02)", textDecoration: "none", color: "var(--text-main)", fontSize: 13, marginBottom: 8 }}
    >
      <LuFileText size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {isPdf ? `Certificate ${index + 1}.pdf` : `Certificate ${index + 1}`}
      </span>
      <LuDownload size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
    </a>
  );
}

function DetailsModal({ app, onClose, onAction, acting }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", padding: 20 }}>
      <style>{`
        .modal-body::-webkit-scrollbar { width: 4px; }
        .modal-body::-webkit-scrollbar-track { background: transparent; }
        .modal-body::-webkit-scrollbar-thumb { background: rgba(202,163,143,0.35); border-radius: 999px; }
        .modal-body::-webkit-scrollbar-thumb:hover { background: rgba(202,163,143,0.6); }
      `}</style>
      <div style={{ width: "100%", maxWidth: 660, maxHeight: "90vh", background: "#111214", borderRadius: 14, border: "1px solid var(--border-faint)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid var(--border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {app.profile_image_url ? (
              <img
                src={`${BASE_URL}${app.profile_image_url}`}
                alt={app.full_name}
                style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border-faint)", flexShrink: 0 }}
              />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(225,154,134,0.15)", border: "2px solid var(--border-faint)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "var(--accent)", flexShrink: 0 }}>
                {app.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 style={{ margin: "0 0 3px", fontSize: 18 }}>{app.full_name}</h2>
              {app.title && <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>{app.title}</p>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Badge value={app.status} />
            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-soft)", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 0 }}>✕</button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="modal-body" style={{ padding: "18px 24px 8px", overflowY: "auto", flex: 1, scrollbarWidth: "thin", scrollbarColor: "rgba(202,163,143,0.35) transparent" }}>

          <SectionBox title="Contact">
            <TwoCol>
              <Field label="Email"          value={app.email} />
              <Field label="Phone"          value={app.phone_number} />
              <Field label="Location"       value={app.general_location} />
              <Field label="Office Address" value={app.office_address} />
            </TwoCol>
          </SectionBox>

          <SectionBox title="Professional">
            <TwoCol>
              <Field label="Specialization"      value={app.specialization} />
              <Field label="Years of Experience" value={app.years_of_experience ? `${app.years_of_experience} years` : null} />
              <Field label="Languages Offered"   value={app.languages_offered} />
            </TwoCol>
            <Field label="Bio"                 value={app.bio} />
            <Field label="Counseling Approach" value={app.counseling_approach} />
          </SectionBox>

          <SectionBox title="Session Preferences">
            <ThreeCol>
              <Field label="Online Sessions"    value={app.offers_online ? "Yes" : "No"} />
              <Field label="In-Person Sessions" value={app.offers_in_person ? "Yes" : "No"} />
              <Field label="Preferred Type"     value={app.preferred_session_type} />
              <Field label="Preferred Duration" value={app.preferred_duration} />
            </ThreeCol>
          </SectionBox>

          <SectionBox title="Credentials">
            <TwoCol>
              <Field label="Highest Certification" value={app.highest_certification} />
              <Field label="Issuing Institution"   value={app.issuing_institution} />
            </TwoCol>
            {app.certification_urls && app.certification_urls.length > 0 ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Uploaded Certificates</div>
                {app.certification_urls.map((url, i) => (
                  <CertFile key={i} url={url} index={i} />
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)" }}>
                No certification documents uploaded.
              </div>
            )}
          </SectionBox>

          <SectionBox title="Application Info">
            <TwoCol>
              <Field label="Applied On"   value={new Date(app.created_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })} />
              {app.reviewed_at && <Field label="Reviewed On" value={new Date(app.reviewed_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })} />}
            </TwoCol>
          </SectionBox>
        </div>

        {/* Footer — rounded buttons, only for PENDING */}
        {app.status === "PENDING" && (
          <div style={{ padding: "16px 24px 20px", borderTop: "1px solid var(--border-faint)", display: "flex", gap: 12, flexShrink: 0 }}>
            <button
              disabled={!!acting}
              onClick={() => onAction(app.id, "approve")}
              style={{ flex: 1, height: 44, borderRadius: 999, border: "1px solid rgba(103,213,140,0.4)", background: "rgba(103,213,140,0.08)", color: "#67d58c", fontWeight: 700, fontSize: 14, cursor: acting ? "not-allowed" : "pointer", opacity: acting ? 0.6 : 1 }}
            >
              {acting === "approve" ? "Approving…" : "✓  Approve"}
            </button>
            <button
              disabled={!!acting}
              onClick={() => onAction(app.id, "reject")}
              style={{ flex: 1, height: 44, borderRadius: 999, border: "1px solid rgba(240,143,143,0.4)", background: "rgba(240,143,143,0.08)", color: "#f08f8f", fontWeight: 700, fontSize: 14, cursor: acting ? "not-allowed" : "pointer", opacity: acting ? 0.6 : 1 }}
            >
              {acting === "reject" ? "Rejecting…" : "✕  Reject"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CounselorApplications() {
  const [all, setAll]           = useState([]);
  const [tab, setTab]           = useState("PENDING");
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState("");
  const [selected, setSelected] = useState(null);
  const [acting, setActing]     = useState(null);

  const load = (status) => {
    setLoading(true);
    const params = status !== "ALL" ? { status } : {};
    api.get("/counselor-applications/", { params })
      .then((r) => setAll(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(tab); }, [tab]);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(""), 3500); };

  const handleAction = (id, action) => {
    setActing(action);
    api.patch(`/counselor-applications/${id}/${action}`)
      .then((r) => {
        setAll((prev) => prev.map((a) => a.id === id ? r.data : a));
        setSelected((prev) => prev?.id === id ? r.data : prev);
        flash(`Application ${action}d successfully.`);
      })
      .catch((e) => flash(e?.response?.data?.detail ?? "Action failed."))
      .finally(() => setActing(null));
  };

  return (
    <div>
      <h1 className="dashboard-page-title">Counselor Applications</h1>
      <p className="dashboard-page-subtitle">Review and approve or reject counselor applications.</p>

      {msg && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(103,213,140,0.1)", color: "#67d58c", border: "1px solid rgba(103,213,140,0.2)" }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", border: tab === t ? "none" : "1px solid var(--border-soft)", background: tab === t ? "var(--accent)" : "transparent", color: tab === t ? "#111" : "var(--text-soft)" }}>
            {tabLabel(t)}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: 40 }}>Loading…</div>
      ) : all.length === 0 ? (
        <div className="empty-state">No {tabLabel(tab).toLowerCase()} applications.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-faint)" }}>
                {["Applicant", "Specialization", "Date Applied", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {all.map((app) => {
                const ss = STATUS_STYLE[app.status] ?? STATUS_STYLE.PENDING;
                return (
                  <tr
                    key={app.id}
                    style={{ borderBottom: "1px solid var(--border-faint)", transition: "background 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "14px" }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{app.full_name}</p>
                      {app.title && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>{app.title}</p>}
                    </td>
                    <td style={{ padding: "14px", color: "var(--text-soft)", fontSize: 13 }}>{app.specialization}</td>
                    <td style={{ padding: "14px", color: "var(--text-muted)", fontSize: 13, whiteSpace: "nowrap" }}>
                      {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td style={{ padding: "14px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: ss.color, background: ss.bg }}>
                        {tabLabel(app.status)}
                      </span>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          title="View Application Details"
                          onClick={() => setSelected(app)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border-soft)", background: "transparent", color: "var(--text-soft)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <LuEye size={15} />
                        </button>
                        {app.status === "PENDING" && (
                          <>
                            <button
                              title="Approve"
                              onClick={() => handleAction(app.id, "approve")}
                              style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #67d58c", background: "transparent", color: "#67d58c", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <LuCheck size={15} />
                            </button>
                            <button
                              title="Reject"
                              onClick={() => handleAction(app.id, "reject")}
                              style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #f08f8f", background: "transparent", color: "#f08f8f", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <LuX size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailsModal
          app={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
          acting={acting}
        />
      )}
    </div>
  );
}

export default CounselorApplications;
