import React, {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {ChevronLeft, ChevronRight, PackageOpen} from "lucide-react";
import {OrdersHeader} from "../components/Customer/OrdersHeader";
import {OrderCard} from "../components/Customer/OrderCard";
import type {Order} from "../components/Customer/OrderCard";

const dummyOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-001",
    customerName: "Jane Doe",
    role: "Cashier",
    productName: "Tarpaulin",
    currentStatus: "Payment",
    orderDate: "June 25",
    dueDate: "July 28",
    price: 875,
    paymentStatus: "Partial",
    note: "Confirm the payment method and pay when necessary",
  },
  {
    id: "2",
    orderNumber: "ORD-002",
    customerName: "James Smith",
    role: "Staff",
    productName: "Tarpaulin",
    currentStatus: "Queue",
    orderDate: "June 25",
    dueDate: "July 28",
    price: 800,
    isPriceEstimated: true,
    paymentStatus: "None",
    note: "We are looking through your order right now.",
  },
  {
    id: "3",
    orderNumber: "ORD-003",
    customerName: "Jane Smith",
    role: "Designer",
    productName: "Tarpaulin",
    currentStatus: "Design",
    orderDate: "June 25",
    dueDate: "July 28",
    price: 800,
    isPriceEstimated: true,
    paymentStatus: "None",
    note: "Approve the design before proceeding for payment",
  },
  {
    id: "4",
    orderNumber: "ORD-004",
    customerName: "Production",
    role: "Production",
    productName: "Tarpaulin",
    currentStatus: "Production",
    orderDate: "June 25",
    dueDate: "July 28",
    price: 875,
    paymentStatus: "Partial",
    note: "We are now creating your order, please wait patiently.",
  },
  {
    id: "5",
    orderNumber: "ORD-005",
    customerName: "James Smith",
    role: "Staff",
    productName: "Tarpaulin",
    currentStatus: "Pick-up",
    orderDate: "June 25",
    dueDate: "July 28",
    price: 875,
    paymentStatus: "Partial",
    note: "Your order is ready for pick-up",
  },
  {
    id: "6",
    orderNumber: "ORD-006",
    customerName: "James Smith",
    role: "Staff",
    productName: "Tarpaulin",
    currentStatus: "Complete",
    orderDate: "June 25",
    dueDate: "July 28",
    price: 995,
    paymentStatus: "Paid",
    note: "Your order is complete!",
  },
  // Add some extra orders for pagination testing
  {
    id: "7",
    orderNumber: "ORD-007",
    customerName: "Alice Cooper",
    role: "Manager",
    productName: "Sticker Print",
    currentStatus: "Queue",
    orderDate: "June 26",
    dueDate: "July 30",
    price: 450,
    paymentStatus: "None",
  },
];

export const OrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("Any");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredOrders = dummyOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || order.currentStatus === statusFilter;

    // Date filter logic would go here
    const matchesDate = true;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const pagedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({top: 0, behavior: "smooth"});
  };

  return (
    <div className="w-full bg-gray-50 flex flex-col min-h-screen p-10">
      <div className="max-w-7xl mx-auto w-full">
        <OrdersHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
        />

        <AnimatePresence mode="popLayout">
          {filteredOrders.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {pagedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onViewDetails={(id: string) => console.log("View", id)}
                  onPay={(id: string) => console.log("Pay", id)}
                  onChat={(id: string) => console.log("Chat", id)}
                  onDelete={(id: string) => console.log("Delete", id)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <PackageOpen className="w-20 h-20 text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold text-lg">
                No orders found matching your criteria
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Simplified Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 mt-16 scale-110">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:text-cyan-500 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer group">
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center px-4">
              <span className="w-14 h-14 rounded-2xl bg-cyan-400 text-white flex items-center justify-center text-lg font-bold shadow-xl shadow-cyan-100 ring-4 ring-white">
                {currentPage}
              </span>
            </div>

            <button
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="p-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:text-cyan-500 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer group">
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
