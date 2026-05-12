import React from "react";

interface CartHeaderProps {
  totalItems: number;
}

export const CartHeader: React.FC<CartHeaderProps> = ({totalItems}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-6 sm:mb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          Shopping Cart
        </h1>
        <p className="text-gray-500 text-sm sm:text-base md:text-lg mt-1">Manage your pending orders</p>
      </div>
      <div className="text-left sm:text-right pb-1">
        <p className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase mb-1">
          Inventory
        </p>
        <p className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
          {totalItems} <span className="text-base sm:text-lg font-bold">total items</span>
        </p>
      </div>
    </div>
  );
};
