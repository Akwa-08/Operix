// src/components/Designer/DesignerOrders.tsx

import { useState } from "react";
import { Upload, Package, Clock, CheckCircle } from "lucide-react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { OrdersTable } from "../Shared/Orders/OrdersTable";
import { OrderDetailsModal } from "../Shared/Orders/OrderDetailsModal";
import type { Order } from "../../Types";

const DesignerOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // DUMMY DATA - Only assigned orders
  const orders: Order[] = [
    {
      id: "ORD-002",
      orderId: "ORD-002",
      customerName: "Jane Smith",
      customer: "Jane Smith",
      productType: "T-Shirt",
      product: "T-Shirt",
      quantity: 50,
      totalAmount: 8500,
      status: "Designing",
      paymentStatus: "Partial",
      dateOrdered: "2025-02-19",
      dueDate: "2025-02-28",
      assignedDesigner: "Current User",
      specialInstructions: "Need 3 color variations",
    },
    {
      id: "ORD-005",
      orderId: "ORD-005",
      customerName: "Alice Brown",
      customer: "Alice Brown",
      productType: "Tarpaulin",
      product: "Tarpaulin",
      quantity: 1,
      totalAmount: 5000,
      status: "Designing",
      paymentStatus: "Paid",
      dateOrdered: "2025-02-21",
      dueDate: "2025-03-05",
      assignedDesigner: "Current User",
      designFile: "tarpaulin-design-v2.psd",
    },
  ];

  const orderStats = {
    assigned: orders.length,
    inProgress: orders.filter((o) => !o.designFile).length,
    completed: orders.filter((o) => o.designFile).length,
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleUploadDesign = (order: Order) => {
    console.log("Upload design for:", order.orderId);
    alert(`Upload design for ${order.orderId}`);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-sm text-gray-500 mt-1">
          Orders assigned to you for design
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatusCard
          title="Assigned to Me"
          value={orderStats.assigned}
          icon={<Package size={18} />}
          iconColor="text-purple-600"
        />
        <StatusCard
          title="In Progress"
          value={orderStats.inProgress}
          icon={<Clock size={18} />}
          iconColor="text-orange-600"
        />
        <StatusCard
          title="Design Uploaded"
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

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Upload size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-purple-900 font-medium">
            <strong>Designer Workspace:</strong> You see only orders assigned to
            you. Upload designs for orders in "Designing" status.
          </p>
        </div>
      </div>

      <OrdersTable
        orders={orders}
        userRole="designer"
        onViewDetails={handleViewOrder}
        onUploadDesign={handleUploadDesign}
        searchQuery={searchQuery}
      />

      {selectedOrder && (
        <OrderDetailsModal
          isOpen={showDetailsModal}
          order={selectedOrder}
          userRole="designer"
          onClose={() => setShowDetailsModal(false)}
          onUploadDesign={() => handleUploadDesign(selectedOrder)}
        />
      )}
    </div>
  );
};

export default DesignerOrders;
