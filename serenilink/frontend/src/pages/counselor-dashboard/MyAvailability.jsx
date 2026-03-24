import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import api from "../../api/axios";

// Format date as local time string without UTC conversion e.g. "2024-06-15T09:00:00"
const toNaiveISO = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
};

const EMPTY = { date: null, start: null, end: null };

function SlotForm({ initial = EMPTY, onSave, onCancel, saving, label, error }) {
  const [f, setF] = useState(initial);

  // When a date is picked, keep the time parts from existing start/end if any
  const setDate = (d) => setF((p) => {
    const applyDate = (t) => {
      if (!t) return null;
      const n = new Date(t);
      n.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
      return n;
    };
    return { date: d, start: applyDate(p.start), end: applyDate(p.end) };
  });

  const setStart = (t) => {
    if (!f.date || !t) { setF((p) => ({ ...p, start: t })); return; }
    const n = new Date(f.date);
    n.setHours(t.getHours(), t.getMinutes(), 0, 0);
    setF((p) => ({ ...p, start: n }));
  };

  const setEnd = (t) => {
    if (!f.date || !t) { setF((p) => ({ ...p, end: t })); return; }
    const n = new Date(f.date);
    n.setHours(t.getHours(), t.getMinutes(), 0, 0);
    setF((p) => ({ ...p, end: n }));
  };

  const submit = (e) => {
    e.preventDefault();
    onSave(f);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <form onSubmit={submit}>
      {error && <p style={{ color: "#f08f8f", fontSize: "13px", marginBottom: "10px" }}>{error}</p>}

      <div style={{ marginBottom: "14px" }}>
        <label className="form-label">Date</label>
        <DatePicker
          selected={f.date}
          onChange={setDate}
          minDate={today}
          dateFormat="MMMM d, yyyy"
          placeholderText="Pick a date"
          className="form-input"
          wrapperClassName="datepicker-full"
          required
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        <div>
          <label className="form-label">Start Time</label>
          <DatePicker
            selected={f.start}
            onChange={setStart}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            timeCaption="Start"
            dateFormat="h:mm aa"
            placeholderText="Pick start time"
            className="form-input"
            wrapperClassName="datepicker-full"
            disabled={!f.date}
            required
          />
        </div>
        <div>
          <label className="form-label">End Time</label>
          <DatePicker
            selected={f.end}
            onChange={setEnd}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            timeCaption="End"
            dateFormat="h:mm aa"
            placeholderText="Pick end time"
            className="form-input"
            wrapperClassName="datepicker-full"
            disabled={!f.date}
            required
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button className="primary-btn" type="submit" disabled={saving} style={{ flex: 1 }}>
          {saving ? "Saving..." : label}
        </button>
        {onCancel && (
          <button className="secondary-btn" type="button" onClick={onCancel} style={{ flex: 1 }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function MyAvailability() {
  const [slots, setSlots]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [formError, setFormError]   = useState("");
  const [success, setSuccess]       = useState("");
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(null);
  const [editingId, setEditingId]   = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = () => {
    setLoading(true);
    const params = { limit: 100 };
    if (filterStatus) params.status = filterStatus;
    api.get("/availability/me", { params })
      .then((res) => setSlots(res.data))
      .catch(() => setError("Failed to load slots."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus]);

  const validate = (f) => {
    if (!f.date || !f.start || !f.end) return "Please pick a date, start time, and end time.";
    if (f.end <= f.start) return "End time must be after start time.";
    return null;
  };

  const handleCreate = async (f) => {
    setFormError(""); setSuccess("");
    const err = validate(f);
    if (err) { setFormError(err); return; }
    setSaving(true);
    try {
      await api.post("/availability/me", {
        start_time: toNaiveISO(f.start),
        end_time:   toNaiveISO(f.end),
      });
      setSuccess("Slot created!");
      load();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to create slot.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id, f) => {
    setEditError("");
    const err = validate(f);
    if (err) { setEditError(err); return; }
    setEditSaving(true);
    try {
      await api.patch(`/availability/me/${id}`, {
        start_time: toNaiveISO(f.start),
        end_time:   toNaiveISO(f.end),
      });
      setSuccess("Slot updated!");
      setEditingId(null);
      load();
    } catch (err) {
      setEditError(err.response?.data?.detail || "Failed to update slot.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this slot?")) return;
    setDeleting(id);
    try {
      await api.delete(`/availability/me/${id}`);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || "Cannot delete this slot.");
    } finally {
      setDeleting(null);
    }
  };

  const available = slots.filter((s) => s.status === "AVAILABLE").length;
  const booked    = slots.filter((s) => s.status === "BOOKED").length;

  return (
    <div>
      <h1 className="dashboard-page-title">My Availability</h1>
      <p className="dashboard-page-subtitle">Manage your available time slots for client bookings.</p>

      <div className="dashboard-grid dashboard-cards-2" style={{ marginBottom: "20px" }}>
        <div className="dashboard-card">
          <h3>Add New Slot</h3>
          {success && <p style={{ color: "#67d58c", fontSize: "13px", marginBottom: "10px" }}>{success}</p>}
          <SlotForm onSave={handleCreate} saving={saving} label="Create Slot" error={formError} />
        </div>

        <div className="dashboard-card">
          <h3>Slot Summary</h3>
          <div className="list-stack">
            {[["Total Slots", slots.length, "var(--accent)"], ["Available", available, "#67d58c"], ["Booked", booked, "#f5c95f"]].map(([lbl, val, color]) => (
              <div key={lbl} className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{lbl}</span>
                <span style={{ color, fontWeight: 600, fontSize: "16px" }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0 }}>All Slots</h3>
          <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: "160px" }}>
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="BOOKED">Booked</option>
          </select>
        </div>

        {error && <p style={{ color: "#f08f8f", fontSize: "13px", marginBottom: "10px" }}>{error}</p>}

        {loading ? (
          <div style={{ color: "var(--text-muted)", padding: "30px", textAlign: "center" }}>Loading slots...</div>
        ) : slots.length === 0 ? (
          <div className="empty-state">No slots found. Create your first availability slot above.</div>
        ) : (
          <div className="list-stack">
            {slots.map((s) => {
              const startDate = new Date(s.start_time);
              const endDate   = new Date(s.end_time);
              const isEditing = editingId === s.id;

              return (
                <div key={s.id} className="simple-item" style={{ flexDirection: "column", alignItems: "stretch", gap: "10px", fontSize: "14px"}}>
                  {isEditing ? (
                    <>
                      <p style={{ margin: 0, fontWeight: 600, marginBottom: "6px" }}>Edit Slot</p>
                      <SlotForm
                        initial={{ date: startDate, start: startDate, end: endDate }}
                        onSave={(f) => handleEdit(s.id, f)}
                        onCancel={() => { setEditingId(null); setEditError(""); }}
                        saving={editSaving}
                        label="Save Changes"
                        error={editError}
                      />
                    </>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>
                          {startDate.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                        <p className="small-muted" style={{ margin: "4px 0 0" }}>
                          {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {" – "}
                          {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{
                          padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 600,
                          background: s.status === "AVAILABLE" ? "rgba(103,213,140,0.1)" : "rgba(245,201,95,0.1)",
                          color: s.status === "AVAILABLE" ? "#67d58c" : "#f5c95f",
                        }}>
                          {s.status}
                        </span>
                        {s.status === "AVAILABLE" && (
                          <>
                            <button
                              className="secondary-btn"
                              type="button"
                              onClick={() => { setEditError(""); setEditingId(s.id); }}
                              style={{ height: "36px", padding: "0 14px", fontSize: "13px" }}
                            >
                              Edit
                            </button>
                            <button
                              className="secondary-btn"
                              type="button"
                              onClick={() => handleDelete(s.id)}
                              disabled={deleting === s.id}
                              style={{ height: "36px", padding: "0 14px", fontSize: "13px", color: "#f08f8f", borderColor: "rgba(240,143,143,0.3)" }}
                            >
                              {deleting === s.id ? "..." : "Delete"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAvailability;
