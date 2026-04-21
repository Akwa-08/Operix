import { useState, useMemo } from "react";
import {
  RefreshCw, TrendingUp, DollarSign, CreditCard,
  Package, AlertTriangle, CheckCircle,
  Users, Warehouse, ClipboardList, MessageSquare, Activity,
} from "lucide-react";
import { useDashboardData } from "../../hooks/useSupabase";
import { KpiCard } from "../Shared/UI/KpiCard";
import { LoadingSpinner } from "../Shared/UI/LoadingSpinner";
import { fmtMoney } from "../../util/formatters";

// ─── Quick Action Card ────────────────────────────────────────────────────────
const QuickActionCard: React.FC<{
  title: string; description: string; icon: React.ReactNode; color: string; onClick: () => void;
}> = ({ title, description, icon, color, onClick }) => (
  <button onClick={onClick}
    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left group w-full">
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>{icon}</div>
    <h3 className="font-bold text-sm text-gray-900 mb-1 group-hover:text-cyan-600 transition-colors">{title}</h3>
    <p className="text-[10px] text-gray-500 leading-tight">{description}</p>
  </button>
);

// ─── Types ────────────────────────────────────────────────────────────────────
type Period = "today" | "week" | "month" | "3months" | "year" | "all";
type ChartType = "revenue" | "volume" | "collection";

// ─── Constants ────────────────────────────────────────────────────────────────
const PERIODS: { key: Period; label: string }[] = [
  { key: "today",   label: "Today" },
  { key: "week",    label: "This Week" },
  { key: "month",   label: "This Month" },
  { key: "3months", label: "3 Months" },
  { key: "year",    label: "This Year" },
  { key: "all",     label: "All Time" },
];

const CHART_TYPES: { key: ChartType; label: string; color: string }[] = [
  { key: "revenue",    label: "₱ Revenue",     color: "#0ea5e9" },
  { key: "volume",     label: "Order Volume",  color: "#8b5cf6" },
  { key: "collection", label: "Collection %",  color: "#10b981" },
];

const PIPELINE_STAGES = [
  { key: "in_queue",   label: "In Queue",         color: "#3b82f6", bg: "bg-blue-100 text-blue-700" },
  { key: "designing",  label: "Designing",         color: "#8b5cf6", bg: "bg-purple-100 text-purple-700" },
  { key: "payment",    label: "Payment",           color: "#f59e0b", bg: "bg-amber-100 text-amber-700" },
  { key: "production", label: "Production",        color: "#f97316", bg: "bg-orange-100 text-orange-700" },
  { key: "pickup",     label: "Ready for Pickup",  color: "#10b981", bg: "bg-green-100 text-green-700" },
  { key: "completed",  label: "Completed",         color: "#6b7280", bg: "bg-gray-100 text-gray-700" },
];

