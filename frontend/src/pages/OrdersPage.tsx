// src/pages/OrdersPage.tsx
// Customer orders page — fetches real data from Supabase via useOrdersData()

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Search, Package, Clock, CheckCircle } from "lucide-react";
import { CustomerOrderDetailsModal } from "../components/Customer/CustomerOrderDetailsModal";
import { CustomerPaymentModal } from "../components/Customer/CustomerPaymentModal";
import { OrderCardsGrid } from "../components/Shared/Orders/OrderCardsGrid";
import { KpiCard } from "../components/Shared/UI/KpiCard";
import { FilterDropdown } from "../components/Shared/UI/FilterDropdown";
import type { Order } from "../Types";
import { useOrdersData } from "../hooks/useSupabase";
import { LoadingSpinner } from "../components/Shared/UI/LoadingSpinner";
import { db } from "../lib/database";
import { useToast } from "../context/ToastContext";
import { ConfirmModal } from "../components/Shared/UI/ConfirmModal";

export const OrdersPage: React.FC = () => {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modals state
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPayOrderId, setSelectedPayOrderId] = useState<string | null>(null);
  
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  
  const itemsPerPage = 6;

  const { orders, loading, refresh, recordPayment, acceptFinalDesignAsCustomer } = useOrdersData();

  // Derive the full order object from the current orders array.
  // This always reflects the latest data without needing a useEffect sync.
  const selectedOrder = selectedOrderId
    ? orders.find(o => o.id === selectedOrderId) ?? null
    : null;
    
  const selectedPayOrder = selectedPayOrderId
    ? orders.find(o => o.id === selectedPayOrderId) ?? null
    : null;

  const statusOptions = ["All", "In Queue", "Active", "Completed"];
  const periodOptions = ["All Time", "Today", "This Week", "This Month"];

  const filteredOrders = orders.filter((o) => {
    let pass = true;
    
    // Status Filter
    if (statusFilter === "In Queue") pass = o.status === "In Queue";
    else if (statusFilter === "Active") pass = ["Designing", "Payment", "Production", "Pickup"].includes(o.status);
    else if (statusFilter === "Completed") pass = o.status === "Completed";

    // Date Filter
    if (dateFilter !== "All Time" && pass) {
      const d = new Date(o.dateOrdered);
      const now = new Date();
      if (dateFilter === "Today") pass = d.toDateString() === now.toDateString();
      else if (dateFilter === "This Week") pass = d >= new Date(now.getTime() - 7*24*60*60*1000);
      else if (dateFilter === "This Month") pass = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }

    // Search Query
    if (pass && searchQuery) {
      const q = searchQuery.toLowerCase();
      pass = o.orderId.toLowerCase().includes(q) || (o.productType || "").toLowerCase().includes(q);
    }

    return pass;
  });

  // Calculate stats for KPIs
  const activeCount = orders.filter(o => ["Designing", "Payment", "Production"].includes(o.status)).length;
  const readyPickupCount = orders.filter(o => o.status === "Pickup").length;

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const pagedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleViewDetails = (order: Order) => {
    setSelectedOrderId(order.id);
    setShowDetails(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteOrder = async (order: Order) => {
    if (order.status === "In Queue") {
      setOrderToCancel(order);
      setShowCancelConfirm(true);
    } else if (order.status === "Designing") {
      toast.error(
        "Your order is currently being designed. Please message our designer to request a cancellation."
      );
    } else {
      toast.error(
        "Order cannot be cancelled at this stage. Please contact us for assistance."
      );
    }
  };

  const handlePayOrder = (order: Order) => {
    if (order.status !== "Payment") return;
    setSelectedPayOrderId(order.id);
    setShowPayment(true);
  };

  const handleSubmitPayment = async (payment: any) => {
    if (!selectedPayOrderId) return { success: false, error: "No order selected" };
    try {
      await recordPayment(selectedPayOrderId, payment);
      refresh();
      toast.success("Payment recorded successfully.");
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to record payment" };
    }
  };

  const handleAcceptFinalDesign = async (order: Order) => {
    const r = await acceptFinalDesignAsCustomer(order.id);
    if (!r.success) {
      throw new Error(r.error || "Failed to accept final design");
    }
    await refresh();
  };

  if (loading) return <LoadingSpinner type="table" />;

  return (
    <div className="w-full bg-gray-50 flex flex-col min-h-screen p-4 sm:p-6 md:p-10">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:gap-6 mb-8 sm:mb-12 text-gray-900">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl sm:text-3xl font-bold tracking-tight"
          >
            My Orders
          </motion.h1>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <KpiCard title="Total Orders" value={orders.length} icon={<Package size={16} />} iconColor="text-cyan-600" />
            <KpiCard title="Active" value={activeCount} icon={<Clock size={16} />} iconColor="text-purple-600" />
            <KpiCard title="Ready Pickup" value={readyPickupCount} icon={<CheckCircle size={16} />} iconColor="text-green-600" />
          </div>

          {/* Unified filter bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-2 sm:p-3 shadow-sm mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
              <div className="flex gap-2">
                <FilterDropdown label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
                <FilterDropdown label="Period" value={dateFilter} options={periodOptions} onChange={setDateFilter} />
              </div>
              <div className="flex-1 min-w-0 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by order ID or product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 bg-gray-50 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm font-medium transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div>
          <OrderCardsGrid 
            orders={pagedOrders} 
            onView={handleViewDetails} 
            onDelete={handleDeleteOrder} 
            onPay={handlePayOrder} 
            hideDeleteWhen={(o) => o.status !== "In Queue" && o.status !== "Designing"}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 sm:gap-6 mt-10 sm:mt-16">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 sm:p-4 bg-white border border-gray-200 rounded-xl sm:rounded-2xl hover:bg-gray-50 hover:text-cyan-500 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer group"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center px-2 sm:px-4">
              <span className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-cyan-400 text-white flex items-center justify-center text-base sm:text-lg font-bold shadow-xl shadow-cyan-100 ring-4 ring-white">
                {currentPage}
              </span>
            </div>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 sm:p-4 bg-white border border-gray-200 rounded-xl sm:rounded-2xl hover:bg-gray-50 hover:text-cyan-500 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer group"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedOrder && (
        <CustomerOrderDetailsModal 
          isOpen={showDetails} 
          order={selectedOrder} 
          onClose={() => setShowDetails(false)}
          onAcceptFinalDesign={handleAcceptFinalDesign}
        />
      )}

      {/* Payment Modal */}
      {selectedPayOrder && (
        <CustomerPaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          orderId={selectedPayOrder.id}
          orderNumber={selectedPayOrder.orderId}
          totalAmount={selectedPayOrder.totalAmount}
          amountPaid={selectedPayOrder.amountPaid || 0}
          onSubmit={handleSubmitPayment}
        />
      )}
 
      {orderToCancel && (
        <ConfirmModal
          isOpen={showCancelConfirm}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={async () => {
            try {
              await db.deleteOrder(orderToCancel.id);
              toast.success("Order cancelled successfully.");
              refresh();
            } catch (err: any) {
              toast.error(err.message || "Failed to cancel order.");
            }
          }}
          title="Cancel Order"
          message={`Are you sure you want to cancel order ${orderToCancel.orderId}? This action cannot be undone.`}
          confirmLabel="Cancel Order"
          variant="danger"
        />
      )}
    </div>
  );
};
