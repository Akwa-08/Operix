import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { Button } from "../Shared/UI/Button";
import { Package, Clock, CheckCircle, AlertCircle } from "lucide-react";

import { OrdersTable } from "../Shared/Orders/OrdersTable";
import { OrderDetailsModal } from "../Shared/Orders/OrderDetailsModal";
import { CreateOrderModal } from "../Shared/Orders/CreateOrderModal";

interface Order {
  id: string;
  orderId: string;
  customerName: string;
  productType: string;
  quantity: number;
  totalAmount: number;
  status: "In Queue" | "Designing" | "Payment" | "Production" | "Pickup" | "Completed" | "Overdue";
  paymentStatus: "Paid" | "Unpaid" | "Partial";
  dateOrdered: string;
  dueDate: string;
  specialInstructions?: string;
}

const AdminOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Orders");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filters = ["All Orders", "Customer Portal Queue", "Active Orders"];

  // DUMMY DATA - Replace with API
  const orders: Order[] = [
    {
      id: "ORD-001",
      orderId: "ORD-001",
      customerName: "John Doe",
      productType: "Tarpaulin",
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
      productType: "T-Shirt",
      quantity: 50,
      totalAmount: 8500,
      status: "Designing",
      paymentStatus: "Partial",
      dateOrdered: "2025-02-19",
      dueDate: "2025-02-28",
    },
    // Add more dummy data
  ];

  // Calculate stats
  const orderStats = {
    total: orders.length,
    inQueue: orders.filter(o => o.status === "In Queue").length,
    designing: orders.filter(o => o.status === "Designing").length,
    production: orders.filter(o => o.status === "Production").length,
    readyPickup: orders.filter(o => o.status === "Pickup").length,
    overdue: orders.filter(o => o.status === "Overdue").length,
    pendingPayment: orders.filter(o => o.paymentStatus === "Unpaid" || o.paymentStatus === "Partial").length,
  };

  // Handlers
  const handleCreateOrder = () => {
    setShowCreateModal(true);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.productType.toLowerCase().includes(searchQuery.toLowerCase());

    // Apply filter logic
    if (activeFilter === "Active Orders") {
      return matchesSearch && order.status !== "Completed";
    }
    // Add more filter logic as needed

    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Overdue":
        return "bg-red-100 text-red-700";
      case "In Queue":
      case "Designing":
        return "bg-blue-100 text-blue-700";
      case "Production":
        return "bg-purple-100 text-purple-700";
      case "Pickup":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700";
      case "Unpaid":
        return "bg-red-100 text-red-700";
      case "Partial":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage and track all customer orders
        </p>
      </div>

      {/* Summary Cards - Admin sees all */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
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
          iconColor="text-blue-600"
        />
        <StatusCard
          title="In Design"
          value={orderStats.designing}
          icon={<Package size={18} />}
          iconColor="text-purple-600"
        />
        <StatusCard
          title="In Production"
          value={orderStats.production}
          icon={<Package size={18} />}
          iconColor="text-orange-600"
        />
        <StatusCard
          title="Ready for Pickup"
          value={orderStats.readyPickup}
          icon={<CheckCircle size={18} />}
          iconColor="text-green-600"
        />
        <StatusCard
          title="Overdue"
          value={orderStats.overdue}
          icon={<AlertCircle size={18} />}
          iconColor="text-red-600"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-150 ${
              activeFilter === filter
                ? "bg-[#00BEF4] text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {filter}
          </button>
        ))}
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
            onClick={handleCreateOrder}
          >
            Create Order
          </Button>
        </div>
      </div>

      {/* Orders List/Table */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No orders found</p>
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewOrder(order)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {order.customerName}
                  </h3>
                  <p className="text-sm text-gray-500">{order.orderId}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Product</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {order.productType}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Quantity</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {order.quantity} pcs
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ₱{order.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {order.dueDate}
                  </p>
                </div>
              </div>

              {order.specialInstructions && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Special Instructions</p>
                  <p className="text-sm text-gray-700">{order.specialInstructions}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateOrderModal
          isOpen={showCreateModal}
          userRole="admin"
          onClose={() => setShowCreateModal(false)}
          onSave={(order) => console.log("Created:", order)}
        />
      )}

      {selectedOrder && (
        <OrderDetailsModal
          isOpen={showDetailsModal}
          order={selectedOrder}
          userRole="admin"
          onClose={() => setShowDetailsModal(false)}
        />
      )}
     
    </div>
  );
};

export default AdminOrders;
