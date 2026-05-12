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
    <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 font-bold" />
        <input
          type="text"
          placeholder="Search product"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 sm:py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm sm:text-base text-gray-700 shadow-sm transition-shadow hover:shadow-md"
        />
      </div>
      <div className="flex gap-2 sm:gap-3">
        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-8 py-3 sm:py-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all cursor-pointer font-bold shadow-sm hover:shadow-md text-sm">
          <ListFilter className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Filter</span>
        </button>
        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-8 py-3 sm:py-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all cursor-pointer font-bold shadow-sm hover:shadow-md text-sm">
          <ListFilter className="w-4 h-4 sm:w-5 sm:h-5 rotate-90" />
          <span>Price</span>
        </button>
      </div>
    </div>
  );
};
