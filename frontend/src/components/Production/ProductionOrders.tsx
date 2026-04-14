import { useState } from "react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { OrderDetailsModal } from "../Shared/Orders/OrderDetailsModal";
import { OrderCardsGrid } from "../Shared/Orders/OrderCardsGrid";
import { Package, Clock, CheckCircle, LayoutGrid, LayoutList } from "lucide-react";
import type { Order } from "../../Types";
import { useOrdersData } from "../../hooks/useSupabase";

const ProductionOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");

  const { orders: rawOrders, loading, updateStatus } = useOrdersData();
  const orders = rawOrders.map(o => ({ ...o, assignedProduction: "Current User" }));

  const stats = {
    assigned: orders.length,
    inProgress: orders.filter(o => o.status === "Production").length,
    completed: orders.filter(o => o.status === "Pickup" || o.status === "Completed").length,
  };

  const filtered = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    return !q || o.customerName?.toLowerCase().includes(q) || o.orderId?.toLowerCase().includes(q);
  });

  const handleViewOrder = (order: Order) => { setSelectedOrder(order); setShowDetailsModal(true); };

  const handleMarkPickup = async (order: Order) => {
    const r = await updateStatus(order.id, "Pickup");
    if (r.success) alert(`${order.orderId} → Ready for Pickup!`);
    else alert("Error: " + r.error);
  };

  if (loading) return <div className="max-w-7xl mx-auto flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" /></div>;

  const statusColor = (s: string) => s === 'Production' ? 'bg-orange-100 text-orange-700' : s === 'Pickup' ? 'bg-green-100 text-green-700' : s === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700';

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Production Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Orders assigned to production — mark complete when done</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatusCard title="Assigned" value={stats.assigned} icon={<Package size={18} />} iconColor="text-orange-600" />
        <StatusCard title="In Production" value={stats.inProgress} icon={<Clock size={18} />} iconColor="text-blue-600" />
        <StatusCard title="Done" value={stats.completed} icon={<CheckCircle size={18} />} iconColor="text-green-600" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1"><SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search orders..." /></div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 self-start">
            <button onClick={() => setViewMode("list")} className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-cyan-600" : "text-gray-500"}`}><LayoutList size={18} /></button>
            <button onClick={() => setViewMode("cards")} className={`p-2 rounded-md transition-all ${viewMode === "cards" ? "bg-white shadow-sm text-cyan-600" : "text-gray-500"}`}><LayoutGrid size={18} /></button>
          </div>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-orange-900 font-medium">🏭 <strong>Production:</strong> Only you can mark orders as "Ready for Pickup" when production is complete.</p>
      </div>

      {viewMode === "list" ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* MOBILE */}
          <div className="md:hidden divide-y divide-gray-100">
            {filtered.length === 0 ? <p className="px-4 py-8 text-center text-gray-400">No production orders</p>
            : filtered.map((o: any) => (
              <div key={o.id} className={`p-4 space-y-2 ${o.status === 'Overdue' ? 'bg-red-50' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900">{o.orderId}</p>
                    <p className="text-sm text-gray-500">{o.customerName} · {o.productType}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(o.status)}`}>{o.status}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Qty: {o.quantity}</span>
                  <span className="text-xs">Due: {o.dueDate}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleViewOrder(o)} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 rounded-lg text-sm text-cyan-700 font-semibold"><Package size={14}/> View</button>
                  {o.status === 'Production' && (
                    <button onClick={() => handleMarkPickup(o)} className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold rounded-lg">✓ Ready</button>
                  )}
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
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Qty</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Due</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((o: any) => (
                  <tr key={o.id} className={`hover:bg-gray-50 ${o.status === 'Overdue' ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs">{o.orderId}</td>
                    <td className="px-4 py-3">{o.customerName}</td>
                    <td className="px-4 py-3 text-gray-600">{o.productType}</td>
                    <td className="px-4 py-3 text-center">{o.quantity}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(o.status)}`}>{o.status}</span></td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{o.dueDate}</td>
                    <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleViewOrder(o)} className="p-1.5 hover:bg-cyan-100 rounded-lg"><Package size={16} className="text-cyan-600" /></button>
                      {o.status === 'Production' && (
                        <button onClick={() => handleMarkPickup(o)} className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-semibold rounded-lg">✓ Ready</button>
                      )}
                    </div></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No production orders</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <OrderCardsGrid orders={filtered} searchQuery={searchQuery} onView={handleViewOrder} />
      )}

      {selectedOrder && (
        <OrderDetailsModal isOpen={showDetailsModal} order={selectedOrder} userRole="production"
          onClose={() => setShowDetailsModal(false)}
          onUpdateStatus={(s) => { updateStatus(selectedOrder.id, s); setShowDetailsModal(false); }} />
      )}
    </div>
  );
};

export default ProductionOrders;