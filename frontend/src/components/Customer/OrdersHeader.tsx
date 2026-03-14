import React from "react";
import {Search, Plus, Filter, Calendar} from "lucide-react";
import {motion} from "framer-motion";

interface OrdersHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  dateFilter: string;
  setDateFilter: (filter: string) => void;
}

export const OrdersHeader: React.FC<OrdersHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
}) => {
  return (
    <div className="flex flex-col gap-6 mb-12 text-gray-900">
      {/* Title Row */}
      <motion.h1
        initial={{opacity: 0, x: -20}}
        animate={{opacity: 1, x: 0}}
        className="text-3xl font-bold tracking-tight">
        Orders
      </motion.h1>

      {/* Search Row */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6 transition-colors group-focus-within:text-cyan-500" />
        <input
          type="text"
          placeholder="Search by order ID or product name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-16 pr-6 py-5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm font-medium shadow-sm transition-all hover:shadow-md"
        />
      </div>

      {/* Filters & Actions Row */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative group flex-1 sm:w-48">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-cyan-500 transition-colors" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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

          <div className="relative group flex-1 sm:w-48">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-cyan-500 transition-colors" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-12 pr-10 py-4 bg-white border border-gray-100 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/10 text-sm font-semibold text-gray-600 cursor-pointer shadow-sm hover:border-gray-200 transition-all">
              <option value="Any">Any Date</option>
              <option value="Today">Today</option>
              <option value="Week">This Week</option>
              <option value="Month">This Month</option>
            </select>
          </div>
        </div>

        <motion.button
          whileHover={{scale: 1.02}}
          whileTap={{scale: 0.98}}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-cyan-400 text-white font-bold text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-cyan-100 transition-all cursor-pointer">
          <Plus className="w-5 h-5" />
          New Order
        </motion.button>
      </div>
    </div>
  );
};
