import { useMemo } from "react";
import {
  RefreshCw, TrendingUp, DollarSign, CreditCard,
  Package, AlertTriangle, CheckCircle, Clock,
} from "lucide-react";
import { useDashboard } from "../../hooks/useSupabase";

// ─── Utility functions ────────────────────────────────────────────────────────
function fmtMoney(v: number | undefined | null) {
  const n = Number(v) || 0;
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(0)}k`;
  return `₱${n.toLocaleString()}`;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  title: string; value: string; sub?: string;
  icon: React.ReactNode; iconBg: string; iconColor: string;
  accent?: "red" | "green" | "yellow" | "blue" | "none";
}> = ({ title, value, sub, icon, iconBg, iconColor, accent = "none" }) => {
  const border = {
    red:    "border-l-4 border-l-red-400",
    green:  "border-l-4 border-l-green-400",
    yellow: "border-l-4 border-l-amber-400",
    blue:   "border-l-4 border-l-cyan-400",
    none:   "",
  }[accent];
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm ${border}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{title}</p>
        <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5 truncate">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
};

const QuickActionCard: React.FC<{
  title: string; description: string; icon: React.ReactNode; color: string; onClick: () => void;
}> = ({ title, description, icon, color, onClick }) => (
  <button onClick={onClick} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left group w-full">
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>{icon}</div>
    <h3 className="font-bold text-sm text-gray-900 mb-1 group-hover:text-cyan-600 transition-colors">{title}</h3>
    <p className="text-[10px] text-gray-500 leading-tight">{description}</p>
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const CashierDashboard = () => {
  const { orderStats, invStats, lowStockItems, recentOrders, loading } = useDashboard();

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return (
    <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" />
      <p className="ml-4 text-gray-500">Loading dashboard...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5 overflow-x-hidden">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cashier Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{dateStr}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard title="Total Orders" value={`${orderStats?.total ?? 0}`} sub="All orders" icon={<Package size={16} />} iconBg="bg-blue-100" iconColor="text-blue-600" accent="blue" />
        <KpiCard title="Pending Queue" value={`${(orderStats?.inQueue ?? 0) + (orderStats?.designing ?? 0) + (orderStats?.production ?? 0)}`} sub="Active orders" icon={<Clock size={16} />} iconBg="bg-orange-100" iconColor="text-orange-600" accent="yellow" />
        <KpiCard title="Completed" value={`${orderStats?.completed ?? 0}`} sub="Finished orders" icon={<CheckCircle size={16} />} iconBg="bg-green-100" iconColor="text-green-600" />
        <KpiCard title="Low Stock" value={`${invStats?.lowStock ?? 0}`} sub="Items need attention" icon={<AlertTriangle size={16} />} iconBg="bg-red-100" iconColor="text-red-600" accent={invStats?.lowStock > 0 ? "red" : "none"} />
        <KpiCard title="Total Revenue" value={fmtMoney(orderStats?.totalRevenue)} sub="All time" icon={<TrendingUp size={16} />} iconBg="bg-cyan-100" iconColor="text-cyan-600" />
        <KpiCard title="Collected" value={fmtMoney(orderStats?.totalCollected)} sub="Actual cash received" icon={<DollarSign size={16} />} iconBg="bg-emerald-100" iconColor="text-emerald-600" accent="green" />
      </div>

      {/* Actions + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionCard title="New Order" description="Create a walk-in order" icon={<Package size={20} />} color="bg-cyan-100 text-cyan-600" onClick={() => (window.location.href = "/cashier/orders")} />
            <QuickActionCard title="Process Payment" description="Manage balance dues" icon={<CreditCard size={20} />} color="bg-green-100 text-green-600" onClick={() => (window.location.href = "/cashier/orders")} />
            <QuickActionCard title="Deliveries" description="Receive incoming stock" icon={<Package size={20} />} color="bg-purple-100 text-purple-600" onClick={() => (window.location.href = "/cashier/inventory")} />
            <QuickActionCard title="Low Stock" description="View depleted inventory" icon={<AlertTriangle size={20} />} color="bg-red-100 text-red-600" onClick={() => (window.location.href = "/cashier/inventory")} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Recent Orders</h3>
            <button onClick={() => (window.location.href = "/cashier/orders")} className="text-xs font-semibold text-cyan-600 hover:text-cyan-700">View All</button>
          </div>

          {!recentOrders?.length ? (
            <div className="text-center py-10 text-gray-400 text-sm">No recent orders.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 pr-4 text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                    <th className="pb-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Customer</th>
                    <th className="pb-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="pb-3 pl-4 text-xs font-semibold text-gray-500 uppercase text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => (window.location.href = "/cashier/orders")}>
                      <td className="py-3 pr-4 font-medium text-gray-900 text-sm">{o.orderId || o.id?.slice(0, 8)}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm hidden sm:table-cell truncate max-w-[120px]">{o.customerName || 'Walk-in'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize
                          ${o.status === "completed" ? "bg-gray-100 text-gray-600" :
                            o.status === "In Queue" || o.status === "in_queue" ? "bg-blue-100 text-blue-700" :
                            o.status === "Pickup" || o.status === "pickup" ? "bg-green-100 text-green-700" :
                            "bg-purple-100 text-purple-700"}`}>
                          {String(o.status).replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 pl-4 text-right font-medium text-gray-900 text-sm">{fmtMoney(o.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;