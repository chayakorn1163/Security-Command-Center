"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OverviewTab from "./tabs/OverviewTab";
import PersonnelTab from "./tabs/PersonnelTab";
import ReportsTab from "./tabs/ReportsTab";
import PerformanceTab from "./tabs/PerformanceTab";
import CostTab from "./tabs/CostTab";

const TABS = [
  { id: "overview", label: "Overview Dashboard", icon: "fa-gauge-high" },
  { id: "personnel", label: "Personnel Ledger", icon: "fa-id-badge" },
  { id: "reports", label: "Audit Reports", icon: "fa-chart-line" },
  { id: "performance", label: "Performance Ranking", icon: "fa-trophy", color: "text-amber-500" },
  { id: "cost", label: "Cost Analysis", icon: "fa-sack-dollar", color: "text-emerald-600" },
];

export default function DashboardPage() {
  const [tab, setTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex bg-[#f8f9fa]">
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden" />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-slate-200 py-6 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <h1 className="font-headline font-bold text-blue-700 text-lg leading-tight">CJ Logistics</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Administrative Ledger</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-headline ${
                tab === t.id
                  ? "text-blue-700 font-bold bg-white/60 border-r-4 border-blue-700"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <i className={`fa-solid ${t.icon} ${t.color || ""}`}></i>
              <span>{t.label}</span>
            </button>
          ))}

          <div className="my-4 px-4 border-t border-slate-300"></div>

          <a
            href="/daily-entry"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-white font-bold text-sm shadow-md"
            style={{ background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)" }}
          >
            <i className="fa-solid fa-pen-to-square"></i>
            <span>Daily Entry</span>
          </a>
        </nav>

        <div className="mt-auto px-4 pt-6 absolute bottom-6 w-full">
          <button
            onClick={logout}
            className="w-full bg-red-600/10 hover:bg-red-600 hover:text-white text-red-600 py-3 rounded-xl font-headline font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 w-full">
        <header className="sticky top-0 z-30 flex justify-between items-center w-full px-4 lg:px-8 py-4 bg-white/70 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600 p-2 bg-slate-100 rounded-lg">
            <i className="fa-solid fa-bars"></i>
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold font-headline">Sup. Chayakorn</p>
              <p className="text-[10px] text-slate-400 uppercase">Security Command</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white">
              <i className="fa-solid fa-user-shield text-sm"></i>
            </div>
          </div>
        </header>

        <main className="w-full overflow-x-hidden p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {tab === "overview" && <OverviewTab />}
          {tab === "personnel" && <PersonnelTab />}
          {tab === "reports" && <ReportsTab />}
          {tab === "performance" && <PerformanceTab />}
          {tab === "cost" && <CostTab />}
        </main>
      </div>
    </div>
  );
}
