//src\components\Shared\Inventory\ProductsTable.tsx

import { Eye, Edit2, Trash2 } from "lucide-react";
import type { UserRole } from "../../../Types";
import { permissions } from "../../../util/permissions";

interface Product {
  id: string;
  productName: string;
  category: string;
  price: number;
  stockQuantity: number;
  status: "Available" | "Low Stock" | "Out of Stock" | "Discontinued";
  description?: string;
}

interface ProductsTableProps {
  products: Product[];
  userRole: UserRole;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete?: (product: Product) => void;
  searchQuery?: string;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  userRole,
  onView,
  onEdit,
  onDelete,
  searchQuery = "",
}) => {
  const perms = permissions[userRole].inventory;

  const filteredProducts = products.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "text-green-600";
      case "Low Stock":
        return "text-yellow-600";
      case "Out of Stock":
        return "text-red-600";
      case "Discontinued":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Product Name
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Category
              </th>
              {perms.canViewAll && (
                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                  Price
                </th>
              )}
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Stock Quantity
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Status
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900 font-semibold">
                  {product.productName}
                </td>
                <td className="px-4 py-3 text-gray-600">{product.category}</td>
                {perms.canViewAll && (
                  <td className="px-4 py-3 text-center text-gray-900 font-semibold">
                    ₱{product.price.toLocaleString()}
                  </td>
                )}
                <td className="px-4 py-3 text-center font-semibold text-gray-900">
                  {product.stockQuantity}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`font-semibold ${getStatusColor(product.status)}`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onView(product)}
                      className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye size={18} className="text-gray-600" />
                    </button>
                    {(perms.canEditAllFields || perms.canEditStock) && (
                      <button
                        onClick={() => onEdit(product)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} className="text-gray-600" />
                      </button>
                    )}
                    {perms.canDelete && onDelete && (
                      <button
                        onClick={() => onDelete(product)}
                        className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
