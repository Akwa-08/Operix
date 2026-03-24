import { Eye, Edit2, Trash2 } from "lucide-react";
import type { AdminProduct } from "../../../Types";

interface ProductsTableProps {
  products: AdminProduct[];
  searchQuery?: string;
  onView: (product: AdminProduct) => void;
  onEdit: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products, searchQuery = "", onView, onEdit, onDelete,
}) => {
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.variant.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Product Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Variant</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Size</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Material Cost</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Profit Fee</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Final Price</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">BOM</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No products found</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900 font-semibold">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.category || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{p.variant || "—"}</td>
                <td className="px-4 py-3 text-center text-gray-600">{p.sizeSpec || "—"}</td>
                <td className="px-4 py-3 text-right text-gray-600">₱{p.materialCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-right text-gray-600">₱{p.profitFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">₱{p.finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">{p.bom.length} items</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => onView(p)} className="p-1.5 hover:bg-gray-200 rounded-lg" title="View"><Eye size={16} className="text-gray-600" /></button>
                    <button onClick={() => onEdit(p)} className="p-1.5 hover:bg-gray-200 rounded-lg" title="Edit"><Edit2 size={16} className="text-gray-600" /></button>
                    <button onClick={() => onDelete(p)} className="p-1.5 hover:bg-red-100 rounded-lg" title="Delete"><Trash2 size={16} className="text-red-600" /></button>
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
