import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { AdminProduct } from "../../../Types";

interface EditProductModalProps {
  isOpen: boolean;
  product: AdminProduct | null; // null = create mode
  materials: any[]; // raw inventory_items for BOM dropdown
  onClose: () => void;
  onSave: (product: { name: string; category?: string; variant?: string; size_spec?: string; material_cost: number; profit_fee: number; final_price: number; description?: string },
    bom: { inventory_item_id: string; quantity_required: number }[]) => void;
}

interface BOMRow { inventory_item_id: string; quantity_required: number; }

export const EditProductModal: React.FC<EditProductModalProps> = ({ isOpen, product, materials, onClose, onSave }) => {
  const [form, setForm] = useState({ name: "", category: "", variant: "", size_spec: "", profit_fee: "", description: "" });
  const [bom, setBom] = useState<BOMRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({ name: product.name, category: product.category, variant: product.variant, size_spec: product.sizeSpec, profit_fee: String(product.profitFee), description: product.description });
      setBom(product.bom.map(b => ({ inventory_item_id: b.inventoryItemId, quantity_required: b.quantityRequired })));
    } else {
      setForm({ name: "", category: "", variant: "", size_spec: "", profit_fee: "", description: "" });
      setBom([]);
    }
  }, [product, isOpen]);

  const materialCost = bom.reduce((sum, row) => {
    const mat = materials.find((m: any) => m.id === row.inventory_item_id);
    return sum + (mat ? Number(mat.unit_cost) * row.quantity_required : 0);
  }, 0);
  const profitFee = Number(form.profit_fee) || 0;
  const finalPrice = materialCost + profitFee;

  const addBomRow = () => setBom([...bom, { inventory_item_id: "", quantity_required: 1 }]);
  const removeBomRow = (i: number) => setBom(bom.filter((_, idx) => idx !== i));
  const updateBomRow = (i: number, field: keyof BOMRow, value: any) => {
    const updated = [...bom];
    (updated[i] as any)[field] = field === "quantity_required" ? Number(value) || 0 : value;
    setBom(updated);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    onSave({
      name: form.name, category: form.category || undefined, variant: form.variant || undefined,
      size_spec: form.size_spec || undefined, material_cost: materialCost, profit_fee: profitFee,
      final_price: finalPrice, description: form.description || undefined,
    }, bom.filter(b => b.inventory_item_id));
    setSaving(false);
  };

  if (!isOpen) return null;

  const usedIds = bom.map(b => b.inventory_item_id);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-600" /></button>
        <h3 className="text-2xl font-bold text-gray-900 mb-6">{product ? "Edit Product" : "Add New Product"}</h3>

        {/* Product fields */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Product Name *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g., Tarpaulin 3x5" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
            <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g., Tarpaulin, T-Shirt" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Variant</label>
            <input type="text" value={form.variant} onChange={e => setForm({ ...form, variant: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g., Full Sublimation" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Size / Spec</label>
            <input type="text" value={form.size_spec} onChange={e => setForm({ ...form, size_spec: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g., 3x5 ft, A4" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Profit Fee (₱)</label>
            <input type="number" step="0.01" value={form.profit_fee} onChange={e => setForm({ ...form, profit_fee: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="0.00" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Optional description" /></div>
        </div>

        {/* BOM */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-800">Bill of Materials</h4>
            <button onClick={addBomRow} className="flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700"><Plus size={14} /> Add Material</button>
          </div>
          {bom.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg">No materials added. Click "Add Material" to define what this product uses.</p>
          ) : (
            <div className="space-y-2">
              {bom.map((row, i) => {
                const mat = materials.find((m: any) => m.id === row.inventory_item_id);
                const lineCost = mat ? Number(mat.unit_cost) * row.quantity_required : 0;
                return (
                  <div key={i} className="grid grid-cols-[1fr_100px_100px_32px] gap-2 items-center">
                    <select value={row.inventory_item_id} onChange={e => updateBomRow(i, "inventory_item_id", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                      <option value="">Select material...</option>
                      {materials.map((m: any) => (
                        <option key={m.id} value={m.id} disabled={usedIds.includes(m.id) && m.id !== row.inventory_item_id}>
                          {m.name} ({m.unit_of_measure})
                        </option>
                      ))}
                    </select>
                    <input type="number" step="0.01" min="0.01" value={row.quantity_required || ""} onChange={e => updateBomRow(i, "quantity_required", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Qty" />
                    <span className="text-sm text-gray-500 text-right">₱{lineCost.toFixed(2)}</span>
                    <button onClick={() => removeBomRow(i)} className="p-1 hover:bg-red-100 rounded"><Trash2 size={14} className="text-red-500" /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cost summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">Material Cost</span><span className="font-semibold">₱{materialCost.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Profit Fee</span><span className="font-semibold">₱{profitFee.toFixed(2)}</span></div>
          <div className="flex justify-between border-t pt-1"><span className="text-gray-900 font-bold">Final Price</span><span className="font-bold text-lg text-cyan-600">₱{finalPrice.toFixed(2)}</span></div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !form.name.trim()} className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl disabled:opacity-50">
            {saving ? "Saving..." : product ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
};
