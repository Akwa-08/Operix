import { useState } from "react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { OrdersTable } from "../Shared/Orders/OrdersTable";
import { OrderDetailsModal } from "../Shared/Orders/OrderDetailsModal";
import { Package, Clock, CheckCircle } from "lucide-react";
import type { Order } from "../../Types";
import { useOrdersData } from "../../hooks/useOrdersData";

const ProductionOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { orders: rawOrders, loading, updateStatus } = useOrdersData();

  // Backend already filters to assigned orders. Mark assignedProduction so OrdersTable filter passes.
  const orders = rawOrders.map(o => ({ ...o, assignedProduction: "Current User" }));

  const orderStats = {
    assigned: orders.length,
    inProgress: orders.filter(o => o.status === "Production").length,
    completed: orders.filter(o => o.status === "Pickup" || o.status === "Completed").length,
  };

  const handleViewOrder = (order: Order) => { setSelectedOrder(order); setShowDetailsModal(true); };

  const handleUpdateStatus = async (order: Order) => {
    const result = await updateStatus(order.id, "Pickup");
    if (result.success) alert(`${order.orderId} marked as ready for pickup!`);
    else alert("Error: " + result.error);
  };

  const handleModalUpdateStatus = async (status: string) => {
    if (!selectedOrder) return;
    const result = await updateStatus(selectedOrder.id, status);
    if (result.success) setShowDetailsModal(false);
    else alert("Error: " + result.error);
  };

  if (loading) return <div className="max-w-7xl mx-auto flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Production Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Orders assigned to you for production</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatusCard title="Assigned to Me" value={orderStats.assigned} icon={<Package size={18} />} iconColor="text-orange-600" />
        <StatusCard title="In Production" value={orderStats.inProgress} icon={<Clock size={18} />} iconColor="text-blue-600" />
        <StatusCard title="Completed" value={orderStats.completed} icon={<CheckCircle size={18} />} iconColor="text-green-600" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search orders..." />
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-orange-900 font-medium">🏭 <strong>Production Workspace:</strong> You see only orders assigned to you. Update status when production is complete.</p>
      </div>

      <OrdersTable orders={orders} userRole="production" onViewDetails={handleViewOrder} onUpdateStatus={handleUpdateStatus} searchQuery={searchQuery} />

      {selectedOrder && (
        <OrderDetailsModal isOpen={showDetailsModal} order={selectedOrder} userRole="production" onClose={() => setShowDetailsModal(false)}
          onUpdateStatus={handleModalUpdateStatus} />
      )}
    </div>
  );
};

export default ProductionOrders;