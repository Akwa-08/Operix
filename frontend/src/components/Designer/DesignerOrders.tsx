import { useState } from "react";
import { Upload, Package, Clock, CheckCircle, LayoutGrid, LayoutList } from "lucide-react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { OrderDetailsModal } from "../Shared/Orders/OrderDetailsModal";
import { OrderCardsGrid } from "../Shared/Orders/OrderCardsGrid";
import type { Order } from "../../Types";
import { useOrdersData } from "../../hooks/useSupabase";

const DesignerOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");

  const { orders, loading, updateStatus } = useOrdersData();

  const stats = {
    assigned: orders.length,
    inProgress: orders.filter(o => o.status === "Designing").length,
    completed: orders.filter(o => !["Designing", "In Queue"].includes(o.status)).length,
  };

  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    return !q || o.customerName?.toLowerCase().includes(q) || o.orderId?.toLowerCase().includes(q) || o.productType?.toLowerCase().includes(q);
  });

  const handleViewOrder = (order: Order) => { setSelectedOrder(order); setShowDetailsModal(true); };

  const handleUpdateStatus = async (status: string, orderId?: string) => {
    const targetId = orderId || selectedOrder?.id;
    if (!targetId) return;
    const r = await updateStatus(targetId, status);
    if (r.success) setShowDetailsModal(false);
    else alert("Error: " + r.error);
  };

  if (loading) return <div className="max-w-7xl mx-auto flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Design Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Orders assigned to you for design work</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatusCard title="Assigned" value={stats.assigned} icon={<Package size={18} />} iconColor="text-purple-600" />
        <StatusCard title="In Progress" value={stats.inProgress} icon={<Clock size={18} />} iconColor="text-orange-600" />
        <StatusCard title="Done" value={stats.completed} icon={<CheckCircle size={18} />} iconColor="text-green-600" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex gap-3 items-center">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search orders..." />
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode("list")} title="List view" className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-cyan-600" : "text-gray-500 hover:text-gray-700"}`}><LayoutList size={18} /></button>
            <button onClick={() => setViewMode("cards")} title="Card view" className={`p-2 rounded-md transition-all ${viewMode === "cards" ? "bg-white shadow-sm text-cyan-600" : "text-gray-500 hover:text-gray-700"}`}><LayoutGrid size={18} /></button>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Upload size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-purple-900 font-medium"><strong>Designer Workspace:</strong> View your assigned orders. Upload designs when ready, then advance status to "Payment".</p>
      </div>

      {/* Orders — list or cards */}
      {viewMode === "list" ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
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
                {filteredOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{o.orderId}</td>
                    <td className="px-4 py-3">{o.customerName}</td>
                    <td className="px-4 py-3 text-gray-600">{o.productType}</td>
                    <td className="px-4 py-3 text-center">{o.quantity}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        o.status === 'Designing' ? 'bg-purple-100 text-purple-700' :
                        o.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{o.dueDate}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleViewOrder(o)} className="p-1.5 hover:bg-cyan-100 rounded-lg" title="View"><Package size={16} className="text-cyan-600" /></button>
                        {o.status === 'Designing' && (
                          <button onClick={() => handleUpdateStatus('Payment', o.id)}
                            className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-semibold rounded-lg" title="Mark design complete">
                            Done →
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No orders assigned to you</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <OrderCardsGrid orders={filteredOrders} searchQuery={searchQuery} onView={handleViewOrder} />
      )}

      {selectedOrder && (
        <OrderDetailsModal isOpen={showDetailsModal} order={selectedOrder} userRole="designer"
          onClose={() => setShowDetailsModal(false)} onUpdateStatus={handleUpdateStatus}
          onUploadDesign={() => alert("Design upload — file system to be implemented")} />
      )}
    </div>
  );
};

export default DesignerOrders;