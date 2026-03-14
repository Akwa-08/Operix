import React from "react";
import {Search, ListFilter} from "lucide-react";

interface CartFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const CartFilters: React.FC<CartFiltersProps> = ({
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="flex gap-4 mb-8">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 font-bold" />
        <input
          type="text"
          placeholder="Search product"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-700 shadow-sm transition-shadow hover:shadow-md"
        />
      </div>
      <button className="flex items-center gap-2 px-8 py-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all cursor-pointer font-bold shadow-sm hover:shadow-md">
        <ListFilter className="w-5 h-5" />
        <span className="text-sm">Filter</span>
      </button>
      <button className="flex items-center gap-2 px-8 py-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all cursor-pointer font-bold shadow-sm hover:shadow-md">
        <ListFilter className="w-5 h-5 rotate-90" />
        <span className="text-sm">Price</span>
      </button>
    </div>
  );
};
