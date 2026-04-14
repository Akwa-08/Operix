import { useState } from "react";
import { Search, Eye, Plus, X, Check, Trash2, Link } from "lucide-react";
import { useProductsData } from "../../hooks/useSupabase";
import type { AdminProduct, BOMItem } from "../../Types";

// ── Reusable field ────────────────────────────────────────────────────────
const F = ({ label, value, onChange, type = "text", placeholder = "", disabled = false, required = false }: any) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type} placeholder={placeholder} value={value}
      onChange={(e: any) => onChange(e.target.value)} disabled={disabled}
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100 text-base"
    />
  </div>
);

// ── Modal wrapper ─────────────────────────────────────────────────────────
const Modal = ({ show, onClose, title, children, width = "max-w-2xl" }: any) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl ${width} w-full p-8 relative max-h-[90vh] overflow-y-auto`} onClick={(e: any) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg">
          <X size={20} className="text-gray-600" />
        </button>
        {title && <h3 className="text-2xl font-bold text-gray-900 mb-6">{title}</h3>}
        {children}
      </div>
    </div>
  );
};

type ProductForm = {
  name: string; category: string; variant: string; size_spec: string;
  material_cost: string; profit_fee: string; final_price: string; description: string;
};

const emptyForm: ProductForm = {
  name: "", category: "", variant: "", size_spec: "",
  material_cost: "", profit_fee: "", final_price: "", description: "",
};

const categories = ["Tarpaulin", "T-Shirt", "ID Card", "Document", "Sticker", "Banner", "Others"];

const AdminProducts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"products" | "mapping">("products");

  // Modal visibility
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showMapping, setShowMapping] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [createForm, setCreateForm] = useState<ProductForm>(emptyForm);
  const [editForm, setEditForm] = useState<ProductForm>(emptyForm);

  // BOM for the create/edit modals
  const [createBOM, setCreateBOM] = useState<{ inventory_item_id: string; quantity_required: number }[]>([]);
  const [editBOM, setEditBOM] = useState<{ inventory_item_id: string; quantity_required: number }[]>([]);

  // Temporary input for adding a new BOM row
  const [newBOMItem, setNewBOMItem] = useState({ inventory_item_id: "", quantity_required: "" });

  const { products, materials, loading, createProduct, updateProduct, deleteProduct } = useProductsData();

  // ── Filtering ────────────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) =>
    !searchQuery ||
    [p.name, p.category, p.variant].some((f) => f?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // All mappings across products (for the mapping overview tab)
  const allMappings = products.flatMap((p) =>
    p.bom.map((b) => ({ ...b, productName: p.name, productId: p.id }))
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setCreateForm(emptyForm);
    setCreateBOM([]);
    setNewBOMItem({ inventory_item_id: "", quantity_required: "" });
    setShowCreate(true);
  };

  const openEdit = (p: AdminProduct) => {
    setSelectedProduct(p);
    setEditForm({
      name: p.name, category: p.category, variant: p.variant,
      size_spec: p.sizeSpec, material_cost: String(p.materialCost),
      profit_fee: String(p.profitFee), final_price: String(p.finalPrice),
      description: p.description,
    });
    setEditBOM(p.bom.map((b) => ({ inventory_item_id: b.inventoryItemId, quantity_required: b.quantityRequired })));
    setNewBOMItem({ inventory_item_id: "", quantity_required: "" });
    setShowEdit(true);
  };

  const openMapping = (p: AdminProduct) => {
    setSelectedProduct(p);
    setNewBOMItem({ inventory_item_id: "", quantity_required: "" });
    setShowMapping(true);
  };

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.final_price) {
      alert("Product name and final price are required.");
      return;
    }
    const r = await createProduct(
      {
        name: createForm.name, category: createForm.category, variant: createForm.variant,
        size_spec: createForm.size_spec, material_cost: Number(createForm.material_cost) || 0,
        profit_fee: Number(createForm.profit_fee) || 0, final_price: Number(createForm.final_price),
        description: createForm.description,
      },
      createBOM
    );
    if (r.success) setShowCreate(false);
    else alert("Error: " + r.error);
  };

  const handleUpdate = async () => {
    if (!selectedProduct) return;
    const r = await updateProduct(
      selectedProduct.id,
      {
        name: editForm.name, category: editForm.category, variant: editForm.variant,
        size_spec: editForm.size_spec, material_cost: Number(editForm.material_cost) || 0,
        profit_fee: Number(editForm.profit_fee) || 0, final_price: Number(editForm.final_price),
        description: editForm.description,
      },
      editBOM
    );
    if (r.success) setShowEdit(false);
    else alert("Error: " + r.error);
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    const r = await deleteProduct(selectedProduct.id);
    if (r.success) { setShowDelete(false); setShowEdit(false); setSelectedProduct(null); }
    else alert("Error: " + r.error);
  };

  // Add a BOM row to the current modal
  const addBOMRow = (
    bom: typeof createBOM,
    setBOM: React.Dispatch<React.SetStateAction<typeof createBOM>>
  ) => {
    if (!newBOMItem.inventory_item_id || !newBOMItem.quantity_required) {
      alert("Select a material and enter a quantity.");
      return;
    }
    if (bom.find(b => b.inventory_item_id === newBOMItem.inventory_item_id)) {
      alert("This material is already linked.");
      return;
    }
    setBOM([...bom, { inventory_item_id: newBOMItem.inventory_item_id, quantity_required: Number(newBOMItem.quantity_required) }]);
    setNewBOMItem({ inventory_item_id: "", quantity_required: "" });
  };

  const removeBOMRow = (
    idx: number,
    setBOM: React.Dispatch<React.SetStateAction<typeof createBOM>>
  ) => {
    setBOM(prev => prev.filter((_, i) => i !== idx));
  };

  // ── BOM sub-section ───────────────────────────────────────────────────────
  const BOMSection = ({
    bom, setBOM,
  }: {
    bom: typeof createBOM;
    setBOM: React.Dispatch<React.SetStateAction<typeof createBOM>>;
  }) => (
    <div className="col-span-2 border-t pt-4 mt-2">
      <p className="text-sm font-semibold text-gray-700 mb-3">🔗 Linked Materials (Bill of Materials)</p>
      {bom.length > 0 && (
        <div className="border rounded-lg overflow-hidden mb-3">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left text-gray-700 font-semibold">Material</th>
                <th className="px-3 py-2 text-center text-gray-700 font-semibold">Qty Required</th>
                <th className="px-3 py-2 text-center text-gray-700 font-semibold">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bom.map((b, i) => {
                const mat = materials.find((m: any) => m.id === b.inventory_item_id);
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{mat?.name || b.inventory_item_id}</td>
                    <td className="px-3 py-2 text-center font-bold">{b.quantity_required} {mat?.unit_of_measure || ''}</td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => removeBOMRow(i, setBOM)} className="flex items-center gap-1 px-2 py-1 hover:bg-red-100 rounded text-red-500 text-xs font-semibold mx-auto">
                        <Trash2 size={12} /> Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Add Material</label>
          <select value={newBOMItem.inventory_item_id} onChange={e => setNewBOMItem({ ...newBOMItem, inventory_item_id: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
            <option value="">Select Material</option>
            {materials.map((m: any) => (
              <option key={m.id} value={m.id}>{m.name} ({m.unit_of_measure})</option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
          <input type="number" placeholder="e.g., 2" value={newBOMItem.quantity_required}
            onChange={e => setNewBOMItem({ ...newBOMItem, quantity_required: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-cyan-500" />
        </div>
        <button onClick={() => addBOMRow(bom, setBOM)}
          className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg flex items-center gap-2">
          <Link size={16} /> Link
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" />
      <p className="ml-4 text-base text-gray-500">Loading products...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">

      {/* ═══ CREATE PRODUCT MODAL ═══ */}
      <Modal show={showCreate} onClose={() => setShowCreate(false)} title="Add New Product">
        <div className="grid grid-cols-2 gap-4 mb-2">
          <F label="Product Name" value={createForm.name} onChange={(v: string) => setCreateForm({ ...createForm, name: v })} required />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
            <select value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
              <option value="">Select Category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <F label="Variant" value={createForm.variant} onChange={(v: string) => setCreateForm({ ...createForm, variant: v })} placeholder="e.g., Matte, Glossy" />
          <F label="Size / Spec" value={createForm.size_spec} onChange={(v: string) => setCreateForm({ ...createForm, size_spec: v })} placeholder="e.g., 4ft x 8ft" />
          <F label="Material Cost (₱)" type="number" value={createForm.material_cost} onChange={(v: string) => setCreateForm({ ...createForm, material_cost: v })} placeholder="0.00" />
          <F label="Profit Fee (₱)" type="number" value={createForm.profit_fee} onChange={(v: string) => setCreateForm({ ...createForm, profit_fee: v })} placeholder="0.00" />
          <F label="Final Price (₱)" type="number" value={createForm.final_price} onChange={(v: string) => setCreateForm({ ...createForm, final_price: v })} required placeholder="0.00" />
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
              rows={2} placeholder="Optional product description..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-base resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          </div>
          <BOMSection bom={createBOM} setBOM={setCreateBOM} />
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          <button onClick={handleCreate} className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            <Plus size={18} /> Add Product
          </button>
        </div>
      </Modal>

      {/* ═══ EDIT PRODUCT MODAL ═══ */}
      <Modal show={showEdit && !!selectedProduct} onClose={() => setShowEdit(false)} title="Edit Product">
        <div className="grid grid-cols-2 gap-4 mb-2">
          <F label="Product Name" value={editForm.name} onChange={(v: string) => setEditForm({ ...editForm, name: v })} required />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
            <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
              <option value="">Select Category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <F label="Variant" value={editForm.variant} onChange={(v: string) => setEditForm({ ...editForm, variant: v })} />
          <F label="Size / Spec" value={editForm.size_spec} onChange={(v: string) => setEditForm({ ...editForm, size_spec: v })} />
          <F label="Material Cost (₱)" type="number" value={editForm.material_cost} onChange={(v: string) => setEditForm({ ...editForm, material_cost: v })} />
          <F label="Profit Fee (₱)" type="number" value={editForm.profit_fee} onChange={(v: string) => setEditForm({ ...editForm, profit_fee: v })} />
          <F label="Final Price (₱)" type="number" value={editForm.final_price} onChange={(v: string) => setEditForm({ ...editForm, final_price: v })} required />
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
              rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-base resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          </div>
          <BOMSection bom={editBOM} setBOM={setEditBOM} />
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={() => setShowEdit(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          <button onClick={() => { setShowEdit(false); setShowDelete(true); }} className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl flex items-center gap-2">
            <Trash2 size={18} /> Delete
          </button>
          <button onClick={handleUpdate} className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            <Check size={18} /> Save Changes
          </button>
        </div>
      </Modal>

      {/* ═══ DELETE CONFIRM MODAL ═══ */}
      <Modal show={showDelete && !!selectedProduct} onClose={() => setShowDelete(false)} title="" width="max-w-md">
        <div className="flex items-center gap-3 mb-4 -mt-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><Trash2 size={24} className="text-red-600" /></div>
          <div><h3 className="text-xl font-bold">Delete Product?</h3><p className="text-sm text-gray-500">This cannot be undone and will remove all material links.</p></div>
        </div>
        {selectedProduct && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Product:</span><span className="font-semibold">{selectedProduct.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Price:</span><span className="font-semibold">₱{selectedProduct.finalPrice.toLocaleString()}</span></div>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => setShowDelete(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">No, Go Back</button>
          <button onClick={handleDelete} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl">Yes, Delete</button>
        </div>
      </Modal>

      {/* ═══ MATERIAL MAPPING VIEW MODAL ═══ */}
      <Modal show={showMapping && !!selectedProduct} onClose={() => setShowMapping(false)} title={`Material Links — ${selectedProduct?.name || ''}`} width="max-w-xl">
        {selectedProduct?.bom.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-base">No materials linked.<br />Open "Edit" to add material links.</div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Material</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Qty Required</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedProduct?.bom.map((b: BOMItem) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{b.materialName}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900">{b.quantityRequired}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{b.unitOfMeasure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-6">
          <button onClick={() => { setShowMapping(false); openEdit(selectedProduct!); }}
            className="w-full px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            <Link size={18} /> Edit Material Links
          </button>
        </div>
      </Modal>

      {/* ═══ PAGE HEADER ═══ */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <p className="text-sm text-gray-500 mt-1">Manage products and their material requirements</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab("products")}
          className={`px-6 py-3 rounded-lg font-semibold text-base transition-all ${activeTab === "products" ? "bg-cyan-500 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
          🛍 Products
        </button>
        <button onClick={() => setActiveTab("mapping")}
          className={`px-6 py-3 rounded-lg font-semibold text-base transition-all ${activeTab === "mapping" ? "bg-cyan-500 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
          🔗 Material Mapping
        </button>
      </div>

      {/* Search + Add */}
      <div className="flex flex-col md:flex-row gap-3 items-center mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search products..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-cyan-500" />
        </div>
        {activeTab === "products" && (
          <button onClick={openCreate}
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg flex items-center gap-2">
            <Plus size={18} /> Add Product
          </button>
        )}
      </div>

      {/* ═══ PRODUCTS TABLE ═══ */}
      {activeTab === "products" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">All Products</h2>
            <p className="text-sm text-gray-500 mt-1">{filteredProducts.length} products</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Variant / Size</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Mat. Cost</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Profit</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Final Price</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Materials</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.category || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{[p.variant, p.sizeSpec].filter(Boolean).join(' / ') || '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">₱{p.materialCost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">₱{p.profitFee.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">₱{p.finalPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openMapping(p)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${p.bom.length > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.bom.length} linked
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openEdit(p)} className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-cyan-100 rounded-lg text-sm text-cyan-600 font-semibold mx-auto">
                        <Eye size={16} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-base">No products found. Add your first product above.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ MATERIAL MAPPING OVERVIEW ═══ */}
      {activeTab === "mapping" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Product ↔ Material Mapping</h2>
            <p className="text-sm text-gray-500 mt-1">All material consumption links across every product</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Material</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Qty Required</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allMappings.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400 text-base">No material links yet. Edit a product to add links.</td></tr>
                ) : allMappings.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{m.productName}</td>
                    <td className="px-4 py-3 text-gray-700">{m.materialName}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900">{m.quantityRequired}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{m.unitOfMeasure || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
