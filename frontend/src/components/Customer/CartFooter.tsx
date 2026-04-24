import React from "react";
import {Trash2} from "lucide-react";

interface CartFooterProps {
  selectedCount: number;
  totalPrice: number;
  onRemoveSelected: () => void;
  onCheckout: () => void;
  isLoading?: boolean;
}

export const CartFooter: React.FC<CartFooterProps> = ({
  selectedCount,
  totalPrice,
  onRemoveSelected,
  onCheckout,
  isLoading = false,
}) => {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)] z-20 -mx-4 sm:-mx-6 md:-mx-8">
      <button
        onClick={onRemoveSelected}
        disabled={selectedCount === 0 || isLoading}
        className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs sm:text-sm font-bold tracking-wider cursor-pointer group order-2 sm:order-1"
      >
        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
        <span>Remove Selected ({selectedCount})</span>
      </button>

      <div className="flex items-center gap-4 sm:gap-6 md:gap-12 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
        <div className="text-left sm:text-right">
          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-0.5">
            Total Initial Price:
          </p>
          <p className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-none">
            ₱{totalPrice.toLocaleString()}.00
          </p>
        </div>
        <button
          onClick={onCheckout}
          disabled={isLoading}
          className="px-6 sm:px-10 md:px-16 py-3 sm:py-4 bg-cyan-400 hover:bg-cyan-500 text-white font-extrabold rounded-xl shadow-lg shadow-cyan-100 transition-all transform hover:scale-[1.05] active:scale-95 cursor-pointer text-sm sm:text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 whitespace-nowrap"
        >
          {isLoading ? "Processing..." : "Checkout"}
        </button>
      </div>
    </div>
  );
};
