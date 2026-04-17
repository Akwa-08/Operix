import { useMemo } from "react";
import {
  RefreshCw, TrendingUp, DollarSign, CreditCard,
  Package, AlertTriangle, CheckCircle, Clock,
} from "lucide-react";
import { useDashboardData } from "../../hooks/useSupabase";
import { KpiCard } from "../Shared/UI/KpiCard";
import { LoadingSpinner } from "../Shared/UI/LoadingSpinner";
import { fmtMoney } from "../../util/formatters";

// KpiCard, fmtMoney, and LoadingSpinner imported from shared modules

// Quick Action Card Component
const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}> = ({ title, description, icon, color, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left group w-full"
  >
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <h3 className="font-bold text-sm text-gray-900 mb-1 group-hover:text-cyan-600 transition-colors">
      {title}
    </h3>
    <p className="text-[10px] text-gray-500 leading-tight">{description}</p>
  </button>
);


// ─── Main Component ───────────────────────────────────────────────────────────
const CashierDashboard = () => {
  const { data: liveData, loading, refresh } = useDashboardData();

  // Raw orders for client-side period filtering
  const rawOrders = useMemo<any[]>(() => (liveData as any)?.rawOrders || [], [liveData]);

  // Today Orders
  const todayOrders = useMemo(() => {
    const start = new Date(); start.setHours(0,0,0,0);
    return rawOrders.filter(o => o.created_at && new Date(o.created_at) >= start);
  }, [rawOrders]);

  const stats = useMemo(() => {
    const revenue   = todayOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
    const collected = todayOrders.reduce((s, o) => s + (Number(o.amount_paid)  || 0), 0);
    
    // Active orders in pipeline (not completed/cancelled)
    const pendingOrders = rawOrders.filter(o => ["in_queue", "designing", "payment", "production"].includes(o.status)).length;
    
    return {
      revenue,
      collected,
      outstanding:    Math.max(0, revenue - collected),
      todayCount:     todayOrders.length,
      pendingOrders,
      completedToday: todayOrders.filter(o => o.status === "completed").length,
      lowStockItems:  (liveData?.lowStockItems || []).length,
    };
  }, [todayOrders, rawOrders, liveData]);

  const recentOrders   = useMemo(() => (liveData as any)?.recentOrders || [], [liveData]);
  const dateStr        = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  return (
    <div className="max-w-7xl mx-auto space-y-5 overflow-x-hidden">

      {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cashier Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{dateStr}</p>
        </div>
        <button
          onClick={() => refresh?.()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm self-start sm:self-auto"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── 2. KPI CARDS ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          title="Today's Orders"
          value={`${stats.todayCount}`}
          sub="Placed today"
          icon={<Package size={16} />} iconBg="bg-blue-100" iconColor="text-blue-600"
          accent="blue"
        />
        <KpiCard
          title="Pending Queue"
          value={`${stats.pendingOrders}`}
          sub="Active orders"
          icon={<Clock size={16} />} iconBg="bg-orange-100" iconColor="text-orange-600"
          accent="yellow"
        />
        <KpiCard
          title="Done Today"
          value={`${stats.completedToday}`}
          sub="Completed today"
          icon={<CheckCircle size={16} />} iconBg="bg-green-100" iconColor="text-green-600"
        />
        <KpiCard
          title="Low Stock"
          value={`${stats.lowStockItems}`}
          sub="Items need attention"
          icon={<AlertTriangle size={16} />} iconBg="bg-red-100" iconColor="text-red-600"
          accent={stats.lowStockItems > 0 ? "red" : "none"}
        />
        <KpiCard
          title="Today's Revenue"
          value={fmtMoney(stats.revenue)}
          sub="Total ordered today"
          icon={<TrendingUp size={16} />} iconBg="bg-cyan-100" iconColor="text-cyan-600"
        />
        <KpiCard
          title="Today's Collection"
          value={fmtMoney(stats.collected)}
          sub="Actual cash collected"
          icon={<DollarSign size={16} />} iconBg="bg-emerald-100" iconColor="text-emerald-600"
          accent="green"
        />
      </div>

      {/* ── 3. ACTIONS AND RECENT ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Quick Actions (1/3 cols) */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionCard
              title="New Order"
              description="Create a walk-in order"
              icon={<Package size={20} />}
              color="bg-cyan-100 text-cyan-600"
              onClick={() => (window.location.href = "/cashier/orders")}
            />
            <QuickActionCard
              title="Process Payment"
              description="Manage balance dues"
              icon={<CreditCard size={20} />}
              color="bg-green-100 text-green-600"
              onClick={() => (window.location.href = "/cashier/orders")}
            />
            <QuickActionCard
              title="Deliveries"
              description="Receive incoming stock"
              icon={<Package size={20} />}
              color="bg-purple-100 text-purple-600"
              onClick={() => (window.location.href = "/cashier/inventory")}
            />
            <QuickActionCard
              title="Low Stock"
              description="View depleted inventory"
              icon={<AlertTriangle size={20} />}
              color="bg-red-100 text-red-600"
              onClick={() => (window.location.href = "/cashier/inventory")}
            />
          </div>
        </div>

        {/* Recent Orders (2/3 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-base font-bold text-gray-900">Recent Orders</h3>
             <button
              onClick={() => (window.location.href = "/cashier/orders")}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700"
             >
               View All
             </button>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No orders today.</div>
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
                      <td className="py-3 pr-4 font-medium text-gray-900 text-sm">
                        {o.order_number || o.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm hidden sm:table-cell truncate max-w-[120px]">
                        {o.customer ? `${o.customer.first_name} ${o.customer.last_name}` : o.guest_name || "Walk-in"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide capitalize
                          ${o.status === "completed" ? "bg-gray-100 text-gray-600" :
                            o.status === "in_queue" ? "bg-blue-100 text-blue-700" :
                            ["designing", "payment", "production"].includes(o.status) ? "bg-purple-100 text-purple-700" :
                            o.status === "pickup" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}
                        `}>
                          {o.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 pl-4 text-right font-medium text-gray-900 text-sm flex gap-1 justify-end items-center">
                        <span className="text-[10px]">&</span> {fmtMoney(o.total_amount)}
                      </td>
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
