import React from "react";

interface CartHeaderProps {
  totalItems: number;
}

export const CartHeader: React.FC<CartHeaderProps> = ({totalItems}) => {
  return (
    <div className="flex justify-between items-end mb-10">
      <div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Shopping Cart
        </h1>
        <p className="text-gray-500 text-lg mt-1">Manage your pending orders</p>
      </div>
      <div className="text-right pb-1">
        <p className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase mb-1">
          Inventory
        </p>
        <p className="text-2xl font-black text-gray-900 leading-none">
          {totalItems} <span className="text-lg font-bold">total items</span>
        </p>
      </div>
    </div>
  );
};
