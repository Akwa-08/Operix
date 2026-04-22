import { useState, useMemo } from "react";
import {
  Search, Filter, Calendar as CalendarIcon, RefreshCw, Activity,
  User, Briefcase, FileText, ShieldCheck, Package, BarChart2, Download
} from "lucide-react";
import { useLogsData } from "../../hooks/useSupabase";

// ── Types ────────────────────────────────────────────────────────────────────
type LogEntry = {
  id: string;
  source: "audit" | "orders" | "inventory";
  date: string;
  timestamp: number;
  module: string;
  action: string;
  details: string;
  user: string;
  role: string;
};

type TabId = "all" | "staff" | "orders" | "inventory";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "all",       label: "All Activity",       icon: <Activity size={15} /> },
  { id: "staff",     label: "Staff Actions",       icon: <ShieldCheck size={15} /> },
  { id: "orders",    label: "Order History",       icon: <Package size={15} /> },
  { id: "inventory", label: "Inventory Changes",   icon: <BarChart2 size={15} /> },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const MODULE_COLORS: Record<string, string> = {
  orders:          "bg-purple-50 text-purple-700 border-purple-100",
  inventory:       "bg-teal-50 text-teal-700 border-teal-100",
  inventory_items: "bg-teal-50 text-teal-700 border-teal-100",
  employees:       "bg-blue-50 text-blue-700 border-blue-100",
  suppliers:       "bg-orange-50 text-orange-700 border-orange-100",
  products:        "bg-pink-50 text-pink-700 border-pink-100",
  deliveries:      "bg-yellow-50 text-yellow-700 border-yellow-100",
  payments:        "bg-green-50 text-green-700 border-green-100",
  system:          "bg-gray-50 text-gray-600 border-gray-200",
};

function moduleColor(module: string) {
  return MODULE_COLORS[module?.toLowerCase()] ?? MODULE_COLORS.system;
}

