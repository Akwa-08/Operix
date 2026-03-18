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
import { useOrdersData } from "../../hooks/useOrdersData";

const CashierOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { orders, stats: orderStats, loading, createOrder } = useOrdersData();

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
    if (result.success) setShowCreateModal(false);
    else alert("Error: " + result.error);
  };

  const handleViewOrder = (order: Order) => { setSelectedOrder(order); setShowDetailsModal(true); };

  if (loading) return <div className="max-w-7xl mx-auto flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Create and manage customer orders</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatusCard title="Total Orders" value={orderStats.total} icon={<Package size={18} />} iconColor="text-cyan-600" />
        <StatusCard title="In Queue" value={orderStats.inQueue} icon={<Clock size={18} />} iconColor="text-orange-600" />
        <StatusCard title="Completed" value={orderStats.completed} icon={<CheckCircle size={18} />} iconColor="text-green-600" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by customer name, order ID, or product..." />
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => setShowCreateModal(true)}>Create Order</Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900 font-medium">ℹ️ <strong>Cashier Permissions:</strong> You can create orders, view order details, and process payments.</p>
      </div>

      <OrdersTable orders={orders} userRole="cashier" onViewDetails={handleViewOrder} searchQuery={searchQuery} />

      <CreateOrderModal isOpen={showCreateModal} userRole="cashier" onClose={() => setShowCreateModal(false)} onSave={handleCreateOrder} />

      {selectedOrder && (
        <OrderDetailsModal isOpen={showDetailsModal} order={selectedOrder} userRole="cashier" onClose={() => setShowDetailsModal(false)} />
      )}
    </div>
  );
};

export default CashierOrders;