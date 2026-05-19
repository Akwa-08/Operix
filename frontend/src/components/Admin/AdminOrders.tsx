import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Trash2, X, Check } from "lucide-react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { Button } from "../Shared/UI/Button";
import { LoadingSpinner } from "../Shared/UI/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { ViewToggle } from "../Shared/UI/ViewToggle";
import { Package, Clock, CheckCircle, AlertCircle, DollarSign, FileBarChart } from "lucide-react";
import { OrdersTable } from "../Shared/Orders/OrdersTable";
import { OrderCardsGrid } from "../Shared/Orders/OrderCardsGrid";
import { OrderDetailsModal } from "../Shared/Orders/OrderDetailsModal";
import { CreateOrderModal } from "../Shared/Orders/CreateOrderModal";
import { KpiCard } from "../Shared/UI/KpiCard";
import { PageSummaryCard } from "../Shared/UI/PageSummaryCard";
import { FilterDropdown } from "../Shared/UI/FilterDropdown";
import type { Order } from "../../Types";
import { useOrdersData } from "../../hooks/useSupabase";
import { fmtMoney } from "../../util/formatters";
import { downloadCSV, printReport, buildKpiHtml, buildHtmlTable, fmtMoneyFull } from "../../util/reportExport";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedId = searchParams.get("highlight");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [periodFilter, setPeriodFilter] = useState("All Time");
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({ designer: "", production: "" });
  const [pageSize, setPageSize] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSizeOptions = ["6", "12", "18", "24"];

  const [lastHighlighted, setLastHighlighted] = useState<string | null>(null);
  const skipPageResetRef = useRef(false);

  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter === "unassigned") {
      setStatusFilter("Unassigned");
      // Clean up URL so user can manually change filters later
      const next = new URLSearchParams(searchParams);
      next.delete("filter");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { orders, stats, designers, productionStaff, loading, createOrder, updateStatus, assignStaff, deleteOrder, recordPayment, approvePayment, declinePayment, updateCustomerDesign, refresh } = useOrdersData();

  useEffect(() => {
    if (highlightedId && orders.length > 0 && highlightedId !== lastHighlighted) {
      const targetOrder = orders.find(o => o.id === highlightedId);
      if (targetOrder) {
        setLastHighlighted(highlightedId);
        skipPageResetRef.current = true;
        
        setStatusFilter("All");
        setPeriodFilter("All Time");
        setSearchQuery("");
        
        const index = orders.findIndex(o => o.id === highlightedId);
        if (index !== -1) {
          setCurrentPage(Math.floor(index / pageSize) + 1);
        }

        const next = new URLSearchParams(searchParams);
        next.delete("highlight");
        setSearchParams(next, { replace: true });
      }
    }
  }, [highlightedId, orders, pageSize, lastHighlighted, searchParams, setSearchParams]);

  useEffect(() => {
    if (skipPageResetRef.current) {
      skipPageResetRef.current = false;
      return;
    }
    setCurrentPage(1);
  }, [statusFilter, periodFilter, searchQuery, pageSize]);

  const toast = useToast();

  const statusOptions = ["All", "Unassigned", "In Queue", "Active", "Completed", "Incomplete", "Overdue", "Ready Pickup"];
  const periodOptions = ["All Time", "Today", "This Week", "This Month"];

  // Active orders = Designing + Payment + Production
  const activeCount = orders.filter(o => ["Designing", "Payment", "Production"].includes(o.status)).length;

  const filteredOrders = orders.filter((o: any) => {
    // 1. Status Filter
    let pass = true;
    if (statusFilter === "Unassigned") pass = o.status === "In Queue" && !o.assignedDesigner;
    else if (statusFilter === "In Queue") pass = o.status === "In Queue";
    else if (statusFilter === "Active") pass = ["Designing", "Payment", "Production"].includes(o.status);
    else if (statusFilter === "Incomplete") pass = o.status === "Completed" && o.paymentStatus !== "Paid";
    else if (statusFilter === "Completed") pass = o.status === "Completed" && o.paymentStatus === "Paid";
    else if (statusFilter === "Overdue") {
      const now = new Date();
      const dueDate = new Date(o.dueDate);
      pass = dueDate < now && !["Completed", "Cancelled", "Pickup"].includes(o.status);
    }
    else if (statusFilter === "Ready Pickup") pass = o.status === "Pickup";

    if (!pass) return false;

    // 2. Period Filter
    if (periodFilter !== "All Time") {
      const d = new Date(o.dateOrdered);
      const now = new Date();
      if (periodFilter === "Today") pass = d.toDateString() === now.toDateString();
      else if (periodFilter === "This Week") pass = d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (periodFilter === "This Month") pass = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }

    if (!pass) return false;

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const customer = (o.customerName || "").toLowerCase();
      const id = (o.orderId || "").toLowerCase();
      const prod = (o.productType || "").toLowerCase();
      pass = customer.includes(q) || id.includes(q) || prod.includes(q);
    }

    return pass;
  });

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const selectedOrder = selectedOrderId
    ? orders.find((o) => o.id === selectedOrderId) ?? null
    : null;

  const handleViewOrder = (order: Order) => { setSelectedOrderId(order.id); setShowDetailsModal(true); };

  const handleCreateOrder = async (orderData: any) => {
    const result = await createOrder({
      customer_id: orderData.customerId || null,
      guest_name: orderData.customerName || null,
      guest_phone: orderData.customerPhone || null,
      guest_email: orderData.customerEmail || null,
      order_type: orderData.orderType || "walk-in",
      items: [{
        product_id: orderData.productId || undefined,
        product_name: orderData.productType,
        quantity: orderData.quantity,
        unit_price: orderData.totalAmount / (orderData.quantity || 1),
        specifications: orderData.specialInstructions,
      }],
      special_instructions: orderData.specialInstructions,
      due_date: orderData.dueDate,
      assigned_designer: orderData.assignedDesigner || null,
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
    if (assignForm.designer) payload.assigned_designer = assignForm.designer;
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

  // ── Report Export ──────────────────────────────────────────────────────────
  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalCollected = orders.reduce((s, o) => s + (o.amountPaid || 0), 0);

  const handleOrdersCSV = useCallback(() => {
    downloadCSV("orders_report", [
      { header: "Order #", accessor: (o: Order) => o.orderId },
      { header: "Customer", accessor: (o: Order) => o.customerName },
      { header: "Product", accessor: (o: Order) => o.productType },
      { header: "Qty", accessor: (o: Order) => o.quantity },
      { header: "Amount (₱)", accessor: (o: Order) => o.totalAmount },
      { header: "Paid (₱)", accessor: (o: Order) => o.amountPaid || 0 },
      { header: "Status", accessor: (o: Order) => o.status },
      { header: "Payment", accessor: (o: Order) => o.paymentStatus },
      { header: "Date Ordered", accessor: (o: Order) => o.dateOrdered },
      { header: "Due Date", accessor: (o: Order) => o.dueDate },
    ], filteredOrders);
  }, [filteredOrders]);

  const handleOrdersPrint = useCallback(() => {
    printReport("Orders Report", `${filteredOrders.length} orders • ${statusFilter} • ${periodFilter}`, [
      {
        title: "Orders Summary",
        content: `<div class="summary-text">You have <strong>${orders.length}</strong> total orders. <strong>${activeCount}</strong> are in progress, <strong>${stats.readyPickup}</strong> are ready for pickup, <strong>${stats.completedUnpaid}</strong> are completed but unpaid, and <strong>${stats.overdue}</strong> are overdue. Total revenue: <strong>${fmtMoneyFull(totalRevenue)}</strong>, collected: <strong>${fmtMoneyFull(totalCollected)}</strong>.</div>`,
      },
      {
        title: "Key Metrics",
        content: buildKpiHtml([
          { label: "Total Orders", value: String(stats.total) },
          { label: "Active", value: String(activeCount) },
          { label: "Ready Pickup", value: String(stats.readyPickup) },
          { label: "Incomplete", value: String(stats.completedUnpaid) },
          { label: "Overdue", value: String(stats.overdue) },
          { label: "Revenue", value: fmtMoneyFull(totalRevenue) },
        ]),
      },
      {
        title: `Order List (${filteredOrders.length})`,
        content: buildHtmlTable([
          { header: "Order #", accessor: (o: Order) => o.orderId },
          { header: "Customer", accessor: (o: Order) => o.customerName },
          { header: "Product", accessor: (o: Order) => o.productType },
          { header: "Amount", accessor: (o: Order) => fmtMoneyFull(o.totalAmount), align: "right" as const },
          { header: "Status", accessor: (o: Order) => o.status },
          { header: "Payment", accessor: (o: Order) => o.paymentStatus },
        ], filteredOrders.slice(0, 50)),
      },
    ]);
  }, [orders, filteredOrders, stats, activeCount, statusFilter, periodFilter, totalRevenue, totalCollected]);

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

      {/* Summary */}
      <PageSummaryCard
        title="Orders Overview"
        icon={<FileBarChart size={16} />}
        onDownloadCSV={handleOrdersCSV}
        onPrint={handleOrdersPrint}
      >
        You have <strong>{orders.length}</strong> total orders.
        {" "}<strong>{activeCount}</strong> are currently in progress,
        {" "}<strong className="text-green-700">{stats.readyPickup}</strong> are ready for pickup{stats.completedUnpaid > 0 && (<>, <strong className="text-amber-700">{stats.completedUnpaid}</strong> are completed but unpaid</>)}{stats.overdue > 0 && (<>, and <strong className="text-red-600">{stats.overdue}</strong> are overdue</>)}.
        {" "}Total revenue: <strong className="text-cyan-700">{fmtMoney(totalRevenue)}</strong>, collected: <strong className="text-green-700">{fmtMoney(totalCollected)}</strong>.
      </PageSummaryCard>

      {/* KPI Cards — 5 focused metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <KpiCard title="Total Orders" value={stats.total} icon={<Package size={16} />} iconColor="text-cyan-600" />
        <KpiCard title="Active" value={activeCount} icon={<Clock size={16} />} iconColor="text-purple-600" />
        <KpiCard title="Ready Pickup" value={stats.readyPickup} icon={<CheckCircle size={16} />} iconColor="text-green-600"
          accent={stats.readyPickup > 0 ? "blue" : "none"} onClick={() => setStatusFilter("Ready Pickup")} />
        <KpiCard title="Incomplete" value={stats.completedUnpaid} icon={<DollarSign size={16} />} iconColor="text-yellow-600"
          accent={stats.completedUnpaid > 0 ? "yellow" : "none"} onClick={() => setStatusFilter("Incomplete")} />
        <KpiCard title="Overdue" value={stats.overdue} icon={<AlertCircle size={16} />} iconColor="text-red-600"
          accent={stats.overdue > 0 ? "red" : "none"} onClick={() => setStatusFilter("Overdue")} />
      </div>

      {/* Unified filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
        <div className="flex flex-wrap gap-2 items-center">
          <FilterDropdown label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
          <FilterDropdown label="Period" value={periodFilter} options={periodOptions} onChange={setPeriodFilter} />
          <div className="flex-1 min-w-[180px]">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search orders, customers..." />
          </div>
          <FilterDropdown label="Show" value={String(pageSize)} options={pageSizeOptions} onChange={(v) => setPageSize(Number(v))} />
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Order list / cards */}
      {viewMode === "list" ? (
        <OrdersTable orders={paginatedOrders} userRole="admin" onViewDetails={handleViewOrder}
          onEdit={(order) => openAssign(order)}
          onDelete={(order) => { setSelectedOrderId(order.id); setShowDeleteConfirm(true); }}
          highlightedId={highlightedId} />
      ) : (
        <OrderCardsGrid orders={paginatedOrders} searchQuery={searchQuery}
          onView={handleViewOrder} onEdit={(order) => openAssign(order)}
          onDelete={(order) => { setSelectedOrderId(order.id); setShowDeleteConfirm(true); }}
          highlightedId={highlightedId} />
      )}

      {/* Pagination Controls */}
      {filteredOrders.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(currentPage * pageSize, filteredOrders.length)}</span> of <span className="font-semibold text-gray-900">{filteredOrders.length}</span> orders
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
              className="px-4"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    currentPage === i + 1 
                      ? "bg-cyan-500 text-white shadow-lg shadow-cyan-100" 
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages}
              className="px-4"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateOrderModal isOpen={showCreateModal} userRole="admin" onClose={() => setShowCreateModal(false)} onSave={handleCreateOrder} />

      {selectedOrder && (
        <OrderDetailsModal isOpen={showDetailsModal} order={selectedOrder} userRole="admin"
          onClose={() => setShowDetailsModal(false)}
          onUpdateStatus={(status) => handleStatusChange(selectedOrder, status)}
          onEdit={() => { setShowDetailsModal(false); openAssign(selectedOrder); }}
          onRecordPayment={recordPayment}
          onApprovePayment={async (paymentId, orderId) => {
            const r = await approvePayment(paymentId, orderId);
            if (!r.success) throw new Error(r.error || "Approval failed");
            toast.success("Payment approved!");
          }}
          onDeclinePayment={async (paymentId, orderId, reason) => {
            const r = await declinePayment(paymentId, orderId, reason);
            if (!r.success) throw new Error(r.error || "Decline failed");
            toast.success("Payment declined.");
          }}
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
              {designers.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Production Staff</label>
            <select value={assignForm.production} onChange={e => setAssignForm({ ...assignForm, production: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">— Not Assigned —</option>
              {productionStaff.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
          <button onClick={handleDelete} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminOrders;