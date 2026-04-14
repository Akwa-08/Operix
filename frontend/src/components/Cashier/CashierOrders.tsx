import { useState } from "react";
import { Plus, DollarSign, LayoutGrid, LayoutList, Package, Clock, CheckCircle } from "lucide-react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { Button } from "../Shared/UI/Button";
import { OrderCardsGrid } from "../Shared/Orders/OrderCardsGrid";
import { OrderDetailsModal } from "../Shared/Orders/OrderDetailsModal";
import { CreateOrderModal } from "../Shared/Orders/CreateOrderModal";
import type { Order } from "../../Types";
import { useOrdersData } from "../../hooks/useSupabase";

const CashierOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");

  const { orders, stats, loading, createOrder, recordPayment } = useOrdersData();

  const handleCreateOrder = async (orderData: any) => {
    const result = await createOrder({
      customer_id: orderData.customerId || null,
      order_type: "walk-in",
      items: [{ product_name: orderData.productType, quantity: orderData.quantity, unit_price: orderData.totalAmount / (orderData.quantity || 1), specifications: orderData.specialInstructions }],
      special_instructions: orderData.specialInstructions,
      due_date: orderData.dueDate,
    });
    if (result.success) setShowCreateModal(false);
    else alert("Error: " + result.error);
  };

  const handleViewOrder = (order: Order) => { setSelectedOrder(order); setShowDetailsModal(true); };

  if (loading) return <div className="max-w-7xl mx-auto flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" /></div>;

  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    return !q || o.customerName?.toLowerCase().includes(q) || o.orderId?.toLowerCase().includes(q) || o.productType?.toLowerCase().includes(q);
  });

  const statusColor = (s: string) => s === 'Completed' ? 'bg-green-100 text-green-700' : s === 'In Queue' ? 'bg-blue-100 text-blue-700' : s === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
  const payColor = (s: string) => s === 'Paid' ? 'bg-green-100 text-green-700' : s === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Create orders and process payments</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatusCard title="Total" value={stats.total} icon={<Package size={18} />} iconColor="text-cyan-600" />
        <StatusCard title="In Queue" value={stats.inQueue} icon={<Clock size={18} />} iconColor="text-orange-600" />
        <StatusCard title="Pending Payment" value={stats.pendingPayment} icon={<DollarSign size={18} />} iconColor="text-red-600" />
        <StatusCard title="Completed" value={stats.completed} icon={<CheckCircle size={18} />} iconColor="text-green-600" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1"><SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search orders..." /></div>
          <div className="flex gap-2 items-center">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button onClick={() => setViewMode("list")} className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-cyan-600" : "text-gray-500"}`}><LayoutList size={18} /></button>
              <button onClick={() => setViewMode("cards")} className={`p-2 rounded-md transition-all ${viewMode === "cards" ? "bg-white shadow-sm text-cyan-600" : "text-gray-500"}`}><LayoutGrid size={18} /></button>
            </div>
            <Button variant="primary" icon={<Plus size={18} />} onClick={() => setShowCreateModal(true)}>Create Order</Button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900 font-medium">ℹ️ <strong>Cashier:</strong> Create walk-in orders, view details, and record payments. Tap the ₱ icon to process payment.</p>
      </div>

      {viewMode === "list" ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* MOBILE */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredOrders.length === 0 ? <p className="px-4 py-8 text-center text-gray-400">No orders found</p>
            : filteredOrders.map((o: any) => (
              <div key={o.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900">{o.orderId}</p>
                    <p className="text-sm text-gray-500">{o.customerName} · {o.productType}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(o.status)}`}>{o.status}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${payColor(o.paymentStatus)}`}>{o.paymentStatus}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-gray-900">₱{o.totalAmount?.toLocaleString()}</span>
                  <span className="text-gray-400 text-xs">{o.dateOrdered}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleViewOrder(o)} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 rounded-lg text-sm text-cyan-700 font-semibold w-full justify-center"><Package size={14}/> Manage Order</button>
                </div>
              </div>
            ))}
          </div>
          {/* DESKTOP */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Order ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Payment</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{o.orderId}</td>
                    <td className="px-4 py-3">{o.customerName}</td>
                    <td className="px-4 py-3 text-gray-600">{o.productType}</td>
                    <td className="px-4 py-3 text-right font-semibold">₱{o.totalAmount?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(o.status)}`}>{o.status}</span></td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${payColor(o.paymentStatus)}`}>{o.paymentStatus}</span></td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{o.dateOrdered}</td>
                    <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleViewOrder(o)} className="p-1.5 hover:bg-cyan-100 rounded-lg" title="Manage"><Package size={16} className="text-cyan-600" /></button>
                    </div></td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No orders found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <OrderCardsGrid orders={filteredOrders} onView={handleViewOrder} />
      )}

      <CreateOrderModal isOpen={showCreateModal} userRole="cashier" onClose={() => setShowCreateModal(false)} onSave={handleCreateOrder} />

      {selectedOrder && (
        <OrderDetailsModal isOpen={showDetailsModal} order={selectedOrder} userRole="cashier" 
          onClose={() => setShowDetailsModal(false)}
          onRecordPayment={recordPayment} />
      )}
    </div>
  );
};

export default CashierOrders;