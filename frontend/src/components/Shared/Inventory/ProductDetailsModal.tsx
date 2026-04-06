import { X } from "lucide-react";
import type { AdminProduct } from "../../../Types";

interface ProductDetailsModalProps {
  isOpen: boolean;
  product: AdminProduct | null;
  onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ isOpen, product, onClose }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-8 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-600" /></button>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {product.isActive ? "Active" : "Inactive"}
        </span>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 mt-6 mb-6">
          <div><p className="text-xs text-gray-500">Category</p><p className="text-sm font-semibold text-gray-900">{product.category || "—"}</p></div>
          <div><p className="text-xs text-gray-500">Variant</p><p className="text-sm font-semibold text-gray-900">{product.variant || "—"}</p></div>
          <div><p className="text-xs text-gray-500">Size / Spec</p><p className="text-sm font-semibold text-gray-900">{product.sizeSpec || "—"}</p></div>
          <div><p className="text-xs text-gray-500">Description</p><p className="text-sm font-semibold text-gray-900">{product.description || "—"}</p></div>
        </div>

        {/* Price breakdown */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">Material Cost</span><span className="font-semibold">₱{product.materialCost.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Profit Fee</span><span className="font-semibold">₱{product.profitFee.toFixed(2)}</span></div>
          <div className="flex justify-between border-t pt-1"><span className="text-gray-900 font-bold">Final Price</span><span className="font-bold text-lg text-cyan-600">₱{product.finalPrice.toFixed(2)}</span></div>
        </div>

        {/* BOM table */}
        <h4 className="text-sm font-bold text-gray-800 mb-2">Bill of Materials ({product.bom.length} items)</h4>
        {product.bom.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg">No materials linked to this product.</p>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Material</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">Qty Required</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">Unit</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">Unit Cost</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">Line Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {product.bom.map(b => (
                  <tr key={b.id}>
                    <td className="px-3 py-2 text-gray-900">{b.materialName}</td>
                    <td className="px-3 py-2 text-center">{b.quantityRequired}</td>
                    <td className="px-3 py-2 text-center text-gray-500">{b.unitOfMeasure}</td>
                    <td className="px-3 py-2 text-right text-gray-600">₱{b.unitCost.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-semibold">₱{(b.quantityRequired * b.unitCost).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6">
          <button onClick={onClose} className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Close</button>
        </div>
      </div>
    </div>
  );
};