function exportCSV(logs: LogEntry[]) {
  const headers = ["Date & Time", "User", "Role", "Module", "Action", "Details"];
  const rows = logs.map(l => [
    `"${l.date}"`, `"${l.user}"`, `"${l.role}"`, `"${l.module}"`,
    `"${l.action}"`, `"${l.details.replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `operix_audit_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────
const AdminLogs = () => {
  const { data: rawData, loading, error, refresh } = useLogsData();

  const [activeTab, setActiveTab]   = useState<TabId>("all");
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");

  // ── Derive the active dataset ──────────────────────────────────────────────
  const tabLogs: LogEntry[] = useMemo(() => {
    if (!rawData) return [];
    switch (activeTab) {
      case "staff":     return rawData.staffActions;
      case "orders":    return rawData.orderHistory;
      case "inventory": return rawData.inventoryChanges;
      default:          return rawData.all;
    }
  }, [rawData, activeTab]);

  // ── Unique roles for filter dropdown ──────────────────────────────────────
  const roles = useMemo(() =>
    ["all", ...Array.from(new Set(tabLogs.map(l => l.role))).sort()],
    [tabLogs]
  );

  // ── Count per tab for badge ───────────────────────────────────────────────
  const counts = {
    all:       rawData?.all.length ?? 0,
    staff:     rawData?.staffActions.length ?? 0,
    orders:    rawData?.orderHistory.length ?? 0,
    inventory: rawData?.inventoryChanges.length ?? 0,
  };

  // ── Apply filters ─────────────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    const term = search.toLowerCase();
    return tabLogs.filter(log => {
      const matchSearch =
        log.user.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term) ||
        log.module.toLowerCase().includes(term);
      const matchRole = roleFilter === "all" || log.role === roleFilter;
      const matchFrom = !dateFrom || log.timestamp >= new Date(dateFrom).getTime();
      const matchTo   = !dateTo   || log.timestamp <= new Date(dateTo).setHours(23, 59, 59);
      return matchSearch && matchRole && matchFrom && matchTo;
    });
  }, [tabLogs, search, roleFilter, dateFrom, dateTo]);

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center text-lg text-gray-500 font-semibold gap-3">
        <RefreshCw className="animate-spin text-cyan-600" size={24} />
        Loading activity logs…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <p className="text-red-600 font-semibold mb-1">Error loading logs</p>
          <p className="text-sm text-red-400">{error}</p>
          <p className="text-xs text-gray-500 mt-3">
            If this is the first time loading, make sure the SQL migration has
            been run in Supabase (migration_audit_logs_and_production_fk.sql).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="text-[#E80088]" size={28} /> Activity Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            System-wide audit trail of staff actions, order history, and inventory changes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            id="audit-export-csv"
            onClick={() => exportCSV(filteredLogs)}
            disabled={filteredLogs.length === 0}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-40 active:scale-95 whitespace-nowrap"
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            id="audit-refresh"
            onClick={() => refresh()}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            <RefreshCw size={15} className={`text-cyan-500 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* ── TABS ────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`audit-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === tab.id ? "bg-[#E80088]/10 text-[#E80088]" : "bg-gray-200 text-gray-500"
            }`}>
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* ── FILTERS ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row flex-wrap gap-3 md:items-center">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative w-full md:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="audit-search"
            type="text"
            placeholder="Search user, action, details…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
          {/* Role filter */}
          <div className="relative flex-1 md:min-w-[140px]">
            <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              id="audit-role-filter"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 capitalize"
            >
              {roles.map(r => <option key={r} value={r}>{r === "all" ? "All Roles" : r}</option>)}
            </select>
            <Filter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Date From */}
          <div className="relative flex-1 md:min-w-[150px]">
            <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="audit-date-from"
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-none rounded-xl font-medium text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Date To */}
          <div className="relative flex-1 md:min-w-[150px]">
            <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="audit-date-to"
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-none rounded-xl font-medium text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Clear filters */}
        {(search || roleFilter !== "all" || dateFrom || dateTo) && (
          <button
            onClick={() => { setSearch(""); setRoleFilter("all"); setDateFrom(""); setDateTo(""); }}
            className="text-xs text-gray-500 hover:text-red-500 font-medium underline"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-gray-400 font-medium whitespace-nowrap">
          {filteredLogs.length.toLocaleString()} result{filteredLogs.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── LOGS TABLE / CARDS ──────────────────────────────────────────────────────── */}
      <div className="bg-white md:rounded-2xl md:border border-gray-200 shadow-sm overflow-hidden">
        
        {/* MOBILE VIEW — CARDS */}
        <div className="md:hidden divide-y divide-gray-100 border-y border-gray-200 bg-white">
          {filteredLogs.length === 0 ? (
            <div className="px-5 py-20 text-center">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Activity size={32} className="opacity-30" />
                <p className="font-medium">No activity logs found</p>
              </div>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 bg-white hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <User size={15} className="text-[#E80088]" />
                    <span className="text-base font-bold text-gray-900">{log.user}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${moduleColor(log.module)}`}>
                    {log.module}
                  </span>
                </div>
                <div className="mb-2">
                  <p className="text-sm font-semibold text-gray-900">{log.action}</p>
                  {log.details && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{log.details}</p>}
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                  <span>{log.date}</span>
                  <span className="capitalize bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{log.role}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP VIEW — TABLE */}
        <div className="hidden md:block overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  <CalendarIcon size={12} className="inline mr-1" />Date & Time
                </th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <User size={12} className="inline mr-1" />User
                </th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <FileText size={12} className="inline mr-1" />Module
                </th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Activity size={32} className="opacity-30" />
                      <p className="font-medium">No activity logs found</p>
                      <p className="text-xs">
                        {activeTab === "staff" && !rawData?.staffActions.length
                          ? "Staff actions will appear here once the SQL migration has been run."
                          : "Try adjusting your filters."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm text-gray-600 font-medium">{log.date}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-gray-900">{log.user}</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-semibold capitalize mt-1 inline-block">{log.role}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${moduleColor(log.module)}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-900 font-bold whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 max-w-sm truncate" title={log.details}>
                      {log.details || <span className="italic text-gray-300">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination hint ─────────────────────────────────────────────── */}
        {filteredLogs.length >= 500 && (
          <div className="border-t border-gray-100 px-5 py-2.5 bg-amber-50">
            <p className="text-xs text-amber-700 font-medium">
              Showing the latest 500 records per category. Use date filters to narrow results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
