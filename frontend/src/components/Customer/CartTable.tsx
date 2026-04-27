import React from "react";
import {Minus, Plus} from "lucide-react";

/** Product shape used by CartTable (matches Cart.tsx mapping from CartItem) */
export interface Product {
  id: string;
  title: string;
  variant: string;
  size: string;
  price: number;
  quantity: number;
  fileUrl?: string;
}

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
  onView: (id: string) => void;
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
  onView,
}) => {
  const isAllSelected =
    products.length > 0 && selectedIds.length === products.length;

  if (products.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 shadow-sm mb-6">
        Your cart is empty
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* ── Desktop table (md+) ─────────────────────────────────────────── */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr className="text-gray-500 font-bold text-xs lg:text-sm uppercase tracking-wider">
                <th className="p-4 lg:p-6 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  />
                </th>
                <th className="p-4 lg:p-6">Product</th>
                <th className="p-4 lg:p-6 text-center">Unit Price</th>
                <th className="p-4 lg:p-6 text-center">Quantity</th>
                <th className="p-4 lg:p-6 text-center">Initial Price</th>
                <th className="p-4 lg:p-6 text-center">File Status</th>
                <th className="p-4 lg:p-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="p-4 lg:p-6 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-4 lg:p-6">
                    <div>
                      <p className="font-bold text-gray-900 text-sm lg:text-base">{product.title}</p>
                      <p className="text-xs lg:text-sm text-gray-400 font-medium">
                        {product.variant} - {product.size}
                      </p>
                    </div>
                  </td>
                  <td className="p-4 lg:p-6 text-center">
                    <p className="font-bold text-gray-900 text-sm lg:text-base">
                      ₱{product.price.toLocaleString()}.00
                    </p>
                  </td>
                  <td className="p-4 lg:p-6">
                    <div className="flex items-center justify-center gap-2 lg:gap-3">
                      <button
                        onClick={() =>
                          onUpdateQuantity(product.id, (product.quantity || 1) - 1)
                        }
                        className="p-1 border border-gray-200 rounded hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3 lg:w-4 lg:h-4" />
                      </button>
                      <span className="font-bold text-gray-900 w-6 lg:w-8 text-center text-base lg:text-lg">
                        {product.quantity || 1}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateQuantity(product.id, (product.quantity || 1) + 1)
                        }
                        className="p-1 border border-gray-200 rounded hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="p-4 lg:p-6 text-center font-bold text-gray-900 text-sm lg:text-base">
                    ₱{(product.price * (product.quantity || 1)).toLocaleString()}.00
                  </td>
                  <td className="p-4 lg:p-6 text-center">
                    <button
                      onClick={() => onOpenUpload(product.id, product.title)}
                      className="cursor-pointer transition-transform active:scale-95 block mx-auto"
                    >
                      {product.fileUrl ? (
                        <div className="relative group w-12 h-12 lg:w-14 lg:h-14 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm flex items-center justify-center">
                          <img
                            src={product.fileUrl.replace("/order-attachments/", "/order-files/")}
                            alt="Design Preview"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-[9px] lg:text-[10px] font-bold uppercase tracking-wider">Change</span>
                          </div>
                        </div>
                      ) : (
                        <span className="px-2 py-1 lg:px-3 lg:py-1.5 bg-orange-50 text-orange-500 text-xs font-bold uppercase tracking-wider rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors">
                          Missing
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="p-4 lg:p-6">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => onView(product.id)}
                        className="px-2 py-1.5 lg:px-3 bg-cyan-400 text-white text-xs font-bold rounded-lg hover:bg-cyan-500 transition-colors cursor-pointer"
                      >
                        View
                      </button>
                      <button
                        onClick={() => onRemove(product.id)}
                        className="px-2 py-1.5 lg:px-3 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile cards (below md) ──────────────────────────────────────── */}
      <div className="md:hidden flex flex-col gap-3">
        {/* Select all row */}
        <label className="flex items-center gap-3 px-1 py-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
          />
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Select All
          </span>
        </label>

        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
          >
            {/* Card top row: checkbox + product info */}
            <div className="flex items-start gap-3 p-4">
              <input
                type="checkbox"
                checked={selectedIds.includes(product.id)}
                onChange={() => toggleSelect(product.id)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 cursor-pointer flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">{product.title}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {product.variant} — {product.size}
                </p>
                <p className="text-xs font-semibold text-gray-600 mt-1">
                  ₱{product.price.toLocaleString()}.00 / unit
                </p>
              </div>
              {/* File thumbnail */}
              <button
                onClick={() => onOpenUpload(product.id, product.title)}
                className="flex-shrink-0 cursor-pointer"
              >
                {product.fileUrl ? (
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                    <img
                      src={product.fileUrl.replace("/order-attachments/", "/order-files/")}
                      alt="Design Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <span className="px-2 py-1 bg-orange-50 text-orange-500 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-orange-200 block text-center">
                    No File
                  </span>
                )}
              </button>
            </div>

            {/* Card bottom: qty stepper + subtotal + actions */}
            <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3 flex items-center justify-between gap-3">
              {/* Quantity */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(product.id, (product.quantity || 1) - 1)}
                  className="p-1 border border-gray-200 rounded-md hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-gray-900 w-6 text-center text-sm">
                  {product.quantity || 1}
                </span>
                <button
                  onClick={() => onUpdateQuantity(product.id, (product.quantity || 1) + 1)}
                  className="p-1 border border-gray-200 rounded-md hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Subtotal */}
              <span className="font-black text-gray-900 text-sm">
                ₱{(product.price * (product.quantity || 1)).toLocaleString()}.00
              </span>

              {/* Actions */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => onView(product.id)}
                  className="px-3 py-1.5 bg-cyan-400 text-white text-xs font-bold rounded-lg hover:bg-cyan-500 transition-colors cursor-pointer"
                >
                  View
                </button>
                <button
                  onClick={() => onRemove(product.id)}
                  className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                >
                  Del
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="mt-4 px-4 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">
            Page <span className="text-gray-900 font-bold">{currentPage}</span>{" "}
            of <span className="text-gray-900 font-bold">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Previous
            </button>
            <div className="flex items-center px-2">
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-cyan-500 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-cyan-200">
                {currentPage}
              </span>
            </div>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
