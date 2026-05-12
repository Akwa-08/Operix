import { useState } from "react";
import { Plus, Package, CheckCircle, AlertTriangle, X, Truck, Clock, ChevronDown, MoreVertical, Star, Flag } from "lucide-react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { Button } from "../Shared/UI/Button";
import { LoadingSpinner } from "../Shared/UI/LoadingSpinner";
import { PageHeader } from "../Shared/UI/PageHeader";
import { getDeliveryStatusColor } from "../../util/formatters";
import { MaterialsTable } from "../Shared/Inventory/MaterialsTable";
import { EditMaterialModal } from "../Shared/Inventory/EditMaterialModal";
import { MaterialDetailsModal } from "../Shared/Inventory/MaterialDetailsModal";
import { DeleteMaterialModal } from "../Shared/Inventory/DeleteMaterialModal";
import { ProductsTable } from "../Shared/Inventory/ProductsTable";
import { EditProductModal } from "../Shared/Inventory/EditProductModal";
import { ProductDetailsModal } from "../Shared/Inventory/ProductDetailsModal";
import { DeleteProductModal } from "../Shared/Inventory/DeleteProductModal";
import { DeliveryDetailsModal } from "../Shared/Inventory/DeliveryDetailsModal";
import type { Material, AdminProduct, Delivery } from "../../Types";
import { useInventoryData, useProductsData, useDeliveries } from "../../hooks/useSupabase";
import { useToast } from "../../context/ToastContext";
import { db } from "../../lib/database";

// ── Reusable Modal Shell ─────────────────────────────────────────────────────
const Modal = ({ show, onClose, title, children, width = "max-w-2xl" }: { show: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: string }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl ${width} w-full max-h-[90vh] overflow-y-auto p-8 relative`} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-600" /></button>
        <h3 className="text-2xl font-bold text-gray-900 mb-6">{title}</h3>
        {children}
      </div>
    </div>
  );
};

const getFlagPriority = (category?: string) => {
  if (category === "Preferred") return 1;
  if (category === "Warning") return 3;
  if (category === "Critical") return 4;
  return 2;
};

const renderSupplierNameWithFlag = (s: any, nameKey: string = "name", categoryKey: string = "flag_category") => {
  const category = s[categoryKey] || s.flagCategory;
  const name = s[nameKey];
  return (
    <span className="flex items-center gap-1.5">
      {category === "Preferred" && <Star size={14} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />}
      {category === "Warning" && <AlertTriangle size={14} className="text-orange-500 flex-shrink-0" />}
      {category === "Critical" && <Flag size={14} className="text-red-600 fill-red-600 flex-shrink-0" />}
      <span className="truncate">{name}</span>
    </span>
  );
};

const AdminInventory = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("Materials");
  const [searchQuery, setSearchQuery] = useState("");
  // ── Filters & Search ──
  const [materialStatusFilter, setMaterialStatusFilter] = useState("All");
  const [productStatusFilter, setProductStatusFilter] = useState("All");

  // ── Materials state ──
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showCreateMaterialModal, setShowCreateMaterialModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: "", unit_of_measure: "", current_quantity: "", reorder_point: "", unit_cost: "", description: "", purchase_unit: "", conversion_rate: "" });
  const [creating, setCreating] = useState(false);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);

  // ── Products state ──
  const [showProductView, setShowProductView] = useState(false);
  const [showProductEdit, setShowProductEdit] = useState(false);
  const [showProductDelete, setShowProductDelete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [showCreateProduct, setShowCreateProduct] = useState(false);

  // ── Deliveries state ──
  const [showCreateDelivery, setShowCreateDelivery] = useState(false);
  const [showConfirmReceipt, setShowConfirmReceipt] = useState(false);
  const [showViewDelivery, setShowViewDelivery] = useState(false);
  const [showEditDelivery, setShowEditDelivery] = useState(false);
  const [showFaultyModal, setShowFaultyModal] = useState(false);
  const [showCancelDeliveryModal, setShowCancelDeliveryModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [newDelivery, setNewDelivery] = useState({ inventory_item_id: "", supplier_id: "", requested_quantity: "", expected_arrival_date: "", notes: "" });
  const [editDeliveryForm, setEditDeliveryForm] = useState({ requested_quantity: "", expected_arrival_date: "", notes: "", supplier_id: "" });
  const [faultyReason, setFaultyReason] = useState("");
  const [receipt, setReceipt] = useState({ received_quantity: "", receipt_reference_number: "" });
  const [showManageSuppliersModal, setShowManageSuppliersModal] = useState(false);
  const [selectedMaterialSuppliers, setSelectedMaterialSuppliers] = useState<string[]>([]);
  const [savingSuppliers, setSavingSuppliers] = useState(false);
  const [restockSearch, setRestockSearch] = useState("");
  const [restockSupplierSearch, setRestockSupplierSearch] = useState("");
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  const tabs = ["Materials", "Products", "Deliveries"];
  const {
    materials,
    stats: materialStats,
    loading: matLoading,
    refresh: refreshMat,
    updateMaterialSuppliers,
  } = useInventoryData();
  const { products, stats: prodStats, materials: rawMaterials, loading: prodLoading, createProduct, updateProduct, deleteProduct } = useProductsData();
  const { deliveries, stats: delStats, materials: delMaterials, suppliers, loading: delLoading, createDelivery, updateDelivery, confirmReceipt: confirmReceiptFn } = useDeliveries();

  const loading = activeTab === "Materials" ? matLoading : activeTab === "Products" ? prodLoading : delLoading;

  // ══════════════════════════════════════════════════════════════════════════════
  // MATERIALS HANDLERS
  // ══════════════════════════════════════════════════════════════════════════════
  const handleCreateMaterial = async () => {
    if (!newMaterial.name.trim() || !newMaterial.unit_of_measure.trim()) {
      toast.error("Item name and unit of measure are required");
      return;
    }
    if (selectedSupplierIds.length === 0) {
      toast.error("At least one supplier must be mapped on creation");
      return;
    }
    setCreating(true);
    try {
      await db.createInventoryItem(
        {
          name: newMaterial.name,
          unit_of_measure: newMaterial.unit_of_measure,
          current_quantity: 0,
          reorder_point: Number(newMaterial.reorder_point) || 0,
          unit_cost: Number(newMaterial.unit_cost) || 0,
          description: newMaterial.description || undefined,
          purchase_unit: newMaterial.purchase_unit || undefined,
          conversion_rate: Number(newMaterial.conversion_rate) || undefined,
        },
        selectedSupplierIds,
      );
      toast.success("Material created!");
      setShowCreateMaterialModal(false);
      setNewMaterial({
        name: "",
        unit_of_measure: "",
        current_quantity: "",
        reorder_point: "",
        unit_cost: "",
        description: "",
        purchase_unit: "",
        conversion_rate: "",
      });
      setSelectedSupplierIds([]);
      refreshMat();
    } catch (err: any) {
      if (err.code === "23505" || err.status === 409) {
        toast.error("A material with this name already exists (it might be phased out).");
      } else {
        toast.error(err.message || "Failed to create material");
      }
    }
    setCreating(false);
  };

  const handleSaveEdit = async (data: Partial<Material>, supplierIds?: string[]) => {
    if (!selectedMaterial) return;
    try {
      await db.updateInventoryItem(selectedMaterial.id, {
        name: data.itemType,
        unit_of_measure: data.stockUnit,
        current_quantity: data.usableStocks,
        reorder_point: data.reorderPoint,
        unit_cost: data.unitCost,
        description: data.description,
        purchase_unit: data.purchaseUnit,
        conversion_rate: data.purchaseQty,
      });

      if (supplierIds) {
        await updateMaterialSuppliers(selectedMaterial.id, supplierIds);
      }

      toast.success("Material updated!");
      setShowEditModal(false);
      refreshMat();
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  const handleDeleteMaterial = async () => {
    if (!selectedMaterial) return;
    try {
      await db.deleteInventoryItem(selectedMaterial.id);
      toast.success("Material deactivated");
      setShowDeleteModal(false);
      refreshMat();
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate");
    }
  };

  const handleManageSuppliers = (m: Material) => {
    setSelectedMaterial(m);
    setSelectedMaterialSuppliers(m.mappedSuppliers?.map((s) => s.id) || []);
    setShowManageSuppliersModal(true);
  };

  const handleSaveMaterialSuppliers = async () => {
    if (!selectedMaterial) return;
    setSavingSuppliers(true);
    const r = await updateMaterialSuppliers(
      selectedMaterial.id,
      selectedMaterialSuppliers,
    );
    if (r.success) {
      toast.success("Material suppliers updated");
      setShowManageSuppliersModal(false);
      refreshMat();
    } else {
      toast.error(r.error || "Failed to update suppliers");
    }
    setSavingSuppliers(false);
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // PRODUCTS HANDLERS
  // ══════════════════════════════════════════════════════════════════════════════
  const handleSaveProduct = async (
    product: { name: string; category?: string; variant?: string; size_spec?: string; material_cost: number; profit_fee: number; final_price: number; description?: string },
    bom: { inventory_item_id: string; quantity_required: number }[]
  ) => {
    if (selectedProduct) {
      const r = await updateProduct(selectedProduct.id, product, bom);
      if (r.success) { toast.success("Product updated!"); setShowProductEdit(false); }
      else toast.error(r.error || "Failed to update");
    } else {
      const r = await createProduct(product, bom);
      if (r.success) { toast.success("Product created!"); setShowCreateProduct(false); }
      else toast.error(r.error || "Failed to create");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const r = await deleteProduct(id);
    if (r.success) { toast.success("Product deactivated"); setShowProductDelete(false); }
    else toast.error(r.error || "Failed");
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // DELIVERIES HANDLERS
  // ══════════════════════════════════════════════════════════════════════════════
  const handleCreateDelivery = async () => {
    if (!newDelivery.inventory_item_id || !newDelivery.requested_quantity || !newDelivery.supplier_id || !newDelivery.expected_arrival_date) {
      toast.error("Material, quantity, supplier, and arrival date are required");
      return;
    }
    const r = await createDelivery({
      inventory_item_id: newDelivery.inventory_item_id,
      supplier_id: newDelivery.supplier_id,
      requested_quantity: Number(newDelivery.requested_quantity),
      expected_arrival_date: newDelivery.expected_arrival_date || undefined,
      notes: newDelivery.notes || undefined,
    });
    if (r.success) {
      toast.success("Restock request created!");
      setShowCreateDelivery(false);
      setNewDelivery({ inventory_item_id: "", supplier_id: "", requested_quantity: "", expected_arrival_date: "", notes: "" });
      setRestockSearch("");
      setRestockSupplierSearch("");
    }
    else toast.error(r.error || "Failed");
  };

  const handleConfirmReceipt = async () => {
    if (!selectedDelivery) return;
    if (!receipt.receipt_reference_number.trim()) { toast.error("Receipt / Reference number is required and cannot be empty."); return; }
    if (!receipt.received_quantity) { toast.error("Quantity is required."); return; }
    const r = await confirmReceiptFn(selectedDelivery.id, { received_quantity: Number(receipt.received_quantity), receipt_reference_number: receipt.receipt_reference_number });
    if (r.success) { toast.success("Delivery confirmed! Inventory updated."); setShowConfirmReceipt(false); setReceipt({ received_quantity: "", receipt_reference_number: "" }); refreshMat(); }
    else toast.error(r.error || "Failed");
  };

  const handleUpdateDeliveryStatus = async (id: string, status: string, additionalUpdates: Record<string, any> = {}) => {
    const r = await updateDelivery(id, { status, ...additionalUpdates });
    if (r.success) toast.success(`Status updated to ${status.replace("_", " ")}`);
    else toast.error(r.error || "Failed");
  };

  const handleEditDelivery = async () => {
    if (!selectedDelivery) return;
    const r = await updateDelivery(selectedDelivery.id, {
      requested_quantity: Number(editDeliveryForm.requested_quantity),
      expected_arrival_date: editDeliveryForm.expected_arrival_date,
      notes: editDeliveryForm.notes,
      supplier_id: editDeliveryForm.supplier_id
    });
    if (r.success) {
      toast.success("Delivery updated!");
      setShowEditDelivery(false);
    } else toast.error(r.error || "Failed");
  };

  const handleFaultySubmission = async () => {
    if (!selectedDelivery) return;
    if (!faultyReason.trim()) { toast.error("Please provide a reason for the faulty delivery."); return; }
    const updatedNotes = selectedDelivery.notes 
      ? `${selectedDelivery.notes} | Faulty Reason: ${faultyReason}`
      : `Faulty Reason: ${faultyReason}`;
    
    const r = await updateDelivery(selectedDelivery.id, { 
      status: "returned", 
      notes: updatedNotes 
    });
    if (r.success) {
      toast.success("Delivery marked as returned (faulty).");
      setShowFaultyModal(false);
      setFaultyReason("");
    } else toast.error(r.error || "Failed");
  };



  if (loading) return <LoadingSpinner type="table" message="Loading..." />;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Inventory" subtitle="Manage materials, products, and incoming deliveries" />

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setSearchQuery(""); }}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-150 ${activeTab === tab ? "bg-[#00BEF4] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MATERIALS TAB */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "Materials" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatusCard title="Total Materials" value={materialStats.total} icon={<Package size={18} />} iconColor="text-cyan-600" isCurrency={false} />
            <StatusCard title="Available" value={materialStats.available} icon={<CheckCircle size={18} />} iconColor="text-green-600" isCurrency={false} />
            <StatusCard title="Low Stock" value={materialStats.lowStock} icon={<AlertTriangle size={18} />} iconColor="text-yellow-600" isCurrency={false} />
            <StatusCard title="Restocking" value={materialStats.restocking} icon={<Package size={18} />} iconColor="text-blue-600" isCurrency={false} />
            <StatusCard title="Phased Out" value={materialStats.phasedOut} icon={<AlertTriangle size={18} />} iconColor="text-red-600" isCurrency={false} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search materials..." />
              <div className="relative">
                <select
                  value={materialStatusFilter}
                  onChange={(e) => setMaterialStatusFilter(e.target.value)}
                  className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none pr-10"
                >
                  <option value="All">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Restocking">Restocking</option>
                  <option value="Phased Out">Phased Out</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
              <Button variant="primary" icon={<Plus size={18} />} onClick={() => setShowCreateMaterialModal(true)}>Add New Material</Button>
            </div>
          </div>
          <MaterialsTable materials={materials} userRole="admin"
            onView={(m: Material) => { setSelectedMaterial(m); setShowViewModal(true); }}
            onEdit={(m: Material) => { setSelectedMaterial(m); setShowEditModal(true); }}
            onDelete={(m: Material) => { setSelectedMaterial(m); setShowDeleteModal(true); }}
            onManageSuppliers={handleManageSuppliers}
            searchQuery={searchQuery}
            statusFilter={materialStatusFilter} />
          {selectedMaterial && (
            <>
              <MaterialDetailsModal isOpen={showViewModal} material={selectedMaterial} userRole="admin" onClose={() => setShowViewModal(false)} />
              <EditMaterialModal isOpen={showEditModal} material={selectedMaterial} suppliers={suppliers} userRole="admin" onClose={() => setShowEditModal(false)} onSave={handleSaveEdit} />
              <DeleteMaterialModal isOpen={showDeleteModal} material={selectedMaterial} userRole="admin" onClose={() => setShowDeleteModal(false)} onDelete={handleDeleteMaterial} />
            </>
          )}
          {/* Create Material Modal */}
          <Modal show={showCreateMaterialModal} onClose={() => setShowCreateMaterialModal(false)} title="Add New Material">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Item Name *</label><input type="text" value={newMaterial.name} onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g., Tarpaulin Roll 6.1ft" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Stock Unit *</label><input type="text" value={newMaterial.unit_of_measure} onChange={e => setNewMaterial({ ...newMaterial, unit_of_measure: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g., feet, ml, pieces" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Purchase Unit</label><input type="text" value={newMaterial.purchase_unit} onChange={e => setNewMaterial({ ...newMaterial, purchase_unit: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g., rolls, bottles" /></div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Conversion Rate *</label>
                <input type="number" value={newMaterial.conversion_rate} onChange={e => setNewMaterial({ ...newMaterial, conversion_rate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="0" />
                <p className="text-[10px] text-gray-400 mt-1">Number of {newMaterial.unit_of_measure || 'units'} per {newMaterial.purchase_unit || 'purchase unit'}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reorder Point</label>
                <input type="number" value={newMaterial.reorder_point} onChange={e => setNewMaterial({ ...newMaterial, reorder_point: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="0" />
                <p className="text-[10px] text-gray-400 mt-1">Units based on Stock Unit</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Unit Cost (₱)</label>
                <input type="number" value={newMaterial.unit_cost} onChange={e => setNewMaterial({ ...newMaterial, unit_cost: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="0.00" step="0.01" />
                <p className="text-[10px] text-gray-400 mt-1">Cost per Stock Unit (for BOM calculations)</p>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Description</label><input type="text" value={newMaterial.description} onChange={e => setNewMaterial({ ...newMaterial, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Optional" /></div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Map Suppliers (At least one required) *</label>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-3 border rounded-xl bg-gray-50">
                {[...suppliers].sort((a: any, b: any) => getFlagPriority(a.flag_category) - getFlagPriority(b.flag_category)).map((s: any) => (
                  <label key={s.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedSupplierIds.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedSupplierIds([...selectedSupplierIds, s.id]);
                        else setSelectedSupplierIds(selectedSupplierIds.filter(id => id !== s.id));
                      }}
                      className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 flex-shrink-0"
                    />
                    <div className="text-sm text-gray-700 min-w-0 flex-1">{renderSupplierNameWithFlag(s)}</div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreateMaterialModal(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
              <button onClick={handleCreateMaterial} disabled={creating} className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl disabled:opacity-50">{creating ? "Creating..." : "Add Material"}</button>
            </div>
          </Modal>

          {/* Manage Material Suppliers Modal */}
          <Modal
            show={showManageSuppliersModal && !!selectedMaterial}
            onClose={() => setShowManageSuppliersModal(false)}
            title={`Manage Suppliers — ${selectedMaterial?.itemType || ""}`}
            width="max-w-xl">
            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-500">
                Select suppliers that provide this material.
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto p-3 border rounded-xl bg-gray-50">
                {[...suppliers].sort((a: any, b: any) => getFlagPriority(a.flag_category) - getFlagPriority(b.flag_category)).map((s: any) => (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${selectedMaterialSuppliers.includes(s.id) ? "bg-cyan-50 border-cyan-200" : "bg-white border-gray-200 hover:border-cyan-300"}`}>
                    <input
                      type="checkbox"
                      checked={selectedMaterialSuppliers.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMaterialSuppliers([
                            ...selectedMaterialSuppliers,
                            s.id,
                          ]);
                        } else {
                          setSelectedMaterialSuppliers(
                            selectedMaterialSuppliers.filter(
                              (id) => id !== s.id,
                            ),
                          );
                        }
                      }}
                      className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 mb-0.5">
                        {renderSupplierNameWithFlag(s)}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {s.email || "No email"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowManageSuppliersModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">
                Cancel
              </button>
              <button
                onClick={handleSaveMaterialSuppliers}
                disabled={savingSuppliers}
                className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                {savingSuppliers ? (
                  "Saving..."
                ) : (
                  <>
                    <Plus size={18} />
                    Save Suppliers
                  </>
                )}
              </button>
            </div>
          </Modal>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PRODUCTS TAB */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "Products" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatusCard title="Total Products" value={prodStats.total} icon={<Package size={18} />} iconColor="text-cyan-600" isCurrency={false} />
            <StatusCard title="Active" value={prodStats.active} icon={<CheckCircle size={18} />} iconColor="text-green-600" isCurrency={false} />
            <StatusCard title="Inactive" value={prodStats.inactive} icon={<AlertTriangle size={18} />} iconColor="text-red-600" isCurrency={false} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search products..." />
              <div className="relative">
                <select
                  value={productStatusFilter}
                  onChange={(e) => setProductStatusFilter(e.target.value)}
                  className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none pr-10"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
              <Button variant="primary" icon={<Plus size={18} />} onClick={() => { setSelectedProduct(null); setShowCreateProduct(true); }}>Add New Product</Button>
            </div>
          </div>
          <ProductsTable products={products} searchQuery={searchQuery} statusFilter={productStatusFilter}
            onView={p => { setSelectedProduct(p); setShowProductView(true); }}
            onEdit={p => { setSelectedProduct(p); setShowProductEdit(true); }}
            onDelete={p => { setSelectedProduct(p); setShowProductDelete(true); }} />
          <ProductDetailsModal isOpen={showProductView} product={selectedProduct} onClose={() => setShowProductView(false)} />
          <EditProductModal isOpen={showProductEdit || showCreateProduct} product={showCreateProduct ? null : selectedProduct} materials={rawMaterials}
            onClose={() => { setShowProductEdit(false); setShowCreateProduct(false); }} onSave={handleSaveProduct} />
          <DeleteProductModal isOpen={showProductDelete} product={selectedProduct} onClose={() => setShowProductDelete(false)} onDelete={handleDeleteProduct} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DELIVERIES TAB */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "Deliveries" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatusCard title="Total" value={delStats.total} icon={<Truck size={18} />} iconColor="text-cyan-600" isCurrency={false} />
            <StatusCard title="Requested" value={delStats.requested} icon={<Clock size={18} />} iconColor="text-yellow-600" isCurrency={false} />
            <StatusCard title="Ordered" value={delStats.ordered} icon={<Package size={18} />} iconColor="text-blue-600" isCurrency={false} />
            <StatusCard title="En Route" value={delStats.enRoute} icon={<Truck size={18} />} iconColor="text-purple-600" isCurrency={false} />
            <StatusCard title="Received" value={delStats.received} icon={<CheckCircle size={18} />} iconColor="text-green-600" isCurrency={false} />
            <StatusCard title="Completed" value={delStats.completed} icon={<CheckCircle size={18} />} iconColor="text-gray-500" isCurrency={false} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search deliveries..." />
              <Button variant="primary" icon={<Plus size={18} />} onClick={() => setShowCreateDelivery(true)}>Request Restock</Button>
            </div>
          </div>

          {/* Deliveries — mobile cards + desktop table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* MOBILE CARDS */}
            <div className="md:hidden divide-y divide-gray-100">
              {deliveries.filter(d => d.materialName.toLowerCase().includes(searchQuery.toLowerCase()) || d.supplierName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                <p className="px-4 py-8 text-center text-gray-400">No deliveries found</p>
              ) : deliveries.filter(d => d.materialName.toLowerCase().includes(searchQuery.toLowerCase()) || d.supplierName.toLowerCase().includes(searchQuery.toLowerCase())).map(d => (
                <div key={d.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900">{d.materialName}</p>
                      <p className="text-sm text-gray-500">{d.supplierName}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getDeliveryStatusColor(d.status)}`}>{d.status.replace("_", " ")}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div><span className="text-gray-400">Qty:</span> <span className="font-semibold">{d.requestedQuantity} {d.materialUnit}</span></div>
                    <div><span className="text-gray-400">Expected:</span> <span className="text-gray-700">{d.expectedArrivalDate || '—'}</span></div>
                    <div><span className="text-gray-400">By:</span> <span className="text-gray-700">{d.requestedByName}</span></div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
                    <div className="flex gap-2">
                      {/* Primary Action for mobile */}
                      {d.status === "requested" && (
                        <button onClick={() => handleUpdateDeliveryStatus(d.id, "ordered")} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold transition-colors">Mark Ordered</button>
                      )}
                      {d.status === "ordered" && (
                        <button onClick={() => handleUpdateDeliveryStatus(d.id, "en_route")} className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold transition-colors">Mark En Route</button>
                      )}
                      {d.status === "en_route" && (
                        <button onClick={() => { setSelectedDelivery(d); setReceipt({ received_quantity: String(d.requestedQuantity), receipt_reference_number: "" }); setShowConfirmReceipt(true); }}
                          className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-bold transition-colors">Confirm Receipt</button>
                      )}
                      {d.status === "received" && (
                        <button onClick={() => handleUpdateDeliveryStatus(d.id, "completed")} className="text-xs px-3 py-1.5 bg-gray-800 text-white rounded-lg font-bold transition-colors">Complete</button>
                      )}
                      {d.status === "completed" && <span className="text-xs text-gray-400 font-semibold px-2 py-1">Completed</span>}
                      {d.status === "cancelled" && <span className="text-xs text-gray-400 font-semibold px-2 py-1">Cancelled</span>}
                    </div>

                    {/* Secondary Actions for mobile */}
                    <div className="relative">
                      <button 
                        onClick={() => setOpenActionMenuId(openActionMenuId === d.id ? null : d.id)}
                        className={`p-2 rounded-lg border transition-all ${openActionMenuId === d.id ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-gray-200 text-gray-400'}`}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openActionMenuId === d.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenActionMenuId(null)}></div>
                          <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                            <button
                              onClick={() => { setSelectedDelivery(d); setShowViewDelivery(true); setOpenActionMenuId(null); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 active:bg-gray-50 flex items-center gap-2"
                            >View Details</button>
                            
                            {["requested", "ordered", "en_route"].includes(d.status) && (
                              <button
                                onClick={() => { 
                                  setSelectedDelivery(d); 
                                  setEditDeliveryForm({ 
                                    requested_quantity: String(d.requestedQuantity), 
                                    expected_arrival_date: d.expectedArrivalDate, 
                                    notes: d.notes,
                                    supplier_id: d.supplierId || ""
                                  }); 
                                  setShowEditDelivery(true);
                                  setOpenActionMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-cyan-600 active:bg-cyan-50 flex items-center gap-2"
                              >Edit Delivery</button>
                            )}

                            {d.status === "en_route" && (
                              <button 
                                onClick={() => { setSelectedDelivery(d); setFaultyReason(""); setShowFaultyModal(true); setOpenActionMenuId(null); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 active:bg-red-50 flex items-center gap-2"
                              >Return (Faulty)</button>
                            )}

                            {["requested", "ordered", "en_route"].includes(d.status) && (
                              <div className="border-t border-gray-100 my-1"></div>
                            )}

                            {["requested", "ordered", "en_route"].includes(d.status) && (
                              <button 
                                onClick={() => { setSelectedDelivery(d); setShowCancelDeliveryModal(true); setOpenActionMenuId(null); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-500 active:bg-red-50 active:text-red-600"
                              >Cancel Request</button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Material</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Supplier</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Qty Requested</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Expected</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Requested By</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deliveries.filter(d => d.materialName.toLowerCase().includes(searchQuery.toLowerCase()) || d.supplierName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No deliveries found</td></tr>
                    ) : deliveries.filter(d => d.materialName.toLowerCase().includes(searchQuery.toLowerCase()) || d.supplierName.toLowerCase().includes(searchQuery.toLowerCase())).map(d => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><p className="font-semibold text-gray-900">{d.materialName}</p><p className="text-xs text-gray-500">{d.materialUnit}</p></td>
                        <td className="px-4 py-3 text-gray-600">{d.supplierName}</td>
                        <td className="px-4 py-3 text-center font-semibold">{d.requestedQuantity}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{d.expectedArrivalDate || "—"}</td>
                        <td className="px-4 py-3 text-center"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${getDeliveryStatusColor(d.status)}`}>{d.status.replace("_", " ")}</span></td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{d.requestedByName}<br /><span className="text-gray-400">{d.createdAt}</span></td>
                        <td className="px-4 py-3 text-center relative">
                          <div className="flex items-center justify-center gap-2">
                            {/* Primary Actions based on status */}
                            {d.status === "requested" && (
                              <button onClick={() => handleUpdateDeliveryStatus(d.id, "ordered")} className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-bold whitespace-nowrap transition-colors">Mark Ordered</button>
                            )}
                            {d.status === "ordered" && (
                              <button onClick={() => handleUpdateDeliveryStatus(d.id, "en_route")} className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-bold whitespace-nowrap transition-colors">Mark En Route</button>
                            )}
                            {d.status === "en_route" && (
                              <button onClick={() => { setSelectedDelivery(d); setReceipt({ received_quantity: String(d.requestedQuantity), receipt_reference_number: "" }); setShowConfirmReceipt(true); }}
                                className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-bold whitespace-nowrap transition-colors">Confirm Receipt</button>
                            )}
                            {d.status === "received" && (
                              <button onClick={() => handleUpdateDeliveryStatus(d.id, "completed")} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold whitespace-nowrap transition-colors">Complete</button>
                            )}

                            {/* Secondary Actions Dropdown */}
                            <div className="relative">
                              <button 
                                onClick={() => setOpenActionMenuId(openActionMenuId === d.id ? null : d.id)}
                                className={`p-1.5 rounded-lg transition-colors ${openActionMenuId === d.id ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                              >
                                <MoreVertical size={18} />
                              </button>

                              {openActionMenuId === d.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenActionMenuId(null)}></div>
                                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-20 animate-in fade-in zoom-in duration-150">
                                    <button
                                      onClick={() => { setSelectedDelivery(d); setShowViewDelivery(true); setOpenActionMenuId(null); }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >View Details</button>
                                    
                                    {["requested", "ordered", "en_route"].includes(d.status) && (
                                      <button
                                        onClick={() => { 
                                          setSelectedDelivery(d); 
                                          setEditDeliveryForm({ 
                                            requested_quantity: String(d.requestedQuantity), 
                                            expected_arrival_date: d.expectedArrivalDate, 
                                            notes: d.notes,
                                            supplier_id: d.supplierId || ""
                                          }); 
                                          setShowEditDelivery(true);
                                          setOpenActionMenuId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-cyan-600 hover:bg-cyan-50 flex items-center gap-2"
                                      >Edit Delivery</button>
                                    )}

                                    {d.status === "en_route" && (
                                      <button 
                                        onClick={() => { setSelectedDelivery(d); setFaultyReason(""); setShowFaultyModal(true); setOpenActionMenuId(null); }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                      >Return (Faulty)</button>
                                    )}

                                    {["requested", "ordered", "en_route"].includes(d.status) && (
                                      <div className="border-t border-gray-100 my-1"></div>
                                    )}

                                    {["requested", "ordered", "en_route"].includes(d.status) && (
                                      <button 
                                        onClick={() => { setSelectedDelivery(d); setShowCancelDeliveryModal(true); setOpenActionMenuId(null); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                      >Cancel Request</button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>


          {/* Create Delivery Modal */}
          <Modal show={showCreateDelivery} onClose={() => { setShowCreateDelivery(false); setRestockSearch(""); setRestockSupplierSearch(""); }} title="Request Restock">
            <div className="space-y-6 mb-6">
              {/* Material Selection Section */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-gray-700">1. Select Material *</label>
                  {newDelivery.inventory_item_id && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Selected</span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Search material..."
                  value={restockSearch}
                  onChange={(e) => setRestockSearch(e.target.value)}
                  className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                />
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-100 shadow-sm">
                  {delMaterials
                    .filter(m => m.name.toLowerCase().includes(restockSearch.toLowerCase()))
                    .map((m: any) => (
                      <div
                        key={m.id}
                        onClick={() => { setNewDelivery({ ...newDelivery, inventory_item_id: m.id, supplier_id: "" }); setRestockSupplierSearch(""); }}
                        className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-cyan-50 transition-colors flex items-center justify-between ${newDelivery.inventory_item_id === m.id ? 'bg-cyan-50 text-cyan-800 font-bold' : 'text-gray-700'}`}
                      >
                        <span>{m.name} <span className="text-xs text-gray-400 font-normal">({m.unit_of_measure})</span></span>
                        {newDelivery.inventory_item_id === m.id && <CheckCircle size={14} className="text-cyan-600" />}
                      </div>
                    ))}
                  {delMaterials.filter(m => m.name.toLowerCase().includes(restockSearch.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-400 text-center italic">No materials found</div>
                  )}
                </div>
              </div>

              {/* Supplier Selection Section */}
              {newDelivery.inventory_item_id && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-gray-700">2. Select Supplier *</label>
                    {newDelivery.supplier_id && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Selected</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider font-semibold">Available Suppliers for {delMaterials.find(m => m.id === newDelivery.inventory_item_id)?.name}</p>
                  <input
                    type="text"
                    placeholder="Search supplier..."
                    value={restockSupplierSearch}
                    onChange={(e) => setRestockSupplierSearch(e.target.value)}
                    className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                  />
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-100 shadow-sm">
                    {[...(materials.find(m => m.id === newDelivery.inventory_item_id)?.mappedSuppliers || [])]
                      .sort((a: any, b: any) => getFlagPriority(a.flagCategory) - getFlagPriority(b.flagCategory))
                      .filter((s: any) => s.name.toLowerCase().includes(restockSupplierSearch.toLowerCase()))
                      .map((s: any) => {
                        const fullSupplier = suppliers.find(sup => sup.id === s.id) as any;
                        const hoverText = fullSupplier && (fullSupplier.flag_notes || fullSupplier.flag_category) 
                          ? `Flag: ${fullSupplier.flag_category || 'None'}\nNotes: ${fullSupplier.flag_notes || 'None'}`
                          : "No notes available";
                        return (
                        <div
                          key={s.id}
                          title={hoverText}
                          onClick={() => setNewDelivery({ ...newDelivery, supplier_id: s.id })}
                          className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-cyan-50 transition-colors flex items-center justify-between ${newDelivery.supplier_id === s.id ? 'bg-cyan-50 text-cyan-800 font-bold' : 'text-gray-700'}`}
                        >
                          <div className="flex-1 min-w-0 pr-2">{renderSupplierNameWithFlag(s, "name", "flagCategory")}</div>
                          {newDelivery.supplier_id === s.id && <CheckCircle size={14} className="text-cyan-600" />}
                        </div>
                        );
                      })}
                    {(materials.find(m => m.id === newDelivery.inventory_item_id)?.mappedSuppliers || [])
                      .filter((s: any) => s.name.toLowerCase().includes(restockSupplierSearch.toLowerCase())).length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center italic">
                          {materials.find(m => m.id === newDelivery.inventory_item_id)?.mappedSuppliers?.length === 0
                            ? "No suppliers mapped to this material"
                            : "No suppliers found matching search"}
                        </div>
                      )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Quantity *</label>
                  <input type="number" min="1" value={newDelivery.requested_quantity} onChange={e => setNewDelivery({ ...newDelivery, requested_quantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Amount in purchase units" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Expected Arrival *</label>
                  <input type="date" value={newDelivery.expected_arrival_date} onChange={e => setNewDelivery({ ...newDelivery, expected_arrival_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <textarea value={newDelivery.notes} onChange={e => setNewDelivery({ ...newDelivery, notes: e.target.value })} rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Optional notes" /></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreateDelivery(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
              <button onClick={handleCreateDelivery} className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl">Submit Request</button>
            </div>
          </Modal>

          {/* Edit Delivery Modal */}
          <Modal show={showEditDelivery} onClose={() => setShowEditDelivery(false)} title="Edit Delivery Details">
            {selectedDelivery && (
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm font-bold text-gray-900">{selectedDelivery.materialName}</p>
                  <p className="text-xs text-gray-500">Updating existing request</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Supplier</label>
                  <select 
                    value={editDeliveryForm.supplier_id} 
                    onChange={e => setEditDeliveryForm({ ...editDeliveryForm, supplier_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {(materials.find(m => m.id === selectedDelivery.inventoryItemId)?.mappedSuppliers || []).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    {!(materials.find(m => m.id === selectedDelivery.inventoryItemId)?.mappedSuppliers || []).some((s: any) => s.id === selectedDelivery.supplierId) && (
                      <option value={selectedDelivery.supplierId || ""}>{selectedDelivery.supplierName}</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
                    <input type="number" min="1" value={editDeliveryForm.requested_quantity} 
                      onChange={e => setEditDeliveryForm({ ...editDeliveryForm, requested_quantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Expected Arrival</label>
                    <input type="date" value={editDeliveryForm.expected_arrival_date} 
                      onChange={e => setEditDeliveryForm({ ...editDeliveryForm, expected_arrival_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                  <textarea value={editDeliveryForm.notes} 
                    onChange={e => setEditDeliveryForm({ ...editDeliveryForm, notes: e.target.value })} rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowEditDelivery(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200">Cancel</button>
                  <button onClick={handleEditDelivery} className="flex-1 px-4 py-3 bg-cyan-500 text-white font-semibold rounded-xl hover:bg-cyan-600">Save Changes</button>
                </div>
              </div>
            )}
          </Modal>

          {/* Confirm Receipt Modal */}
          <Modal show={showConfirmReceipt} onClose={() => setShowConfirmReceipt(false)} title="Confirm Delivery Receipt" width="max-w-md">
            {selectedDelivery && (
              <>
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="font-semibold text-gray-900">{selectedDelivery.materialName}</p>
                  <p className="text-xs text-gray-500">Requested: {selectedDelivery.requestedQuantity} {selectedDelivery.materialUnit} from {selectedDelivery.supplierName}</p>
                </div>
                <div className="space-y-4 mb-6">
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1">Received Quantity *</label>
                    <input type="number" min="0.01" step="0.01" value={receipt.received_quantity} onChange={e => setReceipt({ ...receipt, received_quantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1">Receipt / Reference Number *</label>
                    <input type="text" value={receipt.receipt_reference_number} onChange={e => setReceipt({ ...receipt, receipt_reference_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g., RCV-2026-001" /></div>
                </div>
                <p className="text-xs text-gray-400 mb-4">Confirming will automatically update the material's stock based on the received quantity × conversion rate.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirmReceipt(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
                  <button onClick={handleConfirmReceipt} className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl">Confirm Receipt</button>
                </div>
              </>
            )}
          </Modal>

          {/* Faulty Reason Modal */}
          <Modal show={showFaultyModal} onClose={() => setShowFaultyModal(false)} title="Mark as Faulty / Returned" width="max-w-md">
            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-600">Please provide a reason why this delivery is being returned or marked as faulty. This will be recorded in the delivery notes.</p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reason for Return *</label>
                <textarea 
                  value={faultyReason} 
                  onChange={e => setFaultyReason(e.target.value)} 
                  rows={4}
                  placeholder="Describe the issues found (e.g., damaged items, incorrect specification...)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowFaultyModal(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl">Cancel</button>
                <button onClick={handleFaultySubmission} className="flex-1 px-4 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600">Confirm Return</button>
              </div>
            </div>
          </Modal>

          {/* Cancel Delivery Modal */}
          <Modal show={showCancelDeliveryModal} onClose={() => setShowCancelDeliveryModal(false)} title="Cancel Resupply Request?" width="max-w-md">
            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-600">Are you sure you want to cancel this resupply request? This action cannot be undone.</p>
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                <p className="text-xs text-orange-800"><strong>Note:</strong> Cancellation is only possible before the items have been received.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelDeliveryModal(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl">No, Keep It</button>
                <button 
                  onClick={() => {
                    if (selectedDelivery) {
                      handleUpdateDeliveryStatus(selectedDelivery.id, "cancelled");
                      setShowCancelDeliveryModal(false);
                    }
                  }} 
                  className="flex-1 px-4 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-black"
                >Yes, Cancel Request</button>
              </div>
            </div>
          </Modal>

          {/* Delivery Details View Modal */}
          {selectedDelivery && (
            <DeliveryDetailsModal
              isOpen={showViewDelivery}
              onClose={() => setShowViewDelivery(false)}
              delivery={selectedDelivery}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminInventory;