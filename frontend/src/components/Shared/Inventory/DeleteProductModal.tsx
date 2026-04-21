import { X, AlertTriangle } from "lucide-react";
import type { AdminProduct } from "../../../Types";

interface DeleteProductModalProps {
  isOpen: boolean;
  product: AdminProduct | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({ isOpen, product, onClose, onDelete }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-8 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-600" /></button>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-100 rounded-full"><AlertTriangle size={24} className="text-red-600" /></div>
          <h3 className="text-xl font-bold text-gray-900">Deactivate Product</h3>
        </div>
        <p className="text-sm text-gray-600 mb-2">Are you sure you want to deactivate this product?</p>
        <div className="bg-gray-50 rounded-lg p-3 mb-6">
          <p className="font-semibold text-gray-900">{product.name}</p>
          <p className="text-xs text-gray-500">{product.category} {product.variant ? `· ${product.variant}` : ""} · ₱{product.finalPrice.toFixed(2)}</p>
        </div>
        <p className="text-xs text-gray-400 mb-6">This will hide the product from the customer catalog. It can be reactivated later.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          <button onClick={() => onDelete(product.id)} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl">Deactivate</button>
        </div>
      </div>
    </div>
  );
};
