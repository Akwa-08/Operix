import { StatusCard } from "../Shared/UI/StatusCard";
import { Package, Clock, CheckCircle, AlertTriangle } from "lucide-react";

const ProductionDashboard = () => {
  // DUMMY DATA - Only assigned production orders
  const stats = {
    assignedOrders: 4,
    inProduction: 2,
    completedToday: 1,
    lowStockAlerts: 3,
  };

  const productionQueue = [
    {
      orderId: "ORD-004",
      customer: "Bob Johnson",
      product: "Mug (100pcs)",
      dueDate: "2025-03-02",
      status: "Production",
      progress: 60,
    },
    {
      orderId: "ORD-006",
      customer: "Charlie Davis",
      product: "Sticker",
      dueDate: "2025-03-08",
      status: "Production",
      progress: 30,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Production Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage production orders and inventory
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatusCard
          title="Assigned to Me"
          value={stats.assignedOrders}
          icon={<Package size={18} />}
          iconColor="text-orange-600"
        />
        <StatusCard
          title="In Production"
          value={stats.inProduction}
          icon={<Clock size={18} />}
          iconColor="text-blue-600"
        />
        <StatusCard
          title="Completed Today"
          value={stats.completedToday}
          icon={<CheckCircle size={18} />}
          iconColor="text-green-600"
        />
        <StatusCard
          title="Low Stock Alerts"
          value={stats.lowStockAlerts}
          icon={<AlertTriangle size={18} />}
          iconColor="text-red-600"
        />
      </div>

      {/* Info Note */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-orange-900 font-medium">
          🏭 <strong>Production Role:</strong> View assigned orders, update
          production status, and create resupply requests when materials run low.
        </p>
      </div>

      {/* Production Queue */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          My Production Queue
        </h2>
        <div className="space-y-3">
          {productionQueue.map((order) => (
            <div
              key={order.orderId}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-bold text-gray-900">{order.orderId}</p>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                    In Production
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {order.customer} • {order.product}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full"
                      style={{ width: `${order.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">
                    {order.progress}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Due: {order.dueDate}</p>
              </div>
              <button className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors">
                Mark Complete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductionDashboard;
