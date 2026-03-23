import React, { useEffect, useState } from "react";
import api from "../../api/axios";

function MyAvailability() {
  const [slots, setSlots]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [form, setForm]         = useState({ start_time: "", end_time: "" });
  const [saving, setSaving]     = useState(false);
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

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.start_time || !form.end_time) { setError("Both start and end time are required."); return; }
    if (new Date(form.end_time) <= new Date(form.start_time)) { setError("End time must be after start time."); return; }
    setSaving(true);
    try {
      await api.post("/availability/me", {
        start_time: new Date(form.start_time).toISOString(),
        end_time:   new Date(form.end_time).toISOString(),
      });
      setSuccess("Slot created successfully!");
      setForm({ start_time: "", end_time: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create slot.");
    } finally {
      setSaving(false);
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
        {/* Create Form */}
        <div className="dashboard-card">
          <h3>Add New Slot</h3>
          {error   && <p style={{ color: "#f08f8f", fontSize: "13px", marginBottom: "10px" }}>{error}</p>}
          {success && <p style={{ color: "#67d58c", fontSize: "13px", marginBottom: "10px" }}>{success}</p>}

          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: "16px" }}>
              <label className="form-label">Start Time</label>
              <input
                className="form-input"
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label className="form-label">End Time</label>
              <input
                className="form-input"
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                required
              />
            </div>
            <button className="primary-btn" type="submit" disabled={saving} style={{ width: "100%" }}>
              {saving ? "Creating..." : "Create Slot"}
            </button>
          </form>
        </div>

        {/* Summary */}
        <div className="dashboard-card">
          <h3>Slot Summary</h3>
          <div className="list-stack">
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Total Slots</span>
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>{slots.length}</span>
            </div>
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Available</span>
              <span style={{ color: "#67d58c", fontWeight: 700 }}>{available}</span>
            </div>
            <div className="simple-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Booked</span>
              <span style={{ color: "#f5c95f", fontWeight: 700 }}>{booked}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slot List */}
      <div className="dashboard-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0 }}>All Slots</h3>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: "160px" }}
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="BOOKED">Booked</option>
          </select>
        </div>

        {loading ? (
          <div style={{ color: "var(--text-muted)", padding: "30px", textAlign: "center" }}>Loading slots...</div>
        ) : slots.length === 0 ? (
          <div className="empty-state">No slots found. Create your first availability slot above.</div>
        ) : (
          <div className="list-stack">
            {slots.map((s) => (
              <div key={s.id} className="simple-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    {new Date(s.start_time).toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                  <p className="small-muted" style={{ margin: "4px 0 0" }}>
                    {new Date(s.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {new Date(s.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 600,
                    background: s.status === "AVAILABLE" ? "rgba(103,213,140,0.1)" : "rgba(245,201,95,0.1)",
                    color: s.status === "AVAILABLE" ? "#67d58c" : "#f5c95f",
                  }}>
                    {s.status}
                  </span>
                  {s.status === "AVAILABLE" && (
                    <button
                      className="secondary-btn"
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      disabled={deleting === s.id}
                      style={{ height: "36px", padding: "0 14px", fontSize: "13px", color: "#f08f8f", borderColor: "rgba(240,143,143,0.3)" }}
                    >
                      {deleting === s.id ? "..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAvailability;