// ─── Utility functions ────────────────────────────────────────────────────────
function getPeriodStart(period: Period): Date {
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

function filterByPeriod(orders: any[], period: Period): any[] {
  if (period === "all") return orders;
  const start = getPeriodStart(period);
  return orders.filter(o => o.created_at && new Date(o.created_at) >= start);
}

function computeStats(orders: any[]) {
  const now = new Date();
  const revenue   = orders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
  const collected = orders.reduce((s, o) => s + (Number(o.amount_paid)  || 0), 0);
  return {
    revenue,
    collected,
    outstanding:    Math.max(0, revenue - collected),
    total:          orders.length,
    completed:      orders.filter(o => o.status === "completed").length,
    overdue:        orders.filter(o =>
      o.due_date && new Date(o.due_date) < now &&
      !["completed", "pickup", "cancelled"].includes(o.status)
    ).length,
    collectionRate: revenue > 0 ? Math.round((collected / revenue) * 100) : 0,
  };
}

type Bucket = { label: string; start: Date; end: Date };

function getBuckets(period: Period): Bucket[] {
  const now = new Date();
  if (period === "today") {
    return Array.from({ length: 8 }).map((_, i) => {
      const h = new Date(now); h.setHours(now.getHours() - (7 - i), 0, 0, 0);
      const end = new Date(h); end.setMinutes(59, 59, 999);
      return { label: h.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }), start: new Date(h), end };
    });
  }
  if (period === "week") {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - (6 - i));
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      return { label: d.toLocaleDateString("en-US", { weekday: "short" }), start, end };
    });
  }
  if (period === "month") {
    const dim  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const step = Math.ceil(dim / 8);
    const buckets: Bucket[] = [];
    for (let day = 1; day <= dim; day += step) {
      const start = new Date(now.getFullYear(), now.getMonth(), day);
      const end   = new Date(now.getFullYear(), now.getMonth(), Math.min(day + step - 1, dim), 23, 59, 59);
      buckets.push({ label: String(day), start, end });
    }
    return buckets;
  }
  if (period === "3months") {
    return Array.from({ length: 3 }).map((_, i) => {
      const start = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1);
      const end   = new Date(now.getFullYear(), now.getMonth() - (2 - i) + 1, 0, 23, 59, 59);
      return { label: start.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), start, end };
    });
  }
  if (period === "year") {
    return Array.from({ length: 12 }).map((_, i) => {
      const start = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const end   = new Date(now.getFullYear(), now.getMonth() - (11 - i) + 1, 0, 23, 59, 59);
      return { label: start.toLocaleDateString("en-US", { month: "short" }), start, end };
    });
  }
  // all → last 6 months
  return Array.from({ length: 6 }).map((_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 0, 23, 59, 59);
    return { label: start.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), start, end };
  });
}

function buildChartData(orders: any[], period: Period, chartType: ChartType) {
  return getBuckets(period).map(b => {
    const bo = orders.filter(o => {
      if (!o.created_at) return false;
      const d = new Date(o.created_at);
      return d >= b.start && d <= b.end;
    });
    let value = 0;
    if (chartType === "revenue") {
      value = bo.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
    } else if (chartType === "volume") {
      value = bo.length;
    } else {
      const rev = bo.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
      const col = bo.reduce((s, o) => s + (Number(o.amount_paid)  || 0), 0);
      value = rev > 0 ? Math.round((col / rev) * 100) : 0;
    }
    return { label: b.label, value };
  });
}

// KpiCard, fmtMoney, and LoadingSpinner imported from shared modules

