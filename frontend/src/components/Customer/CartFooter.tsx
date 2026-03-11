import React from "react";
import {Trash2} from "lucide-react";

interface CartFooterProps {
  selectedCount: number;
  totalPrice: number;
  onRemoveSelected: () => void;
  onCheckout: () => void;
}

export const CartFooter: React.FC<CartFooterProps> = ({
  selectedCount,
  totalPrice,
  onRemoveSelected,
  onCheckout,
}) => {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 px-10 py-6 flex justify-between items-center shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)] z-20 -mx-8">
      <button
        onClick={onRemoveSelected}
        disabled={selectedCount === 0}
        className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase text-[12px] font-bold tracking-wider cursor-pointer group">
        <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span>Remove Selected ({selectedCount})</span>
      </button>

      <div className="flex items-center gap-12">
        <div className="text-right">
          <p className="text-[12px] font-bold text-gray-400 tracking-widest uppercase mb-1">
            Total Initial Price:
          </p>
          <p className="text-3xl font-black text-gray-900 leading-none">
            ₱{totalPrice.toLocaleString()}.00
          </p>
        </div>
        <button
          onClick={onCheckout}
          className="px-16 py-4 bg-cyan-400 hover:bg-cyan-500 text-white font-extrabold rounded-xl shadow-lg shadow-cyan-100 transition-all transform hover:scale-[1.05] active:scale-95 cursor-pointer text-lg">
          Checkout
        </button>
      </div>
    </div>
  );
};
