"use client";

import { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import "@/lib/chartSetup";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function CostTab() {
  const [month, setMonth] = useState(currentMonth());
  const [cost, setCost] = useState(null);
  const [loading, setLoading] = useState(false);

  function load(m = month) {
    setLoading(true);
    fetch(`/api/cost-analysis?month=${m}`).then((r) => r.json()).then((res) => {
      if (res.success) setCost(res.cost);
      setLoading(false);
    });
  }

  const siteChartData = cost && {
    labels: Object.keys(cost.bySite),
    datasets: [
      { label: "Total Billable", data: Object.values(cost.bySite).map((s) => s.billable), backgroundColor: "#3b82f6" },
      { label: "Deductions", data: Object.values(cost.bySite).map((s) => s.deduct), backgroundColor: "#ef4444" },
    ],
  };

  const posChartData = cost && {
    labels: ["Team Lead", "Security Guard"],
    datasets: [{ data: [cost.byPosition["หัวหน้าชุด"] || 0, cost.byPosition["Security Guard"] || 0], backgroundColor: ["#f59e0b", "#10b981"] }],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-headline font-extrabold text-2xl sm:text-4xl">Cost Analysis</h2>
          <p className="text-slate-500 text-sm max-w-lg">Monthly budget, wage breakdown, and deductions by site & position</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm shadow-sm" />
          <button onClick={() => load()} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm shadow-sm">
            <i className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-rotate"} mr-2`}></i>Process
          </button>
        </div>
      </div>

      {!cost ? (
        <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-slate-200">กด &quot;Process&quot; เพื่อดึงข้อมูลต้นทุนของเดือนนี้</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Billable</p>
              <h3 className="font-headline text-3xl font-black text-blue-700">฿{cost.totalBillable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Deduct</p>
              <h3 className="font-headline text-3xl font-black text-red-600">฿{cost.totalDeduct.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-200 shadow-sm border-l-4 border-l-emerald-500">
              <p className="text-xs font-bold text-emerald-800 uppercase mb-1">Net Payable</p>
              <h3 className="font-headline text-3xl font-black text-emerald-700">฿{cost.netBillable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="bg-white p-4 lg:p-6 rounded-xl shadow-sm lg:col-span-2">
              <h4 className="font-headline font-bold text-base lg:text-lg text-[#1e3c72] mb-4"><i className="fa-solid fa-building mr-2"></i>Budget Distribution by Site</h4>
              <div className="h-72"><Bar data={siteChartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
            </section>
            <section className="bg-white p-4 lg:p-6 rounded-xl shadow-sm flex flex-col">
              <h4 className="font-headline font-bold text-base lg:text-lg text-[#1e3c72] mb-4 text-center"><i className="fa-solid fa-users mr-2"></i>By Position</h4>
              <div className="h-56 flex-grow flex items-center justify-center"><Doughnut data={posChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} /></div>
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
                <div><p className="text-[10px] text-slate-500 uppercase font-bold">Day Shift</p><p className="text-sm font-black text-sky-600">฿{(cost.byShift["กลางวัน"] || 0).toLocaleString()}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase font-bold">Night Shift</p><p className="text-sm font-black text-indigo-600">฿{(cost.byShift["กลางคืน"] || 0).toLocaleString()}</p></div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
