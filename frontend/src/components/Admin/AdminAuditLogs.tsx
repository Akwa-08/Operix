import { useState, useMemo } from "react";
import { Search, Filter, Calendar as CalendarIcon, RefreshCw, Activity, User, Briefcase, FileText } from "lucide-react";
import { useLogsData } from "../../hooks/useSupabase";

const AdminLogs = () => {
  const { data: rawLogs, loading, error, refresh } = useLogsData();
  const logs = rawLogs || [];

  // Filter states
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const modules = useMemo(() => ["all", ...Array.from(new Set(logs.map((l: any) => l.module)))].sort(), [logs]);
  const roles = useMemo(() => ["all", ...Array.from(new Set(logs.map((l: any) => l.role)))].sort(), [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log: any) => {
      const matchSearch =
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase());
      const matchModule = moduleFilter === "all" || log.module === moduleFilter;
      const matchRole = roleFilter === "all" || log.role === roleFilter;

      return matchSearch && matchModule && matchRole;
    });
  }, [logs, search, moduleFilter, roleFilter]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center text-lg text-gray-500 font-semibold gap-3">
        <RefreshCw className="animate-spin text-cyan-600" size={24} /> Loading activity logs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center text-red-500 font-semibold bg-red-50 rounded-xl p-4 border border-red-200">
        Error loading logs: {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="text-[#E80088]" size={28} /> Activity Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            System-wide audit trail of user actions and notifications.
          </p>
        </div>
        <button
          onClick={() => refresh()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* ── FILTERS ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-wrap gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search details, actions, or users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
          />
        </div>

        {/* Module Filter */}
        <div className="relative min-w-[140px]">
          <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors capitalize"
          >
            {modules.map((m: string) => (
              <option key={m} value={m}>{m === "all" ? "All Modules" : m}</option>
            ))}
          </select>
          <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Role Filter */}
        <div className="relative min-w-[140px]">
          <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors capitalize"
          >
            {roles.map((r: string) => (
              <option key={r} value={r}>{r === "all" ? "All Roles" : r}</option>
            ))}
          </select>
          <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* ── LOGS TABLE ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Module</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-gray-400 font-medium">
                    No activity logs found matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600 font-medium whitespace-nowrap">
                        <CalendarIcon size={14} className="text-gray-400" />
                        {log.date}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <User size={14} className="text-[#E80088]" />
                        {log.user}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-100">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900 font-bold whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {log.details || <span className="text-gray-400 italic">No additional details</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;
