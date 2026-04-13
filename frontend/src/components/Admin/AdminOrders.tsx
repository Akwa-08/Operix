import { useState } from "react";
import { Plus, Trash2, X, Check, LayoutGrid, LayoutList } from "lucide-react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { Button } from "../Shared/UI/Button";
import { Package, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { OrdersTable } from "../Shared/Orders/OrdersTable";
import { OrderCardsGrid } from "../Shared/Orders/OrderCardsGrid";
import { OrderDetailsModal } from "../Shared/Orders/OrderDetailsModal";
import { CreateOrderModal } from "../Shared/Orders/CreateOrderModal";
import type { Order } from "../../Types";
import { useOrdersData } from "../../hooks/useSupabase";

const Modal = ({ show, onClose, title, children, width = "max-w-lg" }: any) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl ${width} w-full p-8 relative`} onClick={(e: any) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-600" /></button>
        <h3 className="text-xl font-bold text-gray-900 mb-6">{title}</h3>
        {children}
      </div>
    </div>
  );
};

const AdminOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Orders");
  const [periodFilter, setPeriodFilter] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assignForm, setAssignForm] = useState({ designer: "", production: "" });

  const { orders, stats, staffList, loading, createOrder, updateStatus, assignStaff, deleteOrder } = useOrdersData();

  const designers = staffList.filter(s => s.role === "designer");
  const productionStaff = staffList.filter(s => s.role === "production");

  const filters = ["All Orders", "In Queue", "Active Orders", "Completed", "Overdue"];
  const periods = [
    { label: "All Time", value: "" },
    { label: "Today", value: "today" },
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
  ];

  const filteredOrders = orders.filter((o: any) => {
    let pass = true;
    if (activeFilter === "In Queue") pass = o.status === "In Queue";
    else if (activeFilter === "Active Orders") pass = ["Designing","Payment","Production"].includes(o.status);
    else if (activeFilter === "Completed") pass = o.status === "Completed";
    else if (activeFilter === "Overdue") pass = o.status === "Overdue";

    if (periodFilter && pass) {
      const d = new Date(o.dateOrdered);
      const now = new Date();
      if (periodFilter === "today") pass = d.toDateString() === now.toDateString();
      else if (periodFilter === "week") pass = d >= new Date(now.getTime() - 7*24*60*60*1000);
      else if (periodFilter === "month") pass = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return pass;
  });

  const handleViewOrder = (order: Order) => { setSelectedOrder(order); setShowDetailsModal(true); };

  const handleCreateOrder = async (orderData: any) => {
    const result = await createOrder({
      customer_id: orderData.customerId || null,
      guest_name: orderData.guestName || null,
      guest_phone: orderData.guestPhone || null,
      guest_email: orderData.guestEmail || null,
      order_type: orderData.orderType || "walk-in",
      items: [{ product_name: orderData.productType, quantity: orderData.quantity, unit_price: orderData.totalAmount / (orderData.quantity || 1), specifications: orderData.specialInstructions }],
      special_instructions: orderData.specialInstructions,
      due_date: orderData.dueDate,
      assigned_designer: orderData.assignedDesigner || null,
      assigned_production: orderData.assignedProduction || null,
      comments: orderData.comments || null,
    });
    if (result.success) setShowCreateModal(false);
    else alert("Error: " + result.error);
  };

  const handleAssign = async () => {
    if (!selectedOrder) return;
    const payload: any = {};
    if (assignForm.designer) payload.assigned_designer = assignForm.designer;
    if (assignForm.production) payload.assigned_production = assignForm.production;
    const r = await assignStaff(selectedOrder.id, payload);
    if (r.success) { alert("Staff assigned!"); setShowAssignModal(false); }
    else alert("Error: " + r.error);
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    const r = await deleteOrder(selectedOrder.id);
    if (r.success) { alert("Order deleted"); setShowDeleteConfirm(false); setShowDetailsModal(false); }
    else alert("Error: " + r.error);
  };

  const handleStatusChange = async (order: Order, status?: string) => {
    if (!status) return;
    const r = await updateStatus(order.id, status);
    if (!r.success) alert("Error: " + r.error);
  };

  const openAssign = (order: Order) => {
    setSelectedOrder(order);
    setAssignForm({ designer: (order as any).assignedDesigner || "", production: (order as any).assignedProduction || "" });
    setShowAssignModal(true);
  };

  if (loading) return <div className="max-w-7xl mx-auto flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and track all customer orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatusCard title="Total" value={stats.total} icon={<Package size={18} />} iconColor="text-cyan-600" />
        <StatusCard title="In Queue" value={stats.inQueue} icon={<Clock size={18} />} iconColor="text-blue-600" />
        <StatusCard title="Designing" value={stats.designing} icon={<Package size={18} />} iconColor="text-purple-600" />
        <StatusCard title="Production" value={stats.production} icon={<Package size={18} />} iconColor="text-orange-600" />
        <StatusCard title="Pickup" value={stats.readyPickup} icon={<CheckCircle size={18} />} iconColor="text-green-600" />
        <StatusCard title="Overdue" value={stats.overdue} icon={<AlertCircle size={18} />} iconColor="text-red-600" />
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${activeFilter === f ? "bg-[#00BEF4] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Period Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {periods.map(p => (
          <button key={p.value} onClick={() => setPeriodFilter(p.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${periodFilter === p.value ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Search + View Toggle + Create */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by customer, order ID, product..." />
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button onClick={() => setViewMode("list")} title="List view"
                className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-cyan-600" : "text-gray-500 hover:text-gray-700"}`}>
                <LayoutList size={18} />
              </button>
              <button onClick={() => setViewMode("cards")} title="Card view"
                className={`p-2 rounded-md transition-all ${viewMode === "cards" ? "bg-white shadow-sm text-cyan-600" : "text-gray-500 hover:text-gray-700"}`}>
                <LayoutGrid size={18} />
              </button>
            </div>
            <Button variant="primary" icon={<Plus size={18} />} onClick={() => setShowCreateModal(true)}>Create Order</Button>
          </div>
        </div>
      </div>

      {/* Orders — list or cards */}
      {viewMode === "list" ? (
        <OrdersTable orders={filteredOrders} userRole="admin" onViewDetails={handleViewOrder} searchQuery={searchQuery}
          onEdit={(order) => openAssign(order)} onDelete={(order) => { setSelectedOrder(order); setShowDeleteConfirm(true); }} />
      ) : (
        <OrderCardsGrid orders={filteredOrders} searchQuery={searchQuery}
          onView={handleViewOrder} onEdit={(order) => openAssign(order)}
          onDelete={(order) => { setSelectedOrder(order); setShowDeleteConfirm(true); }} />
      )}

      {/* Create Modal */}
      <CreateOrderModal isOpen={showCreateModal} userRole="admin" onClose={() => setShowCreateModal(false)} onSave={handleCreateOrder} />

      {/* Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal isOpen={showDetailsModal} order={selectedOrder} userRole="admin"
          onClose={() => setShowDetailsModal(false)}
          onUpdateStatus={(status) => handleStatusChange(selectedOrder, status)}
          onEdit={() => { setShowDetailsModal(false); openAssign(selectedOrder); }} />
      )}

      {/* Assign Staff Modal */}
      <Modal show={showAssignModal} onClose={() => setShowAssignModal(false)} title={`Assign Staff — ${(selectedOrder as any)?.orderId || ''}`}>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Designer</label>
            <select value={assignForm.designer} onChange={e => setAssignForm({...assignForm, designer: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">— Not Assigned —</option>
              {designers.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Production</label>
            <select value={assignForm.production} onChange={e => setAssignForm({...assignForm, production: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">— Not Assigned —</option>
              {productionStaff.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          <button onClick={handleAssign} className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2"><Check size={18} />Assign</button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal show={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Order?">
        <p className="text-gray-600 mb-6">This will permanently delete <strong>{(selectedOrder as any)?.orderId}</strong> and all its items and payments. This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          <button onClick={handleDelete} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2"><Trash2 size={18} />Delete</button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminOrders;