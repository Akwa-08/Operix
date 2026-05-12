import { useState, useMemo } from "react";
import {
  X, Printer, TrendingUp, DollarSign, CreditCard, Package,
  CheckCircle, AlertTriangle, BarChart2, Warehouse, Clock,
} from "lucide-react";
import { useDashboardData } from "../../hooks/useSupabase";
import { fmtMoney, fmtDate } from "../../util/formatters";
import { LoadingSpinner } from "../Shared/UI/LoadingSpinner";

// ── Period helpers (mirrors AdminDashboard logic) ─────────────────────────────
type ReportPeriod = "today" | "week" | "month" | "3months" | "year" | "all";

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: "today",   label: "Today" },
  { key: "week",    label: "This Week" },
  { key: "month",   label: "This Month" },
  { key: "3months", label: "3 Months" },
  { key: "year",    label: "This Year" },
  { key: "all",     label: "All Time" },
];

const PIPELINE_STAGES = [
  { key: "in_queue",   label: "In Queue",          color: "bg-blue-500",   text: "text-blue-700",   bg: "bg-blue-50" },
  { key: "designing",  label: "Designing",         color: "bg-purple-500", text: "text-purple-700", bg: "bg-purple-50" },
  { key: "payment",    label: "Awaiting Payment",  color: "bg-amber-500",  text: "text-amber-700",  bg: "bg-amber-50" },
  { key: "production", label: "In Production",     color: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50" },
  { key: "pickup",     label: "Ready for Pickup",  color: "bg-green-500",  text: "text-green-700",  bg: "bg-green-50" },
  { key: "completed",  label: "Completed",         color: "bg-gray-400",   text: "text-gray-600",   bg: "bg-gray-50" },
];

function getPeriodStart(period: ReportPeriod): Date {
  const now = new Date();
  const d = new Date(now);
  switch (period) {
    case "today":   d.setHours(0, 0, 0, 0); return d;
    case "week":    d.setDate(now.getDate() - 6); d.setHours(0, 0, 0, 0); return d;
    case "month":   d.setDate(1); d.setHours(0, 0, 0, 0); return d;
    case "3months": d.setMonth(now.getMonth() - 2, 1); d.setHours(0, 0, 0, 0); return d;
    case "year":    d.setMonth(0, 1); d.setHours(0, 0, 0, 0); return d;
    default:        return new Date(0);
  }
}

function filterByPeriod(orders: any[], period: ReportPeriod): any[] {
  if (period === "all") return orders;
  const start = getPeriodStart(period);
  return orders.filter(o => o.created_at && new Date(o.created_at) >= start);
}

function computeStats(orders: any[]) {
  const now = new Date();
  const revenue   = orders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
  const collected = orders.reduce((s, o) => s + (Number(o.amount_paid) || 0), 0);
  return {
    revenue, collected,
    outstanding: Math.max(0, revenue - collected),
    total: orders.length,
    completed: orders.filter(o => o.status === "completed").length,
    overdue: orders.filter(o =>
      o.due_date && new Date(o.due_date) < now &&
      !["completed", "pickup", "cancelled"].includes(o.status)
    ).length,
    collectionRate: revenue > 0 ? Math.round((collected / revenue) * 100) : 0,
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface AdminSummaryReportProps {
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
const AdminSummaryReport: React.FC<AdminSummaryReportProps> = ({ onClose }) => {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const { data: liveData, loading } = useDashboardData();

  const rawOrders    = useMemo<any[]>(() => (liveData as any)?.rawOrders || [], [liveData]);
  const periodOrders = useMemo(() => filterByPeriod(rawOrders, period), [rawOrders, period]);
  const stats        = useMemo(() => computeStats(periodOrders), [periodOrders]);
  const lowStockItems = useMemo(() => liveData?.lowStockItems || [], [liveData]);

  // Pipeline counts from period orders
  const pipeline = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of periodOrders) counts[o.status] = (counts[o.status] || 0) + 1;
    return counts;
  }, [periodOrders]);
  const pipelineMax = Math.max(...PIPELINE_STAGES.map(s => pipeline[s.key] || 0), 1);

  // Top 5 products by volume
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const o of periodOrders) {
      for (const item of (o.order_items || [])) {
        const name = item.product_name || "Unknown";
        if (!map[name]) map[name] = { name, count: 0, revenue: 0 };
        map[name].count += item.quantity || 1;
        map[name].revenue += (Number(item.unit_price) || 0) * (item.quantity || 1);
      }
    }
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [periodOrders]);

  // Recent 8 orders
  const recentOrders = useMemo(() =>
    periodOrders.slice(0, 8).map(o => ({
      id: o.id,
      orderId: o.order_number || o.id,
      customerName: o.customer
        ? `${o.customer.first_name || ""} ${o.customer.last_name || ""}`.trim() || "Walk-in"
        : "Walk-in",
      product: o.order_items?.[0]?.product_name || "—",
      amount: Number(o.total_amount) || 0,
      status: o.status,
      date: fmtDate(o.created_at),
    })),
    [periodOrders]
  );

  const periodLabel = PERIODS.find(p => p.key === period)?.label ?? "";
  const reportDate  = new Date().toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila", weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const STATUS_BADGE: Record<string, string> = {
    in_queue:   "bg-blue-100 text-blue-700",
    designing:  "bg-purple-100 text-purple-700",
    payment:    "bg-amber-100 text-amber-700",
    production: "bg-orange-100 text-orange-700",
    pickup:     "bg-cyan-100 text-cyan-700",
    completed:  "bg-green-100 text-green-700",
    cancelled:  "bg-gray-100 text-gray-500",
  };
  const STATUS_LABEL: Record<string, string> = {
    in_queue: "In Queue", designing: "Designing", payment: "Payment",
    production: "Production", pickup: "Pickup", completed: "Completed", cancelled: "Cancelled",
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        id="summary-report-content"
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Business Summary Report</h2>
            <p className="text-xs text-gray-400 mt-0.5">{reportDate}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-colors"
            >
              <Printer size={15} /> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* ── Period selector ── */}
        <div className="px-6 py-2.5 border-b border-gray-100 flex gap-1 overflow-x-auto no-scrollbar">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                period === p.key
                  ? "bg-cyan-500 text-white shadow-sm shadow-cyan-200"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner message="Loading report data..." />
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

            {/* 1. Financial Overview */}
            <section>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp size={14} className="text-cyan-500" /> Financial Overview — {periodLabel}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Revenue */}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp size={13} className="text-cyan-600" />
                    <p className="text-xs font-bold text-cyan-600 uppercase tracking-wide">Revenue</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{fmtMoney(stats.revenue)}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.total} total orders</p>
                </div>
                {/* Collected */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <DollarSign size={13} className="text-green-600" />
                    <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Collected</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{fmtMoney(stats.collected)}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.collectionRate}% collection rate</p>
                </div>
                {/* Outstanding */}
                <div className={`rounded-xl p-4 border ${stats.outstanding > 0 ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"}`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <CreditCard size={13} className={stats.outstanding > 0 ? "text-amber-600" : "text-gray-400"} />
                    <p className={`text-xs font-bold uppercase tracking-wide ${stats.outstanding > 0 ? "text-amber-600" : "text-gray-400"}`}>
                      Outstanding
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{fmtMoney(stats.outstanding)}</p>
                  <p className="text-xs text-gray-500 mt-1">Uncollected payments</p>
                </div>
                {/* Fulfilled */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CheckCircle size={13} className="text-gray-500" />
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Fulfilled</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.total > 0
                      ? `${Math.round((stats.completed / stats.total) * 100)}% fulfillment rate`
                      : "of period orders"}
                  </p>
                </div>
              </div>

              {/* Overdue alert */}
              {stats.overdue > 0 && (
                <div className="mt-3 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-semibold">
                    {stats.overdue} overdue order{stats.overdue > 1 ? "s" : ""} need immediate attention.
                  </p>
                </div>
              )}
            </section>

            {/* 2. Pipeline + Top Products */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Order Pipeline */}
              <section>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Package size={14} className="text-purple-500" /> Order Pipeline
                </h3>
                <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50 overflow-hidden">
                  {PIPELINE_STAGES.map(stage => {
                    const count = pipeline[stage.key] || 0;
                    return (
                      <div key={stage.key} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${stage.color}`} />
                          <span className="text-sm text-gray-700">{stage.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-100 rounded-full h-1.5 hidden sm:block">
                            <div
                              className={`h-1.5 rounded-full ${stage.color} transition-all duration-500`}
                              style={{ width: `${(count / pipelineMax) * 100}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${count > 0 ? `${stage.bg} ${stage.text}` : "text-gray-400"}`}>
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
                    <span className="text-xs font-bold text-gray-500 uppercase">Total (period)</span>
                    <span className="text-sm font-bold text-gray-900">{stats.total}</span>
                  </div>
                </div>
              </section>

              {/* Top Products */}
              <section>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BarChart2 size={14} className="text-cyan-500" /> Top Products by Volume
                </h3>
                <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50 overflow-hidden">
                  {topProducts.length === 0 ? (
                    <p className="px-4 py-8 text-center text-gray-400 text-sm">No order data for this period</p>
                  ) : (
                    topProducts.map((p, i) => (
                      <div key={p.name} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-bold text-gray-300 w-4 flex-shrink-0">{i + 1}</span>
                          <span className="text-sm text-gray-800 font-medium truncate">{p.name}</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-sm font-bold text-gray-900">{p.count} pcs</p>
                          <p className="text-xs text-gray-400">{fmtMoney(p.revenue)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* 3. Inventory Health */}
            <section>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Warehouse size={14} className="text-amber-500" />
                Inventory Health
                {lowStockItems.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                    {lowStockItems.length} alerts
                  </span>
                )}
              </h3>
              {lowStockItems.length === 0 ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  <p className="text-sm text-green-700 font-medium">All materials are sufficiently stocked</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {lowStockItems.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-amber-600">Reorder at {item.reorderPoint} {item.unit}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-sm font-bold text-amber-700">{item.currentQty}</p>
                        <p className="text-xs text-amber-500">{item.unit} left</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 4. Recent Orders */}
            <section>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock size={14} className="text-gray-400" /> Recent Orders — {periodLabel}
              </h3>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {recentOrders.length === 0 ? (
                  <p className="px-4 py-8 text-center text-gray-400 text-sm">No orders in this period</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Order</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Product</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">Amount</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {recentOrders.map(o => (
                          <tr key={o.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="font-mono text-xs text-gray-700 font-semibold">{o.orderId}</p>
                              <p className="text-xs text-gray-400">{o.date}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-gray-800 truncate max-w-[110px]">{o.customerName}</p>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <p className="text-xs text-gray-500 truncate max-w-[110px]">{o.product}</p>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {fmtMoney(o.amount)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_BADGE[o.status] || "bg-gray-100 text-gray-500"}`}>
                                {STATUS_LABEL[o.status] || o.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* Footer */}
            <div className="pt-2 pb-1 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span>Operix Business Summary — {periodLabel}</span>
              <span>Generated {reportDate}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSummaryReport;
