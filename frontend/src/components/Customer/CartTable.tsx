import React from "react";
import {Minus, Plus} from "lucide-react";
import type {Product} from "../../store/productsSlice";

interface CartTableProps {
  products: Product[];
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemove: (id: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpenUpload: (productId: string, productName: string) => void;
}

export const CartTable: React.FC<CartTableProps> = ({
  products,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  onUpdateQuantity,
  onRemove,
  currentPage,
  totalPages,
  onPageChange,
  onOpenUpload,
}) => {
  const isAllSelected =
    products.length > 0 && selectedIds.length === products.length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-6">
      <table className="w-full text-left">
        <thead className="bg-gray-50/50 border-b border-gray-200">
          <tr className="text-gray-400 font-bold text-xs uppercase tracking-wider">
            <th className="p-6 w-12 text-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
              />
            </th>
            <th className="p-6">Product</th>
            <th className="p-6 text-center">Unit Price</th>
            <th className="p-6 text-center">Quantity</th>
            <th className="p-6 text-center">Initial Price</th>
            <th className="p-6 text-center">Status</th>
            <th className="p-6 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-12 text-center text-gray-400">
                Your cart is empty
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  />
                </td>
                <td className="p-6">
                  <div>
                    <p className="font-bold text-gray-900">{product.title}</p>
                    <p className="text-sm text-gray-400 font-medium">
                      {product.variant} - {product.size}
                    </p>
                  </div>
                </td>
                <td className="p-6 text-center">
                  <p className="font-bold text-gray-900">
                    ₱{product.price.toLocaleString()}.00
                  </p>
                </td>
                <td className="p-6">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() =>
                        onUpdateQuantity(
                          product.id,
                          (product.quantity || 1) - 1,
                        )
                      }
                      className="p-1 border border-gray-200 rounded hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-gray-900 w-6 text-center">
                      {product.quantity || 1}
                    </span>
                    <button
                      onClick={() =>
                        onUpdateQuantity(
                          product.id,
                          (product.quantity || 1) + 1,
                        )
                      }
                      className="p-1 border border-gray-200 rounded hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="p-6 text-center font-bold text-gray-900">
                  ₱{(product.price * (product.quantity || 1)).toLocaleString()}
                  .00
                </td>
                <td className="p-6 text-center">
                  <button
                    onClick={() => onOpenUpload(product.id, product.title)}
                    className="cursor-pointer transition-transform active:scale-95">
                    {product.fileUrl ? (
                      <span className="px-3 py-1 bg-green-50 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-green-200 hover:bg-green-100 transition-colors">
                        Uploaded
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-orange-50 text-orange-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-orange-200 hover:bg-orange-100 transition-colors">
                        Missing
                      </span>
                    )}
                  </button>
                </td>
                <td className="p-6">
                  <div className="flex justify-center gap-1">
                    <button className="px-2 py-1 bg-cyan-400 text-white text-[10px] font-bold rounded hover:bg-cyan-500 transition-colors cursor-pointer">
                      View
                    </button>
                    <button
                      onClick={() => onRemove(product.id)}
                      className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded hover:bg-red-600 transition-colors cursor-pointer">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
          <p className="text-sm text-gray-500 font-medium">
            Page <span className="text-gray-900 font-bold">{currentPage}</span>{" "}
            of <span className="text-gray-900 font-bold">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
              Previous
            </button>
            <div className="flex items-center px-2">
              <span className="w-9 h-9 rounded-lg bg-cyan-500 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-cyan-200">
                {currentPage}
              </span>
            </div>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
