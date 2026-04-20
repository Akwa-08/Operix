// src/pages/OrdersPage.tsx
// Customer orders page — fetches real data from Supabase via useOrdersData()

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Search, Package, Clock, CheckCircle } from "lucide-react";
import { CustomerOrderDetailsModal } from "../components/Customer/CustomerOrderDetailsModal";
import { OrderCardsGrid } from "../components/Shared/Orders/OrderCardsGrid";
import { KpiCard } from "../components/Shared/UI/KpiCard";
import { FilterDropdown } from "../components/Shared/UI/FilterDropdown";
import type { Order } from "../Types";
import { useOrdersData } from "../hooks/useSupabase";
import { LoadingSpinner } from "../components/Shared/UI/LoadingSpinner";

export const OrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const itemsPerPage = 6;

  const { orders, loading, refresh } = useOrdersData();

  // When orders re-fetches (e.g. after a file upload), sync selectedOrder
  // so the modal receives the latest data (including new designFile URLs).
  useEffect(() => {
    if (selectedOrder) {
      const fresh = orders.find(o => o.id === selectedOrder.id);
      // Only update if the reference has changed (e.g. after a memoized re-map)
      if (fresh && fresh !== selectedOrder) {
        setSelectedOrder(fresh);
      } else if (!fresh && selectedOrder) {
        // Handle case where order might have been deleted/hidden
        setSelectedOrder(null);
        setShowDetails(false);
      }
    }
  }, [orders, selectedOrder]);

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
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="w-full bg-gray-50 flex flex-col min-h-screen p-10">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-12 text-gray-900">
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl font-bold tracking-tight mb-2">My Orders</motion.h1>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <KpiCard title="Total Orders" value={orders.length} icon={<Package size={16} />} iconColor="text-cyan-600" />
            <KpiCard title="Active" value={activeCount} icon={<Clock size={16} />} iconColor="text-purple-600" />
            <KpiCard title="Ready Pickup" value={readyPickupCount} icon={<CheckCircle size={16} />} iconColor="text-green-600" />
          </div>

          {/* Unified filter bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm mb-6">
            <div className="flex flex-wrap gap-2 items-center">
              <FilterDropdown label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
              <FilterDropdown label="Period" value={dateFilter} options={periodOptions} onChange={setDateFilter} />
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Search by order ID or product..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 bg-gray-50 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm font-medium transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="mt-8">
          <OrderCardsGrid orders={pagedOrders} onView={handleViewDetails} />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 mt-16 scale-110">
            <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
              className="p-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:text-cyan-500 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer group">
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center px-4">
              <span className="w-14 h-14 rounded-2xl bg-cyan-400 text-white flex items-center justify-center text-lg font-bold shadow-xl shadow-cyan-100 ring-4 ring-white">
                {currentPage}
              </span>
            </div>
            <button onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
              className="p-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:text-cyan-500 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer group">
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
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
          onRefresh={refresh} // Need to pass refresh from useOrdersData
        />
      )}
    </div>
  );
};
