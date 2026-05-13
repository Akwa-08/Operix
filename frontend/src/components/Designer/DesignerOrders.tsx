import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Upload, Package, Clock, CheckCircle } from "lucide-react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { LoadingSpinner } from "../Shared/UI/LoadingSpinner";
import { PageHeader } from "../Shared/UI/PageHeader";
import { InfoBanner } from "../Shared/UI/InfoBanner";
import { ViewToggle } from "../Shared/UI/ViewToggle";
import { getOrderStatusColor } from "../../util/formatters";
import { OrderDetailsModal } from "../Shared/Orders/OrderDetailsModal";
import { OrderCardsGrid } from "../Shared/Orders/OrderCardsGrid";
import type { Order } from "../../Types";
import { useOrdersData, useMyProfile } from "../../hooks/useSupabase";
import { useToast } from "../../context/ToastContext";
import { SukiBadge } from "../Shared/UI/SukiBadge";

const DesignerOrders = () => {
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get("highlight");
  const highlightedRef = useRef<HTMLDivElement | HTMLTableRowElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");

  const { profile } = useMyProfile();

  // Fetch all orders - we'll filter them locally for a better "Queue vs My Orders" experience
  const {
    orders: allOrders,
    loading,
    updateCustomerDesign,
    updateFinalDesign,
    updateDesignerOrderDetails,
    refresh,
    acceptAssignedDesignOrder,
    rejectAssignedDesignOrder,
    approveOrderDesign,
    handleCancellationRequest,
  } = useOrdersData();

  const [cancelReviewOrder, setCancelReviewOrder] = useState<Order | null>(null);
  const [showCancelReviewModal, setShowCancelReviewModal] = useState(false);

  const toast = useToast();

  useEffect(() => {
    if (highlightedId && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedId, loading]);

  // Include Cancel Requested orders so designer can action them
  const orders = allOrders.filter(
    (o) => o.assignedDesigner === profile?.id && !["In Queue", "Payment", "Production", "Pickup"].includes(o.status),
  ).sort((a, b) => {
    // Prioritise cancel requests
    if (a.status === "Cancel Requested" && b.status !== "Cancel Requested") return -1;
    if (a.status !== "Cancel Requested" && b.status === "Cancel Requested") return 1;
    return new Date(a.dateOrdered).getTime() - new Date(b.dateOrdered).getTime();
  });

  const stats = {
    assigned: allOrders.filter((o) => o.assignedDesigner === profile?.id).length,
    inQueue: allOrders.filter(
      (o) => o.status === "In Queue" && o.assignedDesigner === profile?.id,
    ).length,
    inProgress: allOrders.filter(
      (o) => o.status === "Designing" && o.assignedDesigner === profile?.id,
    ).length,
    completed: allOrders.filter((o) =>
      o.assignedDesigner === profile?.id && ["Payment", "Production", "Pickup", "Completed"].includes(o.status),
    ).length,
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      o.customerName?.toLowerCase().includes(q) ||
      o.orderId?.toLowerCase().includes(q) ||
      o.productType?.toLowerCase().includes(q)
    );
  });

  const selectedOrder = selectedOrderId
    ? allOrders.find((o) => o.id === selectedOrderId) ?? null
    : null;

  const handleViewOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setShowDetailsModal(true);
  };

  const handleAcceptAssigned = async (orderId: string) => {
    const r = await acceptAssignedDesignOrder(orderId);
    if (!r.success) toast.error("Error: " + r.error);
    else toast.success("Order accepted!");
  };

  const handleRejectAssigned = async (orderId: string) => {
    const r = await rejectAssignedDesignOrder(orderId);
    if (!r.success) toast.error("Error: " + r.error);
    else toast.success("Order rejected and passed to another designer.");
  };

  const handleApproveCancellation = async (orderId: string) => {
    const r = await handleCancellationRequest(orderId, true);
    if (!r.success) toast.error("Error: " + r.error);
    else { toast.success("Order cancellation approved."); setShowCancelReviewModal(false); setCancelReviewOrder(null); }
  };

  const handleRejectCancellation = async (orderId: string) => {
    const r = await handleCancellationRequest(orderId, false);
    if (!r.success) toast.error("Error: " + r.error);
    else { toast.success("Cancellation request rejected. Order back in design."); setShowCancelReviewModal(false); setCancelReviewOrder(null); }
  };

  if (loading) return <LoadingSpinner type="table" />;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="My Design Orders"
        subtitle="Orders assigned to you for design work"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatusCard
          icon={<CheckCircle size={18} />}
          title="Assigned to Me"
          value={stats.assigned}
          iconColor="text-purple-600"
        />
        <StatusCard
          icon={<Clock size={18} />}
          title="In Queue"
          value={stats.inQueue}
          iconColor="text-amber-600"
        />
        <StatusCard
          icon={<Package size={18} />}
          title="Completed"
          value={stats.completed}
          iconColor="text-emerald-600"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search assigned orders..."
            />
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>
        </div>

        <div className="p-4">
          <InfoBanner color="purple">
            <Upload size={16} className="inline mr-1" />
            <strong>Designer Workspace:</strong> View your assigned orders. Upload
            designs when ready, then advance status to "Payment".
          </InfoBanner>

          {viewMode === "list" ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-4">
              {/* MOBILE */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <p className="px-4 py-8 text-center text-gray-400">
                    No orders assigned to you
                  </p>
                ) : (
                  filteredOrders.map((o: any) => (
                    <div 
                      key={o.id} 
                      ref={highlightedId === o.id ? (el) => { (highlightedRef as any).current = el; } : null}
                      className={`p-4 space-y-2 transition-all ${highlightedId === o.id ? "highlight-pulse ring-2 ring-cyan-500" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900">{o.orderId}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-500">
                              {o.customerName} · {o.productType}
                            </p>
                            {o.isSuki && <SukiBadge />}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getOrderStatusColor(o.status)}`}>
                          {o.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Qty: {o.quantity}</span>
                        <span className="text-xs">Due: {o.dueDate}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewOrder(o)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 rounded-lg text-sm text-cyan-700 font-semibold">
                          <Package size={14} /> View
                        </button>
                        {o.status === "In Queue" &&
                          o.assignedDesigner === profile?.id && (
                            <>
                              <button
                                onClick={() => handleAcceptAssigned(o.id)}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectAssigned(o.id)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-lg border border-red-200 transition-colors">
                                Reject
                              </button>
                            </>
                          )}
                        {o.status === "Cancel Requested" && (
                          <button
                            onClick={() => { setCancelReviewOrder(o); setShowCancelReviewModal(true); }}
                            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors">
                            Review Request
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* DESKTOP */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Order ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Qty</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Due</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((o: any) => (
                      <tr 
                        key={o.id} 
                        ref={highlightedId === o.id ? (el) => { (highlightedRef as any).current = el; } : null}
                        className={`hover:bg-gray-50 transition-all ${highlightedId === o.id ? "highlight-pulse bg-cyan-50/50" : ""}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs">{o.orderId}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {o.customerName}
                            {o.isSuki && <SukiBadge />}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{o.productType}</td>
                        <td className="px-4 py-3 text-center">{o.quantity}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getOrderStatusColor(o.status)}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{o.dueDate}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleViewOrder(o)}
                              className="p-1.5 hover:bg-cyan-100 rounded-lg">
                              <Package size={16} className="text-cyan-600" />
                            </button>
                            {o.status === "In Queue" &&
                              o.assignedDesigner === profile?.id && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleAcceptAssigned(o.id)}
                                    className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg transition-colors">
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRejectAssigned(o.id)}
                                    className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg border border-red-100 transition-colors">
                                    Reject
                                  </button>
                                </div>
                              )}
                            {o.status === "Cancel Requested" && (
                              <button
                                onClick={() => { setCancelReviewOrder(o); setShowCancelReviewModal(true); }}
                                className="px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-semibold rounded-lg transition-colors">
                                Review
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                          No orders assigned to you
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <OrderCardsGrid
                orders={filteredOrders}
                onView={handleViewOrder}
                onPay={() => {}} 
                highlightedId={highlightedId}
              />
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          isOpen={showDetailsModal}
          order={selectedOrder}
          userRole="designer"
          onClose={() => setShowDetailsModal(false)}
          onEdit={async (updates) => {
            const r = await updateDesignerOrderDetails(selectedOrder.id, {
              totalAmount: updates?.totalAmount,
              dueDate: updates?.dueDate,
            });
            if (!r.success) throw new Error(r.error || "Update failed");
          }}
          onUpdateCustomerDesign={async (url) => {
            const r = await updateCustomerDesign(selectedOrder.id, url);
            if (!r.success) throw new Error(r.error || "Update failed");
          }}
          onUpdateFinalDesign={async (url) => {
            const r = await updateFinalDesign(selectedOrder.id, url);
            if (!r.success) throw new Error(r.error || "Upload failed");
          }}
          onApproveDesign={async () => {
            const r = await approveOrderDesign(selectedOrder.id);
            if (!r.success) throw new Error(r.error || "Approval failed");
          }}
          onRefresh={refresh}
        />
      )}

      {/* Cancellation Review Modal */}
      {cancelReviewOrder && showCancelReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Cancellation Request</h2>
            <p className="text-sm text-gray-500 mb-3">
              Order <span className="font-semibold text-gray-700">{cancelReviewOrder.orderId}</span>
              {" "}— <span className="text-gray-700">{cancelReviewOrder.customerName}</span>
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
              <p className="text-xs font-semibold text-red-600 mb-0.5 uppercase tracking-wide">Customer's Reason</p>
              <p className="text-sm text-red-800 leading-snug">{cancelReviewOrder.cancelReason || "No reason provided."}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCancelReviewModal(false); setCancelReviewOrder(null); }}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm">
                Close
              </button>
              <button
                onClick={() => handleRejectCancellation(cancelReviewOrder.id)}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-sm">
                Deny
              </button>
              <button
                onClick={() => handleApproveCancellation(cancelReviewOrder.id)}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm">
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignerOrders;

