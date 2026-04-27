import {useMemo} from "react";
import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {KpiCard} from "../Shared/UI/KpiCard";
import {LoadingSpinner} from "../Shared/UI/LoadingSpinner";
import {PageHeader} from "../Shared/UI/PageHeader";
import {InfoBanner} from "../Shared/UI/InfoBanner";
import {useOrdersData, useInventoryData, useMyProfile} from "../../hooks/useSupabase";

const ProductionDashboard = () => {
  const { profile } = useMyProfile();
  const {orders: allOrders, loading: ordersLoading, refresh} = useOrdersData();

  const orders = useMemo(() => 
    allOrders.filter(o => o.assignedProduction === profile?.id),
    [allOrders, profile?.id]
  );
  const {stats: materialStats, loading: matLoading} = useInventoryData();
  const loading = ordersLoading || matLoading;

  const stats = useMemo(
    () => ({
      assigned: orders.length,
      inProduction: orders.filter((o) => o.status === "Production").length,
      completedToday: orders.filter((o) => {
        if (o.status !== "Pickup" && o.status !== "Completed") return false;
        if (!o.dateOrdered) return false;
        return (
          new Date(o.dateOrdered).toDateString() === new Date().toDateString()
        );
      }).length,
      lowStockAlerts: materialStats?.lowStock || 0,
    }),
    [orders, materialStats],
  );

  const productionQueue = useMemo(
    () => orders.filter((o) => o.status === "Production").slice(0, 6),
    [orders],
  );

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  return (
    <div className="max-w-7xl mx-auto space-y-5 overflow-x-hidden">
      <PageHeader title="Production Dashboard" subtitle={dateStr}>
        <button
          onClick={() => refresh?.()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </PageHeader>

      {/* ── KPI CARDS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          title="Assigned to Me"
          value={`${stats.assigned}`}
          sub="Total orders"
          icon={<Package size={16} />}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          accent="blue"
        />
        <KpiCard
          title="In Production"
          value={`${stats.inProduction}`}
          sub="Currently producing"
          icon={<Clock size={16} />}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          accent="yellow"
        />
        <KpiCard
          title="Completed Today"
          value={`${stats.completedToday}`}
          sub="Marked ready"
          icon={<CheckCircle size={16} />}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          accent="green"
        />
        <KpiCard
          title="Low Stock Alerts"
          value={`${stats.lowStockAlerts}`}
          sub="Materials running low"
          icon={<AlertTriangle size={16} />}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          accent={stats.lowStockAlerts > 0 ? "red" : "none"}
        />
      </div>

      <InfoBanner color="orange">
        🏭 <strong>Production Role:</strong> View assigned orders, update
        production status, and create resupply requests when materials run low.
      </InfoBanner>

      {/* ── PRODUCTION QUEUE ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              My Production Queue
            </h3>
            <p className="text-xs text-gray-400">
              Orders currently in production
            </p>
          </div>
          <a
            href="/production/orders"
            className="text-xs font-semibold text-cyan-600 hover:text-cyan-700">
            View All
          </a>
        </div>

        {productionQueue.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No active production orders
          </div>
        ) : (
          <>
            {/* MOBILE: stacked cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {productionQueue.map((order: any) => (
                <div key={order.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">
                        {order.orderId}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {order.customerName} · {order.productType}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 flex-shrink-0">
                      In Production
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Qty: {order.quantity}</span>
                    <span className="text-xs text-gray-400">
                      Due: {order.dueDate || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP: table */}
            <div className="hidden md:block overflow-x-auto">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Order
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Product
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Due
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productionQueue.map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">
                          {order.orderId}
                        </td>
                        <td className="px-4 py-3">{order.customerName}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {order.productType}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {order.quantity}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                            In Production
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {order.dueDate || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductionDashboard;
