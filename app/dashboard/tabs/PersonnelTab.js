"use client";

import { useMemo, useState } from "react";

export default function PersonnelTab() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [filterSite, setFilterSite] = useState("");
  const [filterRank, setFilterRank] = useState("");
  const [filterName, setFilterName] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/personnel")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setAll(res.personnel || []);
        setLoading(false);
        setLoaded(true);
      });
  }

  const filtered = useMemo(() => {
    const q = filterName.trim().toLowerCase();
    return all.filter((p) => {
      if (filterSite && p.site !== filterSite) return false;
      if (filterRank && p.posType !== filterRank) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, filterSite, filterRank, filterName]);

  function exportCSV() {
    if (!all.length) return;
    const rows = all.map((p) => [p.name, p.id, p.posType, p.site, p.dayCount, p.nightCount, p.totalEarned].join(","));
    const csv = "\uFEFF" + ["Full Name", "ID", "Position", "Site", "Day Shift", "Night Shift", "Total Earned"].join(",") + "\n" + rows.join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = "personnel.csv";
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-headline font-extrabold text-2xl sm:text-4xl">Personnel Ledger</h2>
          <p className="text-slate-500 text-sm max-w-lg">List of active security personnel — aggregated from entry logs</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={load} className="flex-1 sm:flex-none px-4 py-2.5 bg-primary text-white font-semibold rounded-lg text-sm shadow-sm">
            <i className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-rotate"} mr-2`}></i>Refresh Data
          </button>
          <button onClick={exportCSV} className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-200 font-semibold rounded-lg text-sm shadow-sm">
            <i className="fa-solid fa-download mr-2"></i>Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-xs font-bold text-slate-500 uppercase">Filter:</span>
        <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-3 py-2">
          <option value="">All Sites</option>
          <option value="CDC">CDC</option><option value="MKF">MKF</option><option value="MKD2">MKD2</option><option value="MKD3">MKD3</option>
        </select>
        <select value={filterRank} onChange={(e) => setFilterRank(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-3 py-2">
          <option value="">All Positions</option>
          <option value="หัวหน้าชุด">Team Lead</option>
          <option value="Security Guard">Security Guard</option>
        </select>
        <input value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="Search name..." className="text-xs border border-slate-200 rounded-lg px-3 py-2 w-40" />
        <span className="ml-auto text-xs text-slate-400">Found <b className="text-primary">{filtered.length}</b> Pax</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap min-w-[750px] text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-500">
                <th className="px-6 py-3">#</th><th className="px-6 py-3">Full Name</th><th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Position</th><th className="px-6 py-3">Site</th>
                <th className="px-6 py-3 text-center">Day</th><th className="px-6 py-3 text-center">Night</th><th className="px-6 py-3 text-right">Total Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loaded ? (
                <tr><td colSpan={8} className="px-8 py-10 text-center text-slate-400">Click &quot;Refresh Data&quot; above to view personnel list</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-8 py-10 text-center text-slate-400">No data found</td></tr>
              ) : (
                filtered.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-xs text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-3 font-semibold">{p.name}</td>
                    <td className="px-6 py-3 font-mono text-xs text-primary">{p.id || "—"}</td>
                    <td className="px-6 py-3">
                      {p.posType === "หัวหน้าชุด"
                        ? <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Team Lead</span>
                        : <span className="bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Guard</span>}
                    </td>
                    <td className="px-6 py-3 text-xs font-bold">{p.site}</td>
                    <td className="px-6 py-3 text-center font-bold">{p.dayCount}</td>
                    <td className="px-6 py-3 text-center font-bold">{p.nightCount}</td>
                    <td className="px-6 py-3 text-right font-bold text-primary">฿{p.totalEarned.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
