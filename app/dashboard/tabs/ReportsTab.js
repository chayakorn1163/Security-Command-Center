"use client";

import { useState } from "react";

export default function ReportsTab() {
  const [filterSite, setFilterSite] = useState("");
  const [filterShift, setFilterShift] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rows, setRows] = useState(null);
  const [searching, setSearching] = useState(false);

  const [reportStart, setReportStart] = useState("");
  const [reportEnd, setReportEnd] = useState("");
  const [reportType, setReportType] = useState("daily");
  const [exporting, setExporting] = useState(false);

  function applyFilters(site = filterSite, shift = filterShift, from = dateFrom, to = dateTo) {
    if (!from || !to) return;
    setSearching(true);
    const qs = new URLSearchParams({ site, shift, dateFrom: from, dateTo: to });
    fetch(`/api/filtered-data?${qs}`).then((r) => r.json()).then((res) => {
      setRows(res.success ? res.data : []);
      setSearching(false);
    });
  }

  async function exportReport(format) {
    if (!reportStart || !reportEnd) return;
    setExporting(true);
    const qs = new URLSearchParams({ start: reportStart, end: reportEnd, type: reportType });
    const res = await fetch(`/api/report-data?${qs}`).then((r) => r.json());
    setExporting(false);
    if (!res.success) return alert(res.message);

    if (format === "csv") {
      const header = reportType === "daily"
        ? ["Date", "Site", "Shift", "Present", "Absent", "Billable"]
        : ["Full Name", "ID", "Position", "Site", "Day Shift", "Night Shift", "Total Billable"];
      const lines = reportType === "daily"
        ? res.data.map((r) => [r.date, r.site, r.shift, r.present, r.absent, r.billable].join(","))
        : res.data.map((r) => [r.name, r.id, r.posType, r.site, r.dayCount, r.nightCount, r.totalEarned].join(","));
      const csv = "\uFEFF" + header.join(",") + "\n" + lines.join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      a.download = `Report_${reportType}_${reportStart}.csv`;
      a.click();
    } else {
      const title = reportType === "daily" ? "Daily Operational Report" : "Monthly Billable Report";
      let html = `<style>body{font-family:sans-serif;padding:20px;font-size:13px;color:#334155}h2{text-align:center;color:#0f172a}p{text-align:center;color:#64748b}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border-bottom:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#f8fafc;text-transform:uppercase;font-size:11px}.right{text-align:right}.center{text-align:center}</style><h2>${title}</h2><p>${reportStart} - ${reportEnd}</p><table>`;
      if (reportType === "daily") {
        html += "<tr><th>Date</th><th>Site</th><th>Shift</th><th class='center'>Present</th><th class='center'>Absent</th><th class='right'>Billable</th></tr>";
        res.data.forEach((r) => (html += `<tr><td>${r.date}</td><td>${r.site}</td><td>${r.shift}</td><td class='center'>${r.present}</td><td class='center'>${r.absent}</td><td class='right'>฿${r.billable.toLocaleString()}</td></tr>`));
      } else {
        html += "<tr><th>Name</th><th>Site</th><th class='center'>Day</th><th class='center'>Night</th><th class='right'>Total</th></tr>";
        res.data.forEach((r) => (html += `<tr><td>${r.name}</td><td>${r.site}</td><td class='center'>${r.dayCount}</td><td class='center'>${r.nightCount}</td><td class='right'>฿${r.totalEarned.toLocaleString()}</td></tr>`));
      }
      html += "</table><scr" + "ipt>window.onload=()=>window.print();</scr" + "ipt>";
      const w = window.open("", "_blank");
      w.document.write(html);
      w.document.close();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h3 className="font-headline text-2xl sm:text-3xl font-bold">Audit Reports</h3>
          <p className="text-slate-500 text-sm max-w-xl">Generate, filter, and export personnel & deduction reports</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => exportReport("pdf")} disabled={exporting} className="flex-1 sm:flex-none px-5 py-2.5 bg-red-600 text-white font-semibold text-sm rounded-lg shadow-sm">
            <i className="fa-solid fa-file-pdf mr-1"></i>PDF
          </button>
          <button onClick={() => exportReport("csv")} disabled={exporting} className="flex-1 sm:flex-none px-5 py-2.5 bg-green-600 text-white font-semibold text-sm rounded-lg shadow-sm">
            <i className="fa-solid fa-file-csv mr-1"></i>Excel
          </button>
        </div>
      </div>

      <div className="bg-white p-4 lg:p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 mb-4">
          <i className="fa-solid fa-magnifying-glass text-sm"></i>
          <span className="text-xs font-bold uppercase tracking-widest">Live Search Entry Logs</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={filterSite} onChange={(e) => { setFilterSite(e.target.value); applyFilters(e.target.value, filterShift, dateFrom, dateTo); }} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="">All Sites</option><option value="CDC">CDC</option><option value="MKF">MKF</option><option value="MKD2">MKD2</option><option value="MKD3">MKD3</option>
          </select>
          <select value={filterShift} onChange={(e) => { setFilterShift(e.target.value); applyFilters(filterSite, e.target.value, dateFrom, dateTo); }} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="">All Shifts</option><option value="กลางวัน">Day</option><option value="กลางคืน">Night</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); applyFilters(filterSite, filterShift, e.target.value, dateTo); }} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); applyFilters(filterSite, filterShift, dateFrom, e.target.value); }} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>

        {rows !== null && (
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 max-h-64 overflow-y-auto">
            <table className="w-full text-left whitespace-nowrap min-w-[700px] text-xs">
              <thead className="sticky top-0 bg-slate-100"><tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Site</th><th className="px-4 py-2">Shift</th><th className="px-4 py-2">Name</th><th className="px-4 py-2 text-center">Status</th><th className="px-4 py-2 text-right">Amount</th></tr></thead>
              <tbody>
                {searching ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400"><i className="fa-solid fa-spinner fa-spin mr-2"></i>Searching...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No data found</td></tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i} className="border-t border-slate-50">
                      <td className="px-4 py-2 font-mono">{r.date}</td><td className="px-4 py-2 font-bold">{r.site}</td><td className="px-4 py-2">{r.shift}</td>
                      <td className="px-4 py-2">{r.name}</td>
                      <td className="px-4 py-2 text-center">{r.status === "มา" ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Present</span> : <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">Absent</span>}</td>
                      <td className="px-4 py-2 text-right font-bold text-primary">฿{r.earned.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-white p-4 lg:p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-3"><i className="fa-regular fa-calendar text-sm"></i><span className="text-xs font-bold uppercase">Temporal Range</span></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label><input type="date" value={reportStart} onChange={(e) => setReportStart(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1" /></div>
            <div><label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label><input type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1" /></div>
          </div>
        </div>
        <div className="lg:col-span-4 bg-white p-4 lg:p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-3"><i className="fa-solid fa-layer-group text-sm"></i><span className="text-xs font-bold uppercase">Ledger Type</span></div>
          <label className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg cursor-pointer border border-blue-200 mb-2">
            <input type="radio" checked={reportType === "daily"} onChange={() => setReportType("daily")} /><span className="text-sm font-medium">Daily Operational Summary</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer border border-transparent hover:border-slate-200">
            <input type="radio" checked={reportType === "monthly"} onChange={() => setReportType("monthly")} /><span className="text-sm font-medium text-slate-500">Monthly Billable (Individual)</span>
          </label>
        </div>
      </div>
    </div>
  );
}
