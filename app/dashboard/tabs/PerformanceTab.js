"use client";

import { useState } from "react";

export default function PerformanceTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/performance?limit=20").then((r) => r.json()).then((res) => {
      setData(res.success ? res.topPerformers : []);
      setLoading(false);
    });
  }

  const top3 = data ? data.slice(0, 3) : [];
  const rest = data ? data.slice(3) : [];
  const medalColors = ["text-yellow-500", "text-slate-400", "text-amber-600"];
  const bgClasses = [
    "bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200",
    "bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200",
    "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-headline font-extrabold text-2xl sm:text-4xl">Performance Ranking</h2>
          <p className="text-slate-500 text-sm max-w-lg">Analyze and rank personnel reliability (5+ days worked)</p>
        </div>
        <button onClick={load} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-sm shadow-sm w-full sm:w-auto">
          <i className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-rotate"} mr-2`}></i>Update Data
        </button>
      </div>

      {!data ? (
        <div className="text-center text-slate-400 bg-white p-8 rounded-xl border border-slate-200">Click &apos;Update Data&apos; to rank...</div>
      ) : data.length === 0 ? (
        <div className="text-center text-slate-500 bg-white p-4 rounded-xl border border-slate-200 text-sm">Not enough data for ranking (requires 5+ days worked)</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            {top3.map((p, idx) => (
              <div key={idx} className={`${bgClasses[idx]} border rounded-xl p-5 lg:p-6 shadow-sm relative overflow-hidden`}>
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center font-black text-xl ${medalColors[idx]}`}>{idx + 1}</div>
                  <div className="truncate">
                    <p className="font-bold text-slate-800 text-base truncate">{p.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {p.id}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className="text-green-700 bg-white/70 px-2 py-1 rounded shadow-sm border border-white"><i className="fa-solid fa-check-circle mr-1"></i>{p.attendanceRate}%</span>
                  <span className="text-slate-600 bg-white/70 px-2 py-1 rounded shadow-sm border border-white">Present {p.presentDays}/{p.totalDays} days</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-[#f0f4f8] px-4 lg:px-6 py-4 border-b border-slate-200">
              <h4 className="font-headline font-bold text-sm lg:text-base text-[#1e3c72]"><i className="fa-solid fa-list-ol mr-2"></i>Rank 4 to 20</h4>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left whitespace-nowrap min-w-[700px] text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-500">
                    <th className="px-6 py-3 text-center w-16">#</th><th className="px-6 py-3">Full Name</th>
                    <th className="px-6 py-3 text-center">Shifts</th><th className="px-6 py-3 text-center">Present</th>
                    <th className="px-6 py-3 text-center">Absent</th><th className="px-6 py-3 text-center">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rest.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-6 text-slate-400">No additional ranked personnel.</td></tr>
                  ) : (
                    rest.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-center font-black text-slate-400">{idx + 4}</td>
                        <td className="px-6 py-3">
                          <div className="truncate max-w-[200px] font-semibold">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.id}</div>
                        </td>
                        <td className="px-6 py-3 text-center font-bold text-slate-500">{p.totalDays}</td>
                        <td className="px-6 py-3 text-center font-bold text-green-600">{p.presentDays}</td>
                        <td className={`px-6 py-3 text-center font-bold ${p.absentDays > 0 ? "text-red-600" : "text-slate-400"}`}>{p.absentDays}</td>
                        <td className="px-6 py-3 text-center"><span className="bg-blue-50 border border-blue-100 text-primary px-2.5 py-1 rounded font-bold text-xs">{p.attendanceRate}%</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
