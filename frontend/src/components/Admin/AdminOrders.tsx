import { useState } from "react";
import { Plus, Trash2, X, Check } from "lucide-react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { Button } from "../Shared/UI/Button";
import { LoadingSpinner } from "../Shared/UI/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { ViewToggle } from "../Shared/UI/ViewToggle";
import { Package, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { OrdersTable } from "../Shared/Orders/OrdersTable";
import { OrderCardsGrid } from "../Shared/Orders/OrderCardsGrid";
import { OrderDetailsModal } from "../Shared/Orders/OrderDetailsModal";
import { CreateOrderModal } from "../Shared/Orders/CreateOrderModal";
import { KpiCard } from "../Shared/UI/KpiCard";
import { FilterDropdown } from "../Shared/UI/FilterDropdown";
import type { Order } from "../../Types";
import { useOrdersData } from "../../hooks/useSupabase";

// ── Local modal shell ────────────────────────────────────────────────────────
const Modal = ({ show, onClose, title, children }: any) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 md:p-4 sm:p-8 relative" onClick={(e: any) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-600" /></button>
        <h3 className="text-lg font-bold text-gray-900 mb-5">{title}</h3>
        {children}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const AdminOrders = () => {
  const [searchQuery, setSearchQuery]           = useState("");
  const [statusFilter, setStatusFilter]         = useState("All");
  const [periodFilter, setPeriodFilter]         = useState("All Time");
  const [viewMode, setViewMode]                 = useState<"list" | "cards">("list");
  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal]   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedOrderId, setSelectedOrderId]   = useState<string | null>(null);
  const [assignForm, setAssignForm]             = useState({ designer: "", production: "" });

  const { orders, stats, designers, productionStaff, loading, createOrder, updateStatus, assignStaff, deleteOrder, recordPayment, declinePayment, updateCustomerDesign, refresh } = useOrdersData();

  const toast = useToast();

  const statusOptions = ["All", "In Queue", "Active", "Completed", "Overdue"];
  const periodOptions = ["All Time", "Today", "This Week", "This Month"];

  // Active orders = Designing + Payment + Production
  const activeCount = orders.filter(o => ["Designing", "Payment", "Production"].includes(o.status)).length;

  const filteredOrders = orders.filter((o: any) => {
    let pass = true;
    if (statusFilter === "In Queue")   pass = o.status === "In Queue";
    else if (statusFilter === "Active") pass = ["Designing", "Payment", "Production"].includes(o.status);
    else if (statusFilter === "Completed") pass = o.status === "Completed";
    else if (statusFilter === "Overdue")   pass = o.status === "Overdue";

    if (periodFilter !== "All Time" && pass) {
      const d = new Date(o.dateOrdered);
      const now = new Date();
      if (periodFilter === "Today")     pass = d.toDateString() === now.toDateString();
      else if (periodFilter === "This Week")  pass = d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (periodFilter === "This Month") pass = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return pass;
  });

  const selectedOrder = selectedOrderId
    ? orders.find((o) => o.id === selectedOrderId) ?? null
    : null;

  const handleViewOrder = (order: Order) => { setSelectedOrderId(order.id); setShowDetailsModal(true); };

  const handleCreateOrder = async (orderData: any) => {
    const result = await createOrder({
      customer_id: orderData.customerId || null,
      guest_name:  orderData.guestName || null,
      guest_phone: orderData.guestPhone || null,
      guest_email: orderData.guestEmail || null,
      order_type:  orderData.orderType || "walk-in",
      items: [{ product_name: orderData.productType, quantity: orderData.quantity, unit_price: orderData.totalAmount / (orderData.quantity || 1), specifications: orderData.specialInstructions }],
      special_instructions: orderData.specialInstructions,
      due_date: orderData.dueDate,
      assigned_designer:  orderData.assignedDesigner || null,
      assigned_production: orderData.assignedProduction || null,
      comments: orderData.comments || null,
    });
    if (result.success) {
      setShowCreateModal(false);
      toast.success("Order created successfully!");
    } else toast.error("Error: " + result.error);
  };

  const handleAssign = async () => {
    if (!selectedOrder) return;
    const payload: any = {};
    if (assignForm.designer)   payload.assigned_designer = assignForm.designer;
    if (assignForm.production) payload.assigned_production = assignForm.production;
    const r = await assignStaff(selectedOrder.id, payload);
    if (r.success) {
      setShowAssignModal(false);
      toast.success("Staff assigned successfully!");
    } else toast.error("Error: " + r.error);
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    const r = await deleteOrder(selectedOrder.id);
    if (r.success) { 
      setShowDeleteConfirm(false); 
      setShowDetailsModal(false); 
      toast.success("Order deleted.");
    } else toast.error("Error: " + r.error);
  };

  const handleStatusChange = async (order: Order, status?: string) => {
    if (!status) return;
    const r = await updateStatus(order.id, status);
    if (r.success) toast.success("Status updated!");
    else toast.error("Error: " + r.error);
  };

  const openAssign = (order: Order) => {
    setSelectedOrderId(order.id);
    setAssignForm({ designer: (order as any).assignedDesigner || "", production: (order as any).assignedProduction || "" });
    setShowAssignModal(true);
  };

  if (loading) return <LoadingSpinner type="table" />;

  return (
    <div className="max-w-7xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track all customer orders</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={() => setShowCreateModal(true)} className="self-start sm:self-auto">
          New Order
        </Button>
      </div>

      {/* KPI Cards — 4 focused metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard title="Total Orders"   value={stats.total}          icon={<Package size={16}     />} iconColor="text-cyan-600" />
        <KpiCard title="Active"         value={activeCount}           icon={<Clock size={16}       />} iconColor="text-purple-600" />
        <KpiCard title="Ready Pickup"   value={stats.readyPickup}    icon={<CheckCircle size={16} />} iconColor="text-green-600" />
        <KpiCard title="Overdue"        value={stats.overdue}        icon={<AlertCircle size={16} />} iconColor="text-red-600"
          accent={stats.overdue > 0 ? "red" : "none"} />
      </div>

      {/* Unified filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
        <div className="flex flex-wrap gap-2 items-center">
          <FilterDropdown label="Status"  value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
          <FilterDropdown label="Period"  value={periodFilter} options={periodOptions} onChange={setPeriodFilter} />
          <div className="flex-1 min-w-[180px]">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search orders, customers..." />
          </div>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Order list / cards */}
      {viewMode === "list" ? (
        <OrdersTable orders={filteredOrders} userRole="admin" onViewDetails={handleViewOrder} searchQuery={searchQuery}
          onEdit={(order) => openAssign(order)}
          onDelete={(order) => { setSelectedOrderId(order.id); setShowDeleteConfirm(true); }} />
      ) : (
        <OrderCardsGrid orders={filteredOrders} searchQuery={searchQuery}
          onView={handleViewOrder} onEdit={(order) => openAssign(order)}
          onDelete={(order) => { setSelectedOrderId(order.id); setShowDeleteConfirm(true); }} />
      )}

      {/* Modals */}
      <CreateOrderModal isOpen={showCreateModal} userRole="admin" onClose={() => setShowCreateModal(false)} onSave={handleCreateOrder} />

      {selectedOrder && (
        <OrderDetailsModal isOpen={showDetailsModal} order={selectedOrder} userRole="admin"
          onClose={() => setShowDetailsModal(false)}
          onUpdateStatus={(status) => handleStatusChange(selectedOrder, status)}
          onEdit={() => { setShowDetailsModal(false); openAssign(selectedOrder); }}
          onRecordPayment={recordPayment}
          onDeclinePayment={declinePayment}
          onUpdateCustomerDesign={async (url) => {
            const r = await updateCustomerDesign(selectedOrder.id, url);
            if (!r.success) throw new Error(r.error || "Update failed");
          }}
          onRefresh={refresh} />
      )}

      {/* Assign Staff Modal */}
      <Modal show={showAssignModal} onClose={() => setShowAssignModal(false)} title={`Assign Staff — ${(selectedOrder as any)?.orderId || ""}`}>
        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Designer</label>
            <select value={assignForm.designer} onChange={e => setAssignForm({ ...assignForm, designer: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">— Not Assigned —</option>
              {designers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Production Staff</label>
            <select value={assignForm.production} onChange={e => setAssignForm({ ...assignForm, production: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">— Not Assigned —</option>
              {productionStaff.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
        <p className="text-gray-600 mb-5">This will permanently delete <strong>{(selectedOrder as any)?.orderId}</strong> and all its items and payments. This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          <button onClick={handleDelete} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2"><Trash2 size={18} />Delete</button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminOrders;