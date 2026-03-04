// src/components/Production/ProductionOrders.tsx

import { useState } from "react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { OrdersTable } from "../Shared/Orders/OrdersTable";
import { OrderDetailsModal } from "../Shared/Orders/OrderDetailsModal";
import { Package, Clock, CheckCircle } from "lucide-react";
import type { Order } from "../../Types";

const ProductionOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // DUMMY DATA - Only assigned production orders
  const orders: Order[] = [
    {
      id: "ORD-004",
      orderId: "ORD-004",
      customerName: "Bob Johnson",
      customer: "Bob Johnson",
      productType: "Mug",
      product: "Mug",
      quantity: 100,
      totalAmount: 5000,
      status: "Production",
      paymentStatus: "Paid",
      dateOrdered: "2025-02-18",
      dueDate: "2025-03-02",
      designFile: "mug-design.png",
      assignedProduction: "Current User",
    },
  ];

  const orderStats = {
    assigned: orders.length,
    inProgress: orders.filter((o) => o.status === "Production").length,
    completed: orders.filter((o) => o.status === "Pickup").length,
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = (order: Order) => {
    console.log("Update production status:", order.orderId);
    alert(`Mark ${order.orderId} as ready for pickup?`);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Production Orders</h1>
        <p className="text-sm text-gray-500 mt-1">
          Orders assigned to you for production
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatusCard
          title="Assigned to Me"
          value={orderStats.assigned}
          icon={<Package size={18} />}
          iconColor="text-orange-600"
        />
        <StatusCard
          title="In Production"
          value={orderStats.inProgress}
          icon={<Clock size={18} />}
          iconColor="text-blue-600"
        />
        <StatusCard
          title="Completed"
          value={orderStats.completed}
          icon={<CheckCircle size={18} />}
          iconColor="text-green-600"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search orders..."
        />
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-orange-900 font-medium">
          🏭 <strong>Production Workspace:</strong> You see only orders assigned
          to you. Update status when production is complete.
        </p>
      </div>

      <OrdersTable
        orders={orders}
        userRole="production"
        onViewDetails={handleViewOrder}
        onUpdateStatus={handleUpdateStatus}
        searchQuery={searchQuery}
      />

      {selectedOrder && (
        <OrderDetailsModal
          isOpen={showDetailsModal}
          order={selectedOrder}
          userRole="production"
          onClose={() => setShowDetailsModal(false)}
          onUpdateStatus={(status) => console.log("Update to:", status)}
        />
      )}
    </div>
  );
};

export default ProductionOrders;
