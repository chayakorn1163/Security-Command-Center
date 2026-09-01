"use client";

import { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import "@/lib/chartSetup";
import { SITE_TARGETS } from "@/lib/constants";

const EMPTY_SITE = { present: 0, absent: 0, billable: 0, deduct: 0 };

export default function OverviewTab() {
  const [date, setDate] = useState("");
  const [site, setSite] = useState("ALL");
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [absentees, setAbsentees] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [annual, setAnnual] = useState(null);
  const [loading, setLoading] = useState(true);

  function loadDashboard(d = date, s = site) {
    const qs = new URLSearchParams({ date: d || "", site: s });
    fetch(`/api/dashboard-summary?${qs}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          if (!d) setDate(res.date);
          setSummary(res.data);
        }
        setLoading(false);
      });
  }

  useEffect(() => {
    loadDashboard();
    fetch("/api/attendance-trends?days=30").then((r) => r.json()).then((res) => res.success && setTrends(res.trends));
    fetch("/api/top-absentees?days=7").then((r) => r.json()).then((res) => res.success && setAbsentees(res.absentees));
    fetch("/api/performance?limit=15").then((r) => r.json()).then((res) => res.success && setPerformers(res.topPerformers));
    fetch("/api/annual-summary").then((r) => r.json()).then((res) => res.success && setAnnual(res));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !summary) {
    return <div className="text-center py-20 text-slate-400"><i className="fa-solid fa-spinner fa-spin text-2xl mr-2"></i>กำลังโหลดข้อมูล...</div>;
  }

  const sites = ["CDC", "MKF", "MKD2", "MKD3"];
  const today = sites.reduce((acc, s) => ({ ...acc, [s]: summary.today[s] || EMPTY_SITE }), {});
  const week = sites.reduce((acc, s) => ({ ...acc, [s]: summary.week[s] || EMPTY_SITE }), {});
  const month = sites.reduce((acc, s) => ({ ...acc, [s]: summary.month[s] || EMPTY_SITE }), {});

  const totalPresent = sites.reduce((s, k) => s + today[k].present, 0);
  const totalAbsent = sites.reduce((s, k) => s + today[k].absent, 0);
  const totalBillable = sites.reduce((s, k) => s + today[k].billable, 0);
  const totalDeduct = sites.reduce((s, k) => s + today[k].deduct, 0);
  const totalTarget = sites.reduce((s, k) => s + SITE_TARGETS[k], 0);
  const pct = totalTarget > 0 ? Math.round((totalPresent / totalTarget) * 100) : 0;

  const alerts = [];
  sites.forEach((s) => {
    const target = SITE_TARGETS[s];
    if (!target) return;
    const absentPct = (today[s].absent / target) * 100;
    if (today[s].present === 0 && today[s].absent > 0) alerts.push({ site: s, msg: `CRITICAL! ไม่มีกำลังพลปฏิบัติงานวันนี้ (เป้าหมาย ${target} นาย)` });
    else if (absentPct > 20) alerts.push({ site: s, msg: `อัตราขาดงานผิดปกติ (${Math.round(absentPct)}%) - ขาด ${today[s].absent} นาย` });
  });

  const trendChartData = {
    labels: trends.map((t) => t.date),
    datasets: [
      { label: "Present", data: trends.map((t) => t.present), borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.1)", fill: true, tension: 0.4 },
      { label: "Absent", data: trends.map((t) => t.absent), borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)", fill: true, tension: 0.4 },
    ],
  };

  const annualChartData = annual && {
    labels: annual.data.map((d) => d.month),
    datasets: [
      { label: "CDC", data: annual.data.map((d) => d.CDC), backgroundColor: "#2563eb" },
      { label: "MKF", data: annual.data.map((d) => d.MKF), backgroundColor: "#22c55e" },
      { label: "MKD2", data: annual.data.map((d) => d.MKD2), backgroundColor: "#38bdf8" },
      { label: "MKD3", data: annual.data.map((d) => d.MKD3), backgroundColor: "#a855f7" },
    ],
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="w-full">
          <h2 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight">Personnel Overview</h2>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div className="bg-white border border-slate-300 rounded-lg flex items-center px-2 py-1 shadow-sm">
              <i className="fa-regular fa-calendar text-slate-400 text-sm mr-2"></i>
              <input type="date" value={date} onChange={(e) => { setDate(e.target.value); loadDashboard(e.target.value, site); }}
                className="text-sm border-none bg-transparent outline-none text-slate-700 font-bold" />
            </div>
            <div className="bg-white border border-slate-300 rounded-lg flex items-center px-2 py-1 shadow-sm">
              <i className="fa-solid fa-warehouse text-slate-400 text-sm mr-2"></i>
              <select value={site} onChange={(e) => { setSite(e.target.value); loadDashboard(date, e.target.value); }}
                className="text-sm border-none bg-transparent outline-none text-slate-700 font-bold">
                <option value="ALL">All Sites</option>
                {sites.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 lg:p-6 rounded-xl shadow-sm space-y-2">
          <h4 className="font-headline font-bold text-red-700 flex items-center gap-2"><i className="fa-solid fa-triangle-exclamation"></i> Active Alerts</h4>
          {alerts.map((a, i) => (
            <div key={i} className="bg-white border-l-4 border-red-600 p-3 rounded shadow-sm">
              <p className="font-bold text-slate-800 text-sm">{a.site}</p>
              <p className="text-xs text-slate-600">{a.msg}</p>
            </div>
          ))}
        </div>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <KPI label="TARGET - TODAY" value={totalTarget} badge="ALL SITES" badgeClass="bg-sky-100 text-sky-700" />
        <KPI label="ACTUAL - TODAY" value={totalPresent} badge={pct + "%"} badgeClass="bg-green-100 text-green-700" border="border-green-500" />
        <KPI label="ABSENCES - TODAY" value={totalAbsent} valueClass="text-red-600" border="border-red-500" />
        <div className="bg-slate-800 p-4 lg:p-6 rounded-xl shadow text-white relative overflow-hidden">
          <p className="text-[10px] uppercase tracking-widest text-blue-300 font-bold relative z-10">BILLABLE - TODAY</p>
          <h3 className="font-headline text-xl lg:text-2xl font-black mt-2 relative z-10">฿{totalBillable.toLocaleString()}</h3>
          <p className="text-[9px] text-blue-300 mt-1 relative z-10">Deductions: <span className="text-red-300 font-bold">฿{totalDeduct.toLocaleString()}</span></p>
        </div>
      </section>

      <section className="bg-white p-4 lg:p-6 rounded-xl shadow-sm">
        <h4 className="font-headline font-bold text-base lg:text-lg mb-4">Absence Rate by Site (Today)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sites.map((s) => {
            const target = SITE_TARGETS[s];
            const p = target > 0 ? Math.round((today[s].absent / target) * 100) : 0;
            return (
              <div key={s}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-bold">{s}</span>
                  <span className="font-bold" style={{ color: p > 10 ? "#ba1a1a" : "#15803d" }}>{p}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: p + "%" }}></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Present <b className="text-slate-700">{today[s].present}</b> / Absent <b className="text-red-600">{today[s].absent}</b> Pax</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white p-4 lg:p-6 rounded-xl shadow-sm">
        <h4 className="font-headline font-bold text-base lg:text-lg text-[#1e3c72] mb-4"><i className="fa-solid fa-chart-line mr-2"></i>Attendance Trends (Last 30 Days)</h4>
        <div className="h-64 lg:h-80 w-full relative">
          <Line data={trendChartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white p-4 lg:p-6 rounded-xl shadow-sm">
          <h4 className="font-headline font-bold text-base lg:text-lg text-red-700 mb-1"><i className="fa-solid fa-triangle-exclamation mr-2"></i>Top 10 Risk Positions</h4>
          <p className="text-xs text-slate-500 mb-4">Most frequent absences (Last 7 Days)</p>
          {absentees.length === 0 ? (
            <p className="text-center py-8 text-green-600 font-bold"><i className="fa-solid fa-circle-check mr-2"></i>No absences reported.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="bg-red-50 text-red-800 text-xs"><th className="p-2">#</th><th className="p-2">Site</th><th className="p-2">Position</th><th className="p-2 text-center">Times</th><th className="p-2 text-right">Penalty</th></tr></thead>
                <tbody>
                  {absentees.map((a, i) => (
                    <tr key={i} className="border-t border-slate-50">
                      <td className="p-2 text-center text-slate-400">{i + 1}</td>
                      <td className="p-2 font-bold">{a.site}</td>
                      <td className="p-2">{a.position}</td>
                      <td className="p-2 text-center"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">{a.count}</span></td>
                      <td className="p-2 text-right font-bold text-red-600">฿{a.deduct.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white p-4 lg:p-6 rounded-xl shadow-sm">
          <h4 className="font-headline font-bold text-base lg:text-lg text-[#1e3c72] mb-1"><i className="fa-solid fa-award mr-2"></i>100% Top Performers</h4>
          <p className="text-xs text-slate-500 mb-4">Perfect attendance</p>
          {performers.filter((p) => p.attendanceRate === 100).length === 0 ? (
            <p className="text-slate-400 text-center py-8 text-sm bg-slate-50 rounded-lg">No personnel with 100% currently.</p>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {performers.filter((p) => p.attendanceRate === 100).slice(0, 10).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "⭐"}</span>
                    <div>
                      <p className="font-bold text-sm truncate max-w-[180px]">{p.name}</p>
                      <p className="text-[10px] text-slate-500">Present {p.presentDays} days | ฿{p.totalEarned.toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="font-black text-green-700 bg-green-100 px-2 py-1 rounded text-[10px]">100%</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {annual && (
        <section className="bg-white p-4 lg:p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-end mb-4">
            <h4 className="font-headline font-bold text-base lg:text-lg text-[#1e3c72]"><i className="fa-solid fa-chart-column mr-2"></i>12-Month Billable by Site ({annual.year})</h4>
            <h3 className="font-headline text-xl font-black text-primary">฿{annual.total.toLocaleString()}</h3>
          </div>
          <div className="h-72">
            <Bar data={annualChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }} />
          </div>
        </section>
      )}
    </div>
  );
}

function KPI({ label, value, badge, badgeClass, valueClass, border }) {
  return (
    <div className={`bg-white p-4 lg:p-6 rounded-xl shadow-sm ${border ? `border-b-4 ${border}` : ""}`}>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{label}</p>
      <div className="flex items-center justify-between mt-2">
        <h3 className={`font-headline text-2xl lg:text-3xl font-black ${valueClass || ""}`}>{value}</h3>
        {badge && <span className={`font-bold text-[10px] px-2 py-1 rounded-full ${badgeClass}`}>{badge}</span>}
      </div>
    </div>
  );
}