// ─── Bar Chart ────────────────────────────────────────────────────────────────
const BarChart: React.FC<{
  data: { label: string; value: number }[];
  chartType: ChartType;
  color: string;
}> = ({ data, chartType, color }) => {
  const W = 560; const H = 160;
  const PT = 18; const PB = 28; const PL = 6; const PR = 6; const GAP = 5;
  const plotH = H - PT - PB;
  const plotW = W - PL - PR;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(8, (plotW - GAP * (data.length - 1)) / data.length);

  const fmt = (v: number) =>
    chartType === "revenue"    ? fmtMoney(v) :
    chartType === "collection" ? `${v}%`     : `${v}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0, 0.5, 1].map((f, i) => (
        <line key={i}
          x1={PL} y1={PT + f * plotH} x2={W - PR} y2={PT + f * plotH}
          stroke={f === 1 ? "#d1d5db" : "#e5e7eb"} strokeWidth="1"
          strokeDasharray={f === 0 ? undefined : "3 3"}
        />
      ))}
      {/* Bars + labels */}
      {data.map((d, i) => {
        const x  = PL + i * (barW + GAP);
        const bh = maxVal > 0 ? (d.value / maxVal) * plotH : 0;
        const y  = PT + plotH - bh;
        const rx = Math.min(3, barW / 3);
        return (
          <g key={i}>
            {bh > 1 ? (
              <rect x={x} y={y} width={barW} height={bh} rx={rx} fill={color} opacity={0.85}>
                <title>{d.label}: {fmt(d.value)}</title>
              </rect>
            ) : (
              <rect x={x} y={PT + plotH - 2} width={barW} height={2} rx={1} fill={color} opacity={0.25} />
            )}
            {bh > 10 && (
              <text x={x + barW / 2} y={Math.max(y - 3, PT + 9)}
                textAnchor="middle" fontSize={8} fill="#6b7280" fontWeight="600">
                {fmt(d.value)}
              </text>
            )}
            <text x={x + barW / 2} y={H - 4}
              textAnchor="middle" fontSize={8.5} fill="#9ca3af">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [period, setPeriod]       = useState<Period>("month");
  const [chartType, setChartType] = useState<ChartType>("revenue");
  const { data: liveData, loading, refresh } = useDashboardData();

  // Raw orders for client-side period filtering
  const rawOrders = useMemo<any[]>(() => (liveData as any)?.rawOrders || [], [liveData]);

  // Period-scoped data
  const periodOrders = useMemo(() => filterByPeriod(rawOrders, period), [rawOrders, period]);
  const stats        = useMemo(() => computeStats(periodOrders), [periodOrders]);
  const chartData    = useMemo(
    () => buildChartData(periodOrders, period, chartType),
    [periodOrders, period, chartType]
  );

  // All-time pipeline counts (current operational state)
  const pipeline = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of rawOrders) counts[o.status] = (counts[o.status] || 0) + 1;
    return PIPELINE_STAGES.map(s => ({ ...s, count: counts[s.key] || 0 }));
  }, [rawOrders]);
  const pipelineMax = Math.max(...pipeline.map(p => p.count), 1);

  // Overdue attention list
  const overdueList = useMemo(() => {
    const now = new Date();
    return rawOrders
      .filter(o =>
        o.due_date && new Date(o.due_date) < now &&
        !["completed", "pickup", "cancelled"].includes(o.status)
      )
      .slice(0, 5)
      .map(o => ({
        orderId:  o.order_number || o.id,
        customer: o.customer
          ? (`${o.customer.first_name || ""} ${o.customer.last_name || ""}`.trim() || "Walk-in")
          : "Walk-in",
        product:  o.order_items?.[0]?.product_name || "—",
        dueDate:  o.due_date ? new Date(o.due_date).toLocaleDateString() : "",
        status:   o.status,
      }));
  }, [rawOrders]);

  const lowStockItems  = useMemo(() => (liveData?.lowStockItems || []).slice(0, 5), [liveData]);
  const recentOrders   = useMemo(() => (liveData as any)?.recentOrders || [], [liveData]);
  const activeChart    = CHART_TYPES.find(c => c.key === chartType)!;
  const periodLabel    = PERIODS.find(p => p.key === period)?.label ?? "";
  const dateStr        = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  return (
    <div className="max-w-7xl mx-auto space-y-5 overflow-x-hidden">

      {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{dateStr}</p>
        </div>
        <button
          onClick={() => refresh?.()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm self-start sm:self-auto"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── 2. PERIOD SELECTOR ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-1.5 shadow-sm">
        <div className="flex gap-1 overflow-x-auto">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                period === p.key
                  ? "bg-cyan-500 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. KPI CARDS ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          title="Revenue"
          value={fmtMoney(stats.revenue)}
          sub={`${periodLabel} billed`}
          icon={<TrendingUp size={16} />} iconBg="bg-cyan-100" iconColor="text-cyan-600"
          accent="blue"
        />
        <KpiCard
          title="Collected"
          value={fmtMoney(stats.collected)}
          sub={`${stats.collectionRate}% collection rate`}
          icon={<DollarSign size={16} />} iconBg="bg-green-100" iconColor="text-green-600"
          accent="green"
        />
        <KpiCard
          title="Outstanding"
          value={fmtMoney(stats.outstanding)}
          sub="Uncollected payments"
          icon={<CreditCard size={16} />} iconBg="bg-amber-100" iconColor="text-amber-600"
          accent={stats.outstanding > 0 ? "yellow" : "green"}
        />
        <KpiCard
          title="Orders"
          value={`${stats.total}`}
          sub={`Placed — ${periodLabel}`}
          icon={<Package size={16} />} iconBg="bg-purple-100" iconColor="text-purple-600"
        />
        <KpiCard
          title="Completed"
          value={`${stats.completed}`}
          sub={stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}% fulfillment rate` : "of period orders"}
          icon={<CheckCircle size={16} />} iconBg="bg-green-100" iconColor="text-green-600"
          accent="green"
        />
        <KpiCard
          title="Overdue"
          value={`${stats.overdue}`}
          sub="Need immediate action"
          icon={<AlertTriangle size={16} />} iconBg="bg-red-100" iconColor="text-red-600"
          accent={stats.overdue > 0 ? "red" : "none"}
        />
      </div>

      {/* ── QUICK ACTIONS ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickActionCard
            title="New Order"
            description="Create a walk-in order"
            icon={<Package size={20} />}
            color="bg-cyan-100 text-cyan-600"
            onClick={() => (window.location.href = "/admin/orders")}
          />
          <QuickActionCard
            title="Manage Users"
            description="Staff & customer accounts"
            icon={<Users size={20} />}
            color="bg-blue-100 text-blue-600"
            onClick={() => (window.location.href = "/admin/users")}
          />
          <QuickActionCard
            title="Inventory"
            description="Stock levels & deliveries"
            icon={<Warehouse size={20} />}
            color="bg-purple-100 text-purple-600"
            onClick={() => (window.location.href = "/admin/inventory")}
          />
          <QuickActionCard
            title="Payroll"
            description="Attendance & salary"
            icon={<ClipboardList size={20} />}
            color="bg-green-100 text-green-600"
            onClick={() => (window.location.href = "/admin/payroll")}
          />
          <QuickActionCard
            title="Audit Logs"
            description="System activity trail"
            icon={<Activity size={20} />}
            color="bg-orange-100 text-orange-600"
            onClick={() => (window.location.href = "/admin/logs")}
          />
          <QuickActionCard
            title="Messages"
            description="Chat with staff & clients"
            icon={<MessageSquare size={20} />}
            color="bg-pink-100 text-pink-600"
            onClick={() => (window.location.href = "/admin/messages")}
          />
        </div>
      </div>

      {/* ── 4. CHART + PIPELINE ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Chart — 3/5 cols */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Performance Chart</h3>
              <p className="text-xs text-gray-400">{periodLabel} · {activeChart.label}</p>
            </div>
            {/* Chart type selector — wraps on mobile */}
            <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1 self-start">
              {CHART_TYPES.map(ct => (
                <button
                  key={ct.key}
                  onClick={() => setChartType(ct.key)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    chartType === ct.key
                      ? "bg-white shadow-sm text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {ct.key === "revenue" ? "Revenue" : ct.key === "volume" ? "Volume" : "Collection"}
                </button>
              ))}
            </div>
          </div>

          {chartData.every(d => d.value === 0) ? (
            <div className="flex items-center justify-center h-44 text-gray-400 text-sm bg-gray-50 rounded-lg">
              No data for this period
            </div>
          ) : (
            <BarChart data={chartData} chartType={chartType} color={activeChart.color} />
          )}

          {/* Footer summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">{fmtMoney(stats.revenue)}</p>
              <p className="text-xs text-gray-400">Revenue</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{fmtMoney(stats.collected)}</p>
              <p className="text-xs text-gray-400">Collected</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.collectionRate}%</p>
              <p className="text-xs text-gray-400">Collection Rate</p>
            </div>
          </div>
        </div>

        {/* Order Pipeline — 2/5 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">Order Pipeline</h3>
            <p className="text-xs text-gray-400">Current state of all orders</p>
          </div>
          <div className="space-y-3">
            {pipeline.map(stage => (
              <div key={stage.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{stage.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${stage.bg}`}>
                    {stage.count}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(stage.count / pipelineMax) * 100}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
            <span className="text-gray-500">Active (excl. completed)</span>
            <span className="font-bold text-gray-900">
              {pipeline.filter(s => s.key !== "completed").reduce((s, p) => s + p.count, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* ── 5. ATTENTION ALERTS + RECENT ORDERS ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Attention Panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-gray-900">Needs Attention</h3>

          {/* Overdue orders */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-red-500" />
              <span className="text-sm font-semibold text-gray-700">Overdue Orders</span>
              {overdueList.length > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                  {overdueList.length}
                </span>
              )}
            </div>
            {overdueList.length === 0 ? (
              <p className="text-sm text-green-600 font-medium bg-green-50 rounded-lg px-3 py-2">
                ✅ No overdue orders
              </p>
            ) : (
              <div className="space-y-2">
                {overdueList.map((o, i) => (
                  <div key={i} className="flex items-start justify-between p-3 bg-red-50 rounded-lg gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{o.orderId}</p>
                      <p className="text-xs text-gray-500 truncate">{o.customer} · {o.product}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-red-600 font-semibold">Due {o.dueDate}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        PIPELINE_STAGES.find(s => s.key === o.status)?.bg || "bg-gray-100 text-gray-700"
                      }`}>
                        {PIPELINE_STAGES.find(s => s.key === o.status)?.label || o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low stock */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Package size={15} className="text-amber-500" />
              <span className="text-sm font-semibold text-gray-700">Low Stock Alerts</span>
              {lowStockItems.length > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                  {lowStockItems.length}
                </span>
              )}
            </div>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-green-600 font-medium bg-green-50 rounded-lg px-3 py-2">
                ✅ All materials sufficient
              </p>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Reorder at {item.reorderPoint} {item.unit}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-amber-700">{item.currentQty} {item.unit}</p>
                      <p className="text-xs text-amber-500">remaining</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Recent Orders</h3>
            <p className="text-xs text-gray-400">Last 8 orders in the system</p>
          </div>

          {/* MOBILE: stacked cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">No orders yet</p>
            ) : recentOrders.map((o: any, i: number) => (
              <div key={i} className="p-4 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{o.orderId}</p>
                    <p className="text-xs text-gray-500 truncate">{o.customerName} · {o.product}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      PIPELINE_STAGES.find(s => s.key === o.status)?.bg || "bg-gray-100 text-gray-700"
                    }`}>
                      {PIPELINE_STAGES.find(s => s.key === o.status)?.label || o.status || "—"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      o.paymentStatus === "paid"    ? "bg-green-100 text-green-700" :
                      o.paymentStatus === "partial" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {o.paymentStatus
                        ? o.paymentStatus.charAt(0).toUpperCase() + o.paymentStatus.slice(1)
                        : "Unpaid"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">₱{(o.amount || 0).toLocaleString()}</span>
                  <span className="text-xs text-gray-400">{o.date}</span>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP: table */}
          <div className="hidden md:block overflow-x-auto">
            <div className="overflow-x-auto w-full">
<table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Order</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No orders yet</td>
                  </tr>
                ) : recentOrders.map((o: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-gray-700">{o.orderId}</p>
                      <p className="text-xs text-gray-400">{o.date}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-[120px]">{o.customerName}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[120px]">{o.product}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      ₱{(o.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        PIPELINE_STAGES.find(s => s.key === o.status)?.bg || "bg-gray-100 text-gray-700"
                      }`}>
                        {PIPELINE_STAGES.find(s => s.key === o.status)?.label || o.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        o.paymentStatus === "paid"    ? "bg-green-100 text-green-700" :
                        o.paymentStatus === "partial" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {o.paymentStatus
                          ? o.paymentStatus.charAt(0).toUpperCase() + o.paymentStatus.slice(1)
                          : "Unpaid"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;