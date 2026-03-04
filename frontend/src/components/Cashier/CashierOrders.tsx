// src/components/Cashier/CashierOrders.tsx

import { useState } from "react";
import { Plus } from "lucide-react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { Button } from "../Shared/UI/Button";
import { OrdersTable } from "../Shared/Orders/OrdersTable";
import { OrderDetailsModal } from "../Shared/Orders/OrderDetailsModal";
import { CreateOrderModal } from "../Shared/Orders/CreateOrderModal";
import { Package, Clock, CheckCircle } from "lucide-react";
import type { Order } from "../../Types";

const CashierOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // DUMMY DATA - Replace with API
  const orders: Order[] = [
    {
      id: "ORD-001",
      orderId: "ORD-001",
      customerName: "John Doe",
      customer: "John Doe", // Alias
      customerEmail: "john@example.com",
      customerPhone: "+63 912 345 6789",
      productType: "Tarpaulin",
      product: "Tarpaulin", // Alias
      quantity: 1000,
      totalAmount: 15000,
      status: "In Queue",
      paymentStatus: "Unpaid",
      dateOrdered: "2025-02-20",
      dueDate: "2025-03-01",
      specialInstructions: "Need rush delivery",
    },
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
    },
  ];

  const orderStats = {
    total: orders.length,
    inQueue: orders.filter((o) => o.status === "In Queue").length,
    completed: orders.filter((o) => o.status === "Completed").length,
  };

  const handleCreateOrder = (orderData: any) => {
    console.log("Creating order:", orderData);
    // TODO: API call to create order
    setShowCreateModal(false);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create and manage customer orders
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatusCard
          title="Total Orders"
          value={orderStats.total}
          icon={<Package size={18} />}
          iconColor="text-cyan-600"
        />
        <StatusCard
          title="In Queue"
          value={orderStats.inQueue}
          icon={<Clock size={18} />}
          iconColor="text-orange-600"
        />
        <StatusCard
          title="Completed"
          value={orderStats.completed}
          icon={<CheckCircle size={18} />}
          iconColor="text-green-600"
        />
      </div>

      {/* Search and Create Button */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by customer name, order ID, or product..."
          />

          <Button
            variant="primary"
            icon={<Plus size={18} />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Order
          </Button>
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900 font-medium">
          ℹ️ <strong>Cashier Permissions:</strong> You can create orders, view
          order details, and process payments.
        </p>
      </div>

      {/* Orders Table */}
      <OrdersTable
        orders={orders}
        userRole="cashier"
        onViewDetails={handleViewOrder}
        searchQuery={searchQuery}
      />

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={showCreateModal}
        userRole="cashier"
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateOrder}
      />

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          isOpen={showDetailsModal}
          order={selectedOrder}
          userRole="cashier"
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
};

export default CashierOrders;
