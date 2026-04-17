import { useMemo } from "react";
import { Package, Clock, CheckCircle, Upload, RefreshCw } from "lucide-react";
import { KpiCard } from "../Shared/UI/KpiCard";
import { LoadingSpinner } from "../Shared/UI/LoadingSpinner";
import { PageHeader } from "../Shared/UI/PageHeader";
import { InfoBanner } from "../Shared/UI/InfoBanner";
import { getOrderStatusColor } from "../../util/formatters";
import { useOrdersData } from "../../hooks/useSupabase";

const DesignerDashboard = () => {
  const { orders, loading, refresh } = useOrdersData();

  const stats = useMemo(() => ({
    assigned:    orders.length,
    inProgress:  orders.filter(o => o.status === "Designing").length,
    completed:   orders.filter(o => !["Designing", "In Queue"].includes(o.status)).length,
    uploadedToday: orders.filter(o => {
      if (!o.dateOrdered) return false;
      return new Date(o.dateOrdered).toDateString() === new Date().toDateString();
    }).length,
  }), [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  return (
    <div className="max-w-7xl mx-auto space-y-5 overflow-x-hidden">

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Designer Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{dateStr}</p>
        </div>
        <button
          onClick={() => refresh?.()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm self-start sm:self-auto"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── KPI CARDS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          title="Assigned to Me"
          value={`${stats.assigned}`}
          sub="Total orders"
          icon={<Package size={16} />} iconBg="bg-purple-100" iconColor="text-purple-600"
          accent="blue"
        />
        <KpiCard
          title="In Progress"
          value={`${stats.inProgress}`}
          sub="Currently designing"
          icon={<Clock size={16} />} iconBg="bg-orange-100" iconColor="text-orange-600"
          accent="yellow"
        />
        <KpiCard
          title="Completed"
          value={`${stats.completed}`}
          sub="Design finished"
          icon={<CheckCircle size={16} />} iconBg="bg-green-100" iconColor="text-green-600"
          accent="green"
        />
        <KpiCard
          title="Today's Activity"
          value={`${stats.uploadedToday}`}
          sub="Orders today"
          icon={<Upload size={16} />} iconBg="bg-cyan-100" iconColor="text-cyan-600"
        />
      </div>

      {/* ── INFO NOTE ───────────────────────────────────────────────── */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-sm text-purple-900 font-medium">
          📐 <strong>Designer Role:</strong> View orders assigned to you, upload designs, and update design status. Contact admin for order reassignment.
        </p>
      </div>

      {/* ── RECENT ASSIGNED ORDERS ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">My Assigned Orders</h3>
            <p className="text-xs text-gray-400">Recent design assignments</p>
          </div>
          <a href="/designer/orders" className="text-xs font-semibold text-cyan-600 hover:text-cyan-700">View All</a>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No orders assigned to you yet</div>
        ) : (
          <>
            {/* MOBILE: stacked cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{order.orderId}</p>
                      <p className="text-xs text-gray-500 truncate">{order.customerName} · {order.productType}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                      getOrderStatusColor(order.status)}`}>{order.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Qty: {order.quantity}</span>
                    <span className="text-xs text-gray-400">Due: {order.dueDate || "—"}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Order</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{order.orderId}</td>
                      <td className="px-4 py-3">{order.customerName}</td>
                      <td className="px-4 py-3 text-gray-600">{order.productType}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getOrderStatusColor(order.status)}`}>{order.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{order.dueDate || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DesignerDashboard;
