import { StatusCard } from "../Shared/UI/StatusCard";

import {
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

const CashierDashboard = () => {
  // DUMMY DATA - Replace with API
  const stats = {
    todayOrders: 12,
    pendingOrders: 8,
    completedToday: 4,
    lowStockItems: 3,
    todayRevenue: 45000,
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cashier Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of today's operations
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatusCard
          title="Today's Orders"
          value={stats.todayOrders}
          icon={<Package size={18} />}
          iconColor="text-cyan-600"
          trend="+3 from yesterday"
          trendUp={true}
        />
        <StatusCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={<Clock size={18} />}
          iconColor="text-orange-600"
        />
        <StatusCard
          title="Completed Today"
          value={stats.completedToday}
          icon={<CheckCircle size={18} />}
          iconColor="text-green-600"
        />
        <StatusCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={<AlertCircle size={18} />}
          iconColor="text-red-600"
        />
        <StatusCard
          title="Today's Revenue"
          value={stats.todayRevenue}
          icon={<TrendingUp size={18} />}
          iconColor="text-green-600"
          trend="+12% from yesterday"
          trendUp={true}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionCard
            title="Create Order"
            description="Add new customer order"
            icon={<Package size={24} />}
            color="bg-cyan-100 text-cyan-600"
            onClick={() => (window.location.href = "/cashier/orders")}
          />
          <QuickActionCard
            title="Check Inventory"
            description="View stock levels"
            icon={<Package size={24} />}
            color="bg-purple-100 text-purple-600"
            onClick={() => (window.location.href = "/cashier/inventory")}
          />
          <QuickActionCard
            title="View Orders"
            description="Manage orders"
            icon={<Clock size={24} />}
            color="bg-orange-100 text-orange-600"
            onClick={() => (window.location.href = "/cashier/orders")}
          />
          <QuickActionCard
            title="Update Stock"
            description="Adjust inventory"
            icon={<AlertCircle size={24} />}
            color="bg-green-100 text-green-600"
            onClick={() => (window.location.href = "/cashier/inventory")}
          />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
        <div className="space-y-3">
          <RecentOrderCard
            orderId="ORD-001"
            customer="John Doe"
            product="Tarpaulin"
            amount={5000}
            status="In Queue"
          />
          <RecentOrderCard
            orderId="ORD-002"
            customer="Jane Smith"
            product="T-Shirt (50pcs)"
            amount={8500}
            status="Designing"
          />
          <RecentOrderCard
            orderId="ORD-003"
            customer="Bob Johnson"
            product="Mug"
            amount={2000}
            status="Payment"
          />
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;

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
    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left group"
  >
    <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-cyan-600 transition-colors">
      {title}
    </h3>
    <p className="text-xs text-gray-600">{description}</p>
  </button>
);

// Recent Order Card Component
const RecentOrderCard: React.FC<{
  orderId: string;
  customer: string;
  product: string;
  amount: number;
  status: string;
}> = ({ orderId, customer, product, amount, status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Queue":
        return "bg-blue-100 text-blue-700";
      case "Designing":
        return "bg-purple-100 text-purple-700";
      case "Payment":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <p className="font-bold text-gray-900">{orderId}</p>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
              status
            )}`}
          >
            {status}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          {customer} • {product}
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-gray-900">
          ₱{amount.toLocaleString()}
        </p>
      </div>
    </div>
  );
};
