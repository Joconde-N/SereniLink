import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Cell,
} from "recharts";

const STATUS_COLOR = {
  PENDING:   "#f5c95f",
  APPROVED:  "#67d58c",
  COMPLETED: "#60a5fa",
  CANCELLED: "#9ca3af",
  DECLINED:  "#f08f8f",
};

const PAYMENT_COLOR = {
  PENDING: "#f5c95f",
  PAID:    "#67d58c",
  WAIVED:  "#caa38f",
};

function toTitleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const CHART_STYLE = {
  fontSize: 11,
  color: "var(--text-muted)",
};

const tooltipStyle = {
  contentStyle: { background: "#1a1a1d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 },
  labelStyle: { color: "#b8bfcc" },
  itemStyle: { color: "#ffffff" },
  cursor: { fill: "rgba(255,255,255,0.04)" },
};

function SummaryCard({ title, value, color }) {
  return (
    <div className="dashboard-card">
      <p className="metric-label" style={{ marginBottom: 8 }}>{title}</p>
      <div className="metric-value" style={color ? { color } : {}}>{value ?? "—"}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="dashboard-card">
      <h3 style={{ margin: "0 0 20px", fontSize: 15, color: "var(--text-main)" }}>{title}</h3>
      {children}
    </div>
  );
}

function fmtDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function tickFormatter(val, index) {
  return index % 5 === 0 ? fmtDate(val) : "";
}

function AdminInsights() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [trendKey, setTrendKey] = useState("new_users");

  useEffect(() => {
    api.get("/dashboard/admin/insights")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "var(--text-muted)", padding: 40 }}>Loading insights...</div>;
  if (!data)   return <div className="empty-state">Failed to load insights.</div>;

  const t  = data.totals ?? {};
  const bs = data.bookings_by_status ?? {};
  const bp = data.bookings_by_payment_status ?? {};
  const tr = data.trends ?? {};
  const cc = data.content_by_category ?? [];

  const bookingStatusData = Object.entries(bs).map(([name, value]) => ({ name: toTitleCase(name), value, raw: name }));
  const paymentStatusData = Object.entries(bp).map(([name, value]) => ({ name: toTitleCase(name), value, raw: name }));
  const trendData         = tr[trendKey] ?? [];
  const publishRate       = t.content > 0 ? Math.round((t.published_content / t.content) * 100) : 0;

  const generateCSV = () => {
    const rows = [];

    rows.push(["SERENILINK PLATFORM INSIGHTS REPORT"]);
    rows.push([`Generated: ${new Date().toLocaleString()}`]);
    rows.push([]);

    rows.push(["--- SUMMARY TOTALS ---"]);
    rows.push(["Metric", "Value"]);
    rows.push(["Total Users", t.users ?? 0]);
    rows.push(["Total Counselors", t.counselors ?? 0]);
    rows.push(["Total Bookings", t.bookings ?? 0]);
    rows.push(["Total Assessments", t.assessments ?? 0]);
    rows.push(["Total Content", t.content ?? 0]);
    rows.push(["Published Content", t.published_content ?? 0]);
    rows.push(["Content Publish Rate", `${publishRate}%`]);
    rows.push(["Mood Entries", t.mood_entries ?? 0]);
    rows.push([]);

    rows.push(["--- BOOKINGS BY STATUS ---"]);
    rows.push(["Status", "Count"]);
    Object.entries(bs).forEach(([k, v]) => rows.push([toTitleCase(k), v]));
    rows.push([]);

    rows.push(["--- BOOKINGS BY PAYMENT STATUS ---"]);
    rows.push(["Payment Status", "Count"]);
    Object.entries(bp).forEach(([k, v]) => rows.push([toTitleCase(k), v]));
    rows.push([]);

    rows.push(["--- PUBLISHED CONTENT BY TYPE ---"]);
    rows.push(["Category", "Count"]);
    cc.forEach((r) => rows.push([r.category, r.count]));
    rows.push([]);

    rows.push(["--- 30-DAY TRENDS ---"]);
    rows.push(["Date", "New Users", "New Bookings", "Mood Check-ins"]);
    const users30    = tr.new_users ?? [];
    const bookings30 = tr.new_bookings ?? [];
    const moods30    = tr.mood_checkins ?? [];
    users30.forEach((row, i) => {
      rows.push([row.date, row.count, bookings30[i]?.count ?? 0, moods30[i]?.count ?? 0]);
    });

    const csv  = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `serenilink-insights-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const TREND_TABS = [
    { key: "new_users",     label: "New Users",      color: "#60a5fa" },
    { key: "new_bookings",  label: "Bookings",       color: "#67d58c" },
    { key: "mood_checkins", label: "Mood Check-ins", color: "#E19A86" },
  ];
  const activeTrend = TREND_TABS.find((tab) => tab.key === trendKey);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <h1 className="dashboard-page-title" style={{ margin: 0 }}>Platform Insights</h1>
        <button
          onClick={generateCSV}
          style={{
            padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: "1px solid rgba(225,154,134,0.3)", background: "rgba(225,154,134,0.08)",
            color: "var(--accent)", whiteSpace: "nowrap",
          }}
        >
          Export CSV
        </button>
      </div>
      <p className="dashboard-page-subtitle">Real-time metrics and reporting across the entire platform.</p>

      {/* Summary Cards */}
      <div className="dashboard-grid dashboard-cards-4" style={{ marginBottom: 28 }}>
        <SummaryCard title="Total Users"          value={t.users} />
        <SummaryCard title="Total Counselors"     value={t.counselors}        color="#60a5fa" />
        <SummaryCard title="Total Bookings"       value={t.bookings} />
        <SummaryCard title="Published Content"    value={t.published_content} color="#67d58c" />
        <SummaryCard title="Total Assessments"    value={t.assessments}       color="var(--accent)" />
        <SummaryCard title="Mood Entries"         value={t.mood_entries}      color="var(--accent)" />
        <SummaryCard title="Content Publish Rate" value={`${publishRate}%`}   color={publishRate >= 70 ? "#67d58c" : "#f5c95f"} />
      </div>

      {/* Row 1: Booking Status + Payment Status */}
      <div className="dashboard-grid dashboard-cards-2" style={{ marginBottom: 24 }}>
        <ChartCard title="Bookings by Status">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bookingStatusData} barSize={32} style={CHART_STYLE}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: "#b8bfcc", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#b8bfcc", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive>
                {bookingStatusData.map((entry) => (
                  <Cell key={entry.raw} fill={STATUS_COLOR[entry.raw] ?? "#b8bfcc"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
            {bookingStatusData.map((e) => (
              <span key={e.raw} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-soft)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLOR[e.raw] ?? "#b8bfcc", display: "inline-block" }} />
                {e.name}
              </span>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Bookings by Payment Status">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={paymentStatusData} barSize={48} style={CHART_STYLE}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: "#b8bfcc", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#b8bfcc", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive>
                {paymentStatusData.map((entry) => (
                  <Cell key={entry.raw} fill={PAYMENT_COLOR[entry.raw] ?? "#b8bfcc"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
            {paymentStatusData.map((e) => (
              <span key={e.raw} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-soft)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: PAYMENT_COLOR[e.raw] ?? "#b8bfcc", display: "inline-block" }} />
                {e.name}
              </span>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Row 2: Trends + Content by Type */}
      <div className="dashboard-grid dashboard-cards-2" style={{ marginBottom: 24 }}>
        <ChartCard title="30-Day Trends">
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {TREND_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTrendKey(tab.key)}
                style={{
                  padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: trendKey === tab.key ? "none" : "1px solid var(--border-soft)",
                  background: trendKey === tab.key ? tab.color : "transparent",
                  color: trendKey === tab.key ? "#111" : "var(--text-soft)",
                }}
              >{tab.label}</button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} style={CHART_STYLE}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tickFormatter={tickFormatter} tick={{ fill: "#b8bfcc", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#b8bfcc", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...tooltipStyle} labelFormatter={fmtDate} />
              <Line
                type="monotone" dataKey="count"
                stroke={activeTrend?.color ?? "var(--accent)"}
                strokeWidth={2} dot={false} activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Published Content by Type">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cc} barSize={48} layout="vertical" style={CHART_STYLE}>
              <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fill: "#b8bfcc", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="category" tick={{ fill: "#b8bfcc", fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" fill="var(--accent)" radius={[0, 6, 6, 0]} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

export default AdminInsights;
