import { useState } from "react";
import { Plus } from "lucide-react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { Button } from "../Shared/UI/Button";
import { Package, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { OrdersTable } from "../Shared/Orders/OrdersTable";
import { OrderDetailsModal } from "../Shared/Orders/OrderDetailsModal";
import { CreateOrderModal } from "../Shared/Orders/CreateOrderModal";
import type { Order } from "../../Types";
import { useOrdersData } from "../../hooks/useOrdersData";

const AdminOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Orders");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { orders, stats: orderStats, loading, updateStatus, createOrder } = useOrdersData();

  const filters = ["All Orders", "In Queue", "Active Orders", "Completed"];

  const filteredOrders = orders.filter(o => {
    if (activeFilter === "All Orders") return true;
    if (activeFilter === "In Queue") return o.status === "In Queue";
    if (activeFilter === "Active Orders") return ["Designing", "Payment", "Production"].includes(o.status);
    if (activeFilter === "Completed") return o.status === "Completed";
    return true;
  });

  const handleViewOrder = (order: Order) => { setSelectedOrder(order); setShowDetailsModal(true); };
  const handleCreateOrder = async (orderData: any) => {
    const result = await createOrder({
      customer_id: orderData.customerId || null,
      order_type: 'walk-in',
      items: [{
        product_name: orderData.productType,
        quantity: orderData.quantity,
        unit_price: orderData.totalAmount / orderData.quantity,
        specifications: orderData.specialInstructions,
      }],
      special_instructions: orderData.specialInstructions,
      due_date: orderData.dueDate,
    });
    if (result.success) { setShowCreateModal(false); }
    else alert("Error: " + result.error);
  };
  const handleUpdateStatus = async (order: Order, newStatus?: string) => {
    if (!newStatus) return;
    const result = await updateStatus(order.id, newStatus);
    if (!result.success) alert("Error: " + result.error);
  };

  if (loading) return <div className="max-w-7xl mx-auto flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and track all customer orders</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatusCard title="Total Orders" value={orderStats.total} icon={<Package size={18} />} iconColor="text-cyan-600" />
        <StatusCard title="In Queue" value={orderStats.inQueue} icon={<Clock size={18} />} iconColor="text-blue-600" />
        <StatusCard title="In Design" value={orderStats.designing} icon={<Package size={18} />} iconColor="text-purple-600" />
        <StatusCard title="In Production" value={orderStats.production} icon={<Package size={18} />} iconColor="text-orange-600" />
        <StatusCard title="Ready Pickup" value={orderStats.readyPickup} icon={<CheckCircle size={18} />} iconColor="text-green-600" />
        <StatusCard title="Overdue" value={orderStats.overdue} icon={<AlertCircle size={18} />} iconColor="text-red-600" />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${activeFilter === f ? "bg-[#00BEF4] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by customer name, order ID, or product..." />
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => setShowCreateModal(true)}>Create Order</Button>
        </div>
      </div>

      <OrdersTable orders={filteredOrders} userRole="admin" onViewDetails={handleViewOrder} searchQuery={searchQuery} />

      <CreateOrderModal isOpen={showCreateModal} userRole="admin" onClose={() => setShowCreateModal(false)} onSave={handleCreateOrder} />

      {selectedOrder && (
        <OrderDetailsModal isOpen={showDetailsModal} order={selectedOrder} userRole="admin" onClose={() => setShowDetailsModal(false)}
          onUpdateStatus={(status) => handleUpdateStatus(selectedOrder, status)} />
      )}
    </div>
  );
};

export default AdminOrders;