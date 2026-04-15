// src/pages/OrdersPage.tsx
// Customer orders page — fetches real data from Supabase via useOrdersData()

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, PackageOpen, Search, Filter, Calendar } from "lucide-react";
import { OrderCard } from "../components/Customer/OrderCard";
import type { Order as CardOrder } from "../components/Customer/OrderCard";
import { OrderDetailsModal } from "../components/Shared/Orders/OrderDetailsModal";
import type { Order } from "../Types";
import { useOrdersData } from "../hooks/useSupabase";
import { LoadingSpinner } from "../components/Shared/UI/LoadingSpinner";

// Map backend status → customer card status
const mapCardStatus = (status: string): CardOrder["currentStatus"] => {
  const map: Record<string, CardOrder["currentStatus"]> = {
    "In Queue": "Queue", "Designing": "Design", "Design Approval": "Design",
    "Payment": "Payment", "Production": "Production", "Pickup": "Pick-up",
    "Completed": "Complete", "Cancelled": "Complete",
  };
  return map[status] || "Queue";
};

const mapPaymentStatus = (status: string): CardOrder["paymentStatus"] => {
  if (status === "Paid") return "Paid";
  if (status === "Partial") return "Partial";
  return "None";
};

// Map Order → CardOrder for the existing OrderCard component
const toCardOrder = (o: Order): CardOrder => ({
  id: o.id,
  orderNumber: o.orderId,
  customerName: o.customerName || "Me",
  role: "Customer",
  productName: o.productType || o.product || "—",
  currentStatus: mapCardStatus(o.status),
  orderDate: o.dateOrdered,
  dueDate: o.dueDate || "—",
  price: o.totalAmount,
  isPriceEstimated: o.status === "In Queue",
  paymentStatus: mapPaymentStatus(o.paymentStatus),
  note: o.specialInstructions || undefined,
});

export const OrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("Any");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const itemsPerPage = 6;

  const { orders, loading } = useOrdersData();

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      o.orderId.toLowerCase().includes(q) ||
      (o.productType || "").toLowerCase().includes(q) ||
      (o.customerName || "").toLowerCase().includes(q);

    const cardStatus = mapCardStatus(o.status);
    const matchesStatus = statusFilter === "All" || cardStatus === statusFilter;

    let matchesDate = true;
    if (dateFilter !== "Any") {
      const d = new Date(o.dateOrdered);
      const now = new Date();
      if (dateFilter === "Today") matchesDate = d.toDateString() === now.toDateString();
      else if (dateFilter === "Week") matchesDate = d >= new Date(now.getTime() - 7*24*60*60*1000);
      else if (dateFilter === "Month") matchesDate = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const pagedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const cardOrders = pagedOrders.map(toCardOrder);

  const handleViewDetails = (id: string) => {
    const order = orders.find(o => o.id === id);
    if (order) { setSelectedOrder(order); setShowDetails(true); }
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
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl font-bold tracking-tight">My Orders</motion.h1>

          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6 transition-colors group-focus-within:text-cyan-500" />
            <input type="text" placeholder="Search by order ID or product name..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm font-medium shadow-sm transition-all hover:shadow-md" />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="flex-1 sm:w-48 flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Status Filter</label>
                <div className="relative group">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-cyan-500 transition-colors" />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-12 pr-10 py-4 bg-white border border-gray-100 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/10 text-sm font-semibold text-gray-600 cursor-pointer shadow-sm hover:border-gray-200 transition-all">
                    <option value="All">All Status</option>
                    <option value="Queue">In Queue</option>
                    <option value="Design">Designing</option>
                    <option value="Payment">Payment Pending</option>
                    <option value="Production">In Production</option>
                    <option value="Pick-up">Ready for Pick-up</option>
                    <option value="Complete">Completed</option>
                  </select>
                </div>
              </div>
              <div className="flex-1 sm:w-48 flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Date Filter</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-cyan-500 transition-colors" />
                  <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full pl-12 pr-10 py-4 bg-white border border-gray-100 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/10 text-sm font-semibold text-gray-600 cursor-pointer shadow-sm hover:border-gray-200 transition-all">
                    <option value="Any">Any Date</option>
                    <option value="Today">Today</option>
                    <option value="Week">This Week</option>
                    <option value="Month">This Month</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <AnimatePresence mode="popLayout">
          {filteredOrders.length > 0 ? (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {cardOrders.map((order) => (
                <OrderCard key={order.id} order={order}
                  onViewDetails={handleViewDetails}
                  onPay={(id: string) => handleViewDetails(id)}
                  onChat={(id: string) => console.log("Chat", id)} />
              ))}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <PackageOpen className="w-20 h-20 text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold text-lg">No orders found matching your criteria</p>
            </motion.div>
          )}
        </AnimatePresence>

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
        <OrderDetailsModal isOpen={showDetails} order={selectedOrder} userRole="customer"
          onClose={() => setShowDetails(false)} />
      )}
    </div>
  );
};
