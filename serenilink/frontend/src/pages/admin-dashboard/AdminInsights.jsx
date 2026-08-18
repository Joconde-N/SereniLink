import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Cell,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import ExportMenu from "../../components/shared/ExportMenu";
import { buildReportPdf } from "../../utils/reportPdf";

const STATUS_COLOR = {
  PENDING:   "#f5c95f",
  APPROVED:  "#67d58c",
  COMPLETED: "#60a5fa",
  CANCELLED: "#9ca3af",
  DECLINED:  "#f08f8f",
};

const SUPPORT_COLOR = { Low: "#67d58c", Moderate: "#f5c95f", High: "#f08f8f" };

function toTitleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function sum(rows) {
  return (rows ?? []).reduce((acc, r) => acc + (r.count ?? 0), 0);
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
  const { user }                = useAuth();
  const [data, setData]         = useState(null);
  const [riskStats, setRiskStats] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [trendKey, setTrendKey] = useState("new_users");

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/admin/insights"),
      api.get("/risk-monitoring/admin/anonymous-stats"),
    ])
      .then(([insightsRes, riskRes]) => {
        setData(insightsRes.data);
        setRiskStats(riskRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "var(--text-muted)", padding: 40 }}>Loading insights...</div>;
  if (!data)   return <div className="empty-state">Failed to load insights.</div>;

  const t  = data.totals ?? {};
  const bs = data.bookings_by_status ?? {};
  const tr = data.trends ?? {};
  const cc = data.content_by_category ?? [];

  const bookingStatusData = Object.entries(bs).map(([name, value]) => ({ name: toTitleCase(name), value, raw: name }));
  const trendData         = tr[trendKey] ?? [];
  const publishRate       = t.content > 0 ? Math.round((t.published_content / t.content) * 100) : 0;
  const supportDist       = riskStats?.support_level_distribution ?? {};
  const screeningStats    = riskStats?.screening_completion ?? {};
  const supportChartData  = Object.entries(supportDist).map(([name, value]) => ({ name, value }));

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
    rows.push(["Content Publish Rate", `${publishRate}%`]);
    rows.push(["Users With Screening Data", riskStats?.total_users_with_data ?? 0]);
    rows.push([]);

    if (riskStats) {
      rows.push(["--- ANONYMOUS SUPPORT LEVEL DISTRIBUTION ---"]);
      rows.push(["Level", "Count"]);
      Object.entries(supportDist).forEach(([k, v]) => rows.push([k, v]));
      rows.push([]);
      rows.push(["--- SCREENING COMPLETION RATES ---"]);
      rows.push(["Metric", "Value"]);
      rows.push(["PHQ-9 Completed", screeningStats.phq9_completed ?? 0]);
      rows.push(["PHQ-9 Rate", `${screeningStats.phq9_rate ?? 0}%`]);
      rows.push(["GAD-7 Completed", screeningStats.gad7_completed ?? 0]);
      rows.push(["GAD-7 Rate", `${screeningStats.gad7_rate ?? 0}%`]);
      rows.push([]);
    }

    rows.push(["--- BOOKINGS BY STATUS ---"]);
    rows.push(["Status", "Count"]);
    Object.entries(bs).forEach(([k, v]) => rows.push([toTitleCase(k), v]));
    rows.push([]);

    rows.push(["--- PUBLISHED CONTENT BY TYPE ---"]);
    rows.push(["Category", "Count"]);
    cc.forEach((r) => rows.push([r.category, r.count]));
    rows.push([]);

    rows.push(["--- 30-DAY TRENDS ---"]);
    rows.push(["Date", "New Users", "New Bookings", "Mood Check-ins", "New Screenings"]);
    const users30      = tr.new_users ?? [];
    const bookings30   = tr.new_bookings ?? [];
    const moods30      = tr.mood_checkins ?? [];
    const screenings30 = tr.new_screenings ?? [];
    users30.forEach((row, i) => {
      rows.push([row.date, row.count, bookings30[i]?.count ?? 0, moods30[i]?.count ?? 0, screenings30[i]?.count ?? 0]);
    });
    rows.push([
      "Total",
      sum(users30), sum(bookings30), sum(moods30), sum(screenings30),
    ]);

    const csv  = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `serenilink-insights-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePDF = () => {
    const users30      = tr.new_users ?? [];
    const bookings30   = tr.new_bookings ?? [];
    const moods30      = tr.mood_checkins ?? [];
    const screenings30 = tr.new_screenings ?? [];

    const periodStart = users30[0]?.date ? fmtDate(users30[0].date) : null;
    const periodEnd   = users30[users30.length - 1]?.date ? fmtDate(users30[users30.length - 1].date) : null;

    const sections = [
      {
        title: "Summary Totals",
        columns: ["Metric", "Value"],
        rows: [
          ["Total Users", t.users ?? 0],
          ["Total Counselors", t.counselors ?? 0],
          ["Total Bookings", t.bookings ?? 0],
          ["Total Assessments", t.assessments ?? 0],
          ["Content Publish Rate", `${publishRate}%`],
          ["Users With Screening Data", riskStats?.total_users_with_data ?? 0],
        ],
        columnStyles: { 1: { halign: "right" } },
      },
    ];

    if (riskStats) {
      sections.push({
        title: "Anonymous Support Level Distribution",
        note: "Aggregate wellness indicators only — no individual user data.",
        columns: ["Support Level", "Users"],
        rows: Object.entries(supportDist).map(([k, v]) => [k, v]),
        columnStyles: { 1: { halign: "right" } },
      });
      sections.push({
        title: "Screening Completion Rates",
        columns: ["Metric", "Value"],
        rows: [
          ["PHQ-9 Completed", screeningStats.phq9_completed ?? 0],
          ["PHQ-9 Rate", `${screeningStats.phq9_rate ?? 0}%`],
          ["GAD-7 Completed", screeningStats.gad7_completed ?? 0],
          ["GAD-7 Rate", `${screeningStats.gad7_rate ?? 0}%`],
        ],
        columnStyles: { 1: { halign: "right" } },
      });
    }

    sections.push({
      title: "Bookings by Status",
      columns: ["Status", "Count"],
      rows: Object.entries(bs).map(([k, v]) => [toTitleCase(k), v]),
      columnStyles: { 1: { halign: "right" } },
    });

    sections.push({
      title: "Published Content by Type",
      columns: ["Category", "Count"],
      rows: cc.map((r) => [r.category, r.count]),
      columnStyles: { 1: { halign: "right" } },
    });

    sections.push({
      title: "30-Day Trends",
      note: periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : undefined,
      columns: ["Date", "New Users", "New Bookings", "Mood Check-ins", "New Screenings"],
      rows: [
        ...users30.map((row, i) => [
          fmtDate(row.date), row.count, bookings30[i]?.count ?? 0, moods30[i]?.count ?? 0, screenings30[i]?.count ?? 0,
        ]),
        ["Total", sum(users30), sum(bookings30), sum(moods30), sum(screenings30)],
      ],
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
      boldLastRow: true,
    });

    const doc = buildReportPdf({
      title: "Platform Insights Report",
      subtitle: "Anonymous platform metrics only — individual mental health data is never shown.",
      generatedBy: user?.nickname || user?.email,
      filters: [
        "Totals & distributions: all-time",
        `Trends: last 30 days${periodStart && periodEnd ? ` (${periodStart} – ${periodEnd})` : ""}`,
        "Support-level data: anonymous aggregates only",
      ],
      sections,
      disclaimer:
        "Support-level figures are aggregate wellness indicators derived from anonymized screening and mood data. " +
        "They are not a clinical diagnosis and no individual user data is included in this report.",
      footerNote: "SereniLink — confidential platform insights report",
    });

    doc.save(`serenilink-insights-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const TREND_TABS = [
    { key: "new_users",      label: "New Users",      color: "#60a5fa" },
    { key: "new_bookings",   label: "Bookings",       color: "#67d58c" },
    { key: "mood_checkins",  label: "Mood Check-ins", color: "#E19A86" },
    { key: "new_screenings", label: "Screenings",     color: "#a78bfa" },
  ];
  const activeTrend = TREND_TABS.find((tab) => tab.key === trendKey);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <h1 className="dashboard-page-title" style={{ margin: 0 }}>Platform Insights</h1>
        <ExportMenu onCsv={generateCSV} onPdf={generatePDF} />
      </div>
      <p className="dashboard-page-subtitle">
        Anonymous platform metrics only — individual mental health data is never shown.
      </p>

      <div className="dashboard-grid dashboard-cards-4" style={{ marginBottom: 20 }}>
        <SummaryCard title="Total Users" value={t.users} />
        <SummaryCard title="Total Counselors" value={t.counselors} color="#60a5fa" />
        <SummaryCard title="Total Bookings" value={t.bookings} />
        <SummaryCard title="Total Assessments" value={t.assessments} color="var(--accent)" />
      </div>

      <div className="dashboard-grid dashboard-cards-2" style={{ marginBottom: 28 }}>
        <SummaryCard
          title="Content Publish Rate"
          value={`${publishRate}%`}
          color={publishRate >= 70 ? "#67d58c" : "#f5c95f"}
        />
        <SummaryCard
          title="Users With Screening Data"
          value={riskStats?.total_users_with_data ?? 0}
          color="#60a5fa"
        />
      </div>

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

        <ChartCard title="Support Level Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={supportChartData} barSize={48} style={CHART_STYLE}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: "#b8bfcc", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#b8bfcc", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive>
                {supportChartData.map((entry) => (
                  <Cell key={entry.name} fill={SUPPORT_COLOR[entry.name] ?? "#b8bfcc"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
            Aggregate wellness indicators only — no individual user data.
          </p>
        </ChartCard>
      </div>

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
