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

  if (filtered.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center text-gray-400 text-base">
        No products found
      </div>
    );
  }

  const ActionBtns = ({ p }: { p: AdminProduct }) => (
    <div className="flex items-center gap-1 flex-wrap">
      <button onClick={() => onView(p)} className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-200 rounded-lg text-xs text-gray-700 font-semibold">
        <Eye size={14} /> View
      </button>
      <button onClick={() => onEdit(p)} className="flex items-center gap-1 px-2 py-1.5 hover:bg-cyan-100 rounded-lg text-xs text-cyan-700 font-semibold">
        <Edit2 size={14} /> Edit
      </button>
      {p.isActive && (
        <button onClick={() => onDelete(p)} className="flex items-center gap-1 px-2 py-1.5 hover:bg-red-100 rounded-lg text-xs text-red-700 font-semibold">
          <Trash2 size={14} /> Delete
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* ── MOBILE CARD VIEW ─────────────────────────────────────────────── */}
      <div className="md:hidden divide-y divide-gray-100">
        {filtered.map(p => (
          <div key={p.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-gray-900 text-base">{p.name}</p>
                <p className="text-sm text-gray-500">{[p.category, p.variant].filter(Boolean).join(' · ') || '—'}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {p.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {p.sizeSpec && <div><span className="text-gray-400">Size:</span> <span className="font-medium text-gray-700">{p.sizeSpec}</span></div>}
              <div><span className="text-gray-400">Price:</span> <span className="font-bold text-gray-900">₱{p.finalPrice.toLocaleString()}</span></div>
              <div><span className="text-gray-400">Material Cost:</span> <span className="text-gray-700">₱{p.materialCost.toFixed(2)}</span></div>
              <div><span className="text-gray-400">Materials:</span> <span className="text-gray-700">{p.bom.length} linked</span></div>
            </div>
            <ActionBtns p={p} />
          </div>
        ))}
      </div>

      {/* ── DESKTOP TABLE ─────────────────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
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
            {filtered.map(p => (
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
                <td className="px-4 py-3"><ActionBtns p={p} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
