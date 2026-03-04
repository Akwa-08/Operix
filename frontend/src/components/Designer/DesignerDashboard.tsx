import { StatusCard } from "../Shared/UI/StatusCard";
import { Package, Clock, CheckCircle, Upload } from "lucide-react";

const DesignerDashboard = () => {
  // DUMMY DATA - Replace with API (only assigned orders)
  const stats = {
    assignedOrders: 5,
    inProgress: 3,
    completed: 2,
    uploadedToday: 1,
  };

  const assignedOrders = [
    {
      orderId: "ORD-002",
      customer: "Jane Smith",
      product: "T-Shirt (50pcs)",
      dueDate: "2025-02-28",
      status: "Designing",
      hasDesign: false,
    },
    {
      orderId: "ORD-005",
      customer: "Alice Brown",
      product: "Tarpaulin",
      dueDate: "2025-03-05",
      status: "Designing",
      hasDesign: true,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Designer Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your assigned design projects
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatusCard
          title="Assigned to Me"
          value={stats.assignedOrders}
          icon={<Package size={18} />}
          iconColor="text-purple-600"
        />
        <StatusCard
          title="In Progress"
          value={stats.inProgress}
          icon={<Clock size={18} />}
          iconColor="text-orange-600"
        />
        <StatusCard
          title="Completed"
          value={stats.completed}
          icon={<CheckCircle size={18} />}
          iconColor="text-green-600"
        />
        <StatusCard
          title="Uploaded Today"
          value={stats.uploadedToday}
          icon={<Upload size={18} />}
          iconColor="text-cyan-600"
        />
      </div>

      {/* Info Note */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-purple-900 font-medium">
          📐 <strong>Designer Role:</strong> You can view orders assigned to
          you, upload designs, and update design status. Contact admin for order
          reassignment.
        </p>
      </div>

      {/* My Assigned Orders */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          My Assigned Orders
        </h2>
        <div className="space-y-3">
          {assignedOrders.map((order) => (
            <div
              key={order.orderId}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-bold text-gray-900">{order.orderId}</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      order.hasDesign
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {order.hasDesign ? "Design Uploaded" : "Pending Design"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {order.customer} • {order.product}
                </p>
                <p className="text-xs text-gray-500">Due: {order.dueDate}</p>
              </div>
              {!order.hasDesign && (
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
                  <Upload size={16} />
                  Upload Design
                </button>
              )}
              {order.hasDesign && (
                <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition-colors">
                  View Details
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesignerDashboard;
