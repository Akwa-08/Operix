import { useState } from "react";
import { Plus, X } from "lucide-react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { Button } from "../Shared/UI/Button";
import { LoadingSpinner } from "../Shared/UI/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { PageHeader } from "../Shared/UI/PageHeader";
import { InfoBanner } from "../Shared/UI/InfoBanner";
import { MaterialsTable } from "../Shared/Inventory/MaterialsTable";
import { MaterialDetailsModal } from "../Shared/Inventory/MaterialDetailsModal";
import { EditMaterialModal } from "../Shared/Inventory/EditMaterialModal";
import { Package, CheckCircle, AlertTriangle, Star, Flag, Info } from "lucide-react";
import type { Material } from "../../Types";
import { useInventoryData, useDeliveries } from "../../hooks/useSupabase";

// ── Reusable inline modal shell (mirrors AdminInventory pattern) ──────────────
const Modal = ({ show, onClose, title, children }: { show: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-600" /></button>
        <h3 className="text-2xl font-bold text-gray-900 mb-6">{title}</h3>
        {children}
      </div>
    </div>
  );
};

const renderSupplierNameWithFlag = (s: any, nameKey: string = "name", categoryKey: string = "flag_category") => {
  const category = s[categoryKey] || s.flagCategory;
  const name = s[nameKey];
  const notes = s.flag_notes || s.flagNotes;
  return (
    <span className="flex items-center gap-1.5">
      {category === "Preferred" && <Star size={14} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />}
      {category === "Warning" && <AlertTriangle size={14} className="text-orange-500 flex-shrink-0" />}
      {category === "Critical" && <Flag size={14} className="text-red-500 fill-red-500 flex-shrink-0" />}
      <span className={category === "Critical" ? "text-red-600 font-semibold" : category === "Warning" ? "text-orange-600 font-medium" : ""}>{name}</span>
      {notes && (
        <button 
          type="button" 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); alert(`Supplier Note for ${name}:\n${notes}`); }} 
          className="text-gray-400 hover:text-cyan-600 focus:outline-none flex-shrink-0 ml-1" 
          title="View Note"
        >
          <Info size={14} />
        </button>
      )}
    </span>
  );
};

const ProductionInventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Resupply state
  const [showCreateDelivery, setShowCreateDelivery] = useState(false);
  const [newDelivery, setNewDelivery] = useState({
    inventory_item_id: "",
    requested_by: "",
    requested_quantity: "",
    expected_arrival_date: "",
    notes: "",
    supplier_id: "",
  });
  const [resupplySearch, setResupplySearch] = useState("");
  const [resupplySupplierSearch, setResupplySupplierSearch] = useState("");
  const [resupplyStaffSearch, setResupplyStaffSearch] = useState("");

  const { materials, stats: materialStats, loading, updateMaterial } = useInventoryData();
  const { materials: delMaterials, suppliers, employees, createDelivery } = useDeliveries();
  const toast = useToast();

  const handleViewMaterial = (material: Material) => { setSelectedMaterial(material); setShowViewModal(true); };
  const handleEditMaterial = (material: Material) => { setSelectedMaterial(material); setShowEditModal(true); };

  const handleSaveEdit = async (data: Partial<Material>) => {
    if (!selectedMaterial) return;
    const r = await updateMaterial(selectedMaterial.id, {
      current_quantity: data.usableStocks,
    });
    if (r.success) {
      toast.success("Stock level updated");
      setShowEditModal(false);
    } else {
      toast.error("Update failed: " + r.error);
    }
  };

  const handleCreateResupply = async () => {
    if (!newDelivery.inventory_item_id || !newDelivery.requested_quantity || !newDelivery.supplier_id || !newDelivery.requested_by || !newDelivery.expected_arrival_date) {
      toast.error("Requester, material, quantity, supplier, and arrival date are required");
      return;
    }
    const r = await createDelivery({
      inventory_item_id: newDelivery.inventory_item_id,
      supplier_id: newDelivery.supplier_id,
      requested_quantity: Number(newDelivery.requested_quantity),
      expected_arrival_date: newDelivery.expected_arrival_date || undefined,
      notes: newDelivery.notes || undefined,
      requested_by: newDelivery.requested_by,
    });
    if (r.success) {
      toast.success("Resupply request submitted!");
      setShowCreateDelivery(false);
      setNewDelivery({ inventory_item_id: "", requested_quantity: "", expected_arrival_date: "", notes: "", supplier_id: "", requested_by: "" });
      setResupplySearch("");
      setResupplySupplierSearch("");
      setResupplyStaffSearch("");
    } else {
      toast.error("Failed: " + r.error);
    }
  };

  if (loading) return <LoadingSpinner type="table" />;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Inventory" subtitle="View materials and create resupply requests" />

      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <StatusCard title="Total Materials" value={materialStats.total} icon={<Package size={18} />} iconColor="text-cyan-600" isCurrency={false} />
        <StatusCard title="Available" value={materialStats.available} icon={<CheckCircle size={18} />} iconColor="text-green-600" isCurrency={false} />
        <StatusCard title="Low Stock" value={materialStats.lowStock} icon={<AlertTriangle size={18} />} iconColor="text-yellow-600" isCurrency={false} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search materials..." />
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => setShowCreateDelivery(true)}>
            Create Resupply Request
          </Button>
        </div>
      </div>

      <InfoBanner color="orange">
        📦 <strong>Note:</strong> You can view materials, update stock levels, and create resupply requests for low-stock items.
      </InfoBanner>

      <MaterialsTable materials={materials} userRole="production" onView={handleViewMaterial} onEdit={handleEditMaterial} searchQuery={searchQuery} />

      {selectedMaterial && (
        <>
          <MaterialDetailsModal isOpen={showViewModal} material={selectedMaterial} userRole="production" onClose={() => setShowViewModal(false)} />
          <EditMaterialModal isOpen={showEditModal} material={selectedMaterial} suppliers={suppliers} userRole="production" onClose={() => setShowEditModal(false)} onSave={handleSaveEdit} />
        </>
      )}

      {/* Create Resupply Request Modal */}
      <Modal show={showCreateDelivery} onClose={() => { setShowCreateDelivery(false); setResupplySearch(""); setResupplySupplierSearch(""); setResupplyStaffSearch(""); }} title="Create Resupply Request">
        <div className="space-y-6 mb-6">
          {/* Staff Selection Section */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-700">1. Select Requester *</label>
              {newDelivery.requested_by && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Selected</span>
              )}
            </div>
            <input
              type="text"
              placeholder="Search production staff..."
              value={resupplyStaffSearch}
              onChange={(e) => setResupplyStaffSearch(e.target.value)}
              className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            />
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-100 shadow-sm">
              {employees
                .filter(e =>
                  (e.fullName || "").toLowerCase().includes(resupplyStaffSearch.toLowerCase()) &&
                  (e.role?.toLowerCase() === 'production' || e.position?.toLowerCase().includes('production'))
                )
                .map((e: any) => (
                  <div
                    key={e.id}
                    onClick={() => setNewDelivery({ ...newDelivery, requested_by: e.id })}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-cyan-50 transition-colors flex items-center justify-between ${newDelivery.requested_by === e.id ? 'bg-cyan-50 text-cyan-800 font-bold' : 'text-gray-700'}`}
                  >
                    <span>{e.fullName}</span>
                    {newDelivery.requested_by === e.id && <CheckCircle size={14} className="text-cyan-600" />}
                  </div>
                ))}
              {employees.filter(e =>
                (e.fullName || "").toLowerCase().includes(resupplyStaffSearch.toLowerCase()) &&
                (e.role?.toLowerCase() === 'production' || e.position?.toLowerCase().includes('production'))
              ).length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-400 text-center italic">No production staff found</div>
                )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-700">2. Select Material *</label>
              {newDelivery.inventory_item_id && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Selected</span>
              )}
            </div>
            <input
              type="text"
              placeholder="Search material..."
              value={resupplySearch}
              onChange={(e) => setResupplySearch(e.target.value)}
              className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            />
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-100 shadow-sm">
              {delMaterials
                .filter((m: any) => m.name.toLowerCase().includes(resupplySearch.toLowerCase()))
                .map((m: any) => (
                  <div
                    key={m.id}
                    onClick={() => setNewDelivery({ ...newDelivery, inventory_item_id: m.id })}
                    className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-cyan-50 transition-colors flex items-center justify-between ${newDelivery.inventory_item_id === m.id ? 'bg-cyan-50 text-cyan-800 font-bold' : 'text-gray-700'}`}
                  >
                    <span>{m.name} <span className="text-xs text-gray-400 font-normal">({m.unit_of_measure})</span></span>
                    {newDelivery.inventory_item_id === m.id && <CheckCircle size={14} className="text-cyan-600" />}
                  </div>
                ))}
              {delMaterials.filter((m: any) => m.name.toLowerCase().includes(resupplySearch.toLowerCase())).length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-400 text-center italic">No materials found</div>
              )}
            </div>
          </div>

          {/* Supplier Selection Section */}
          {newDelivery.inventory_item_id && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-700">3. Select Supplier *</label>
                {newDelivery.supplier_id && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Selected</span>
                )}
              </div>
              <input
                type="text"
                placeholder="Search supplier..."
                value={resupplySupplierSearch}
                onChange={(e) => setResupplySupplierSearch(e.target.value)}
                className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
              />
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-100 shadow-sm">
                {(materials.find(m => m.id === newDelivery.inventory_item_id)?.mappedSuppliers || [])
                  .filter((s: any) => s.name.toLowerCase().includes(resupplySupplierSearch.toLowerCase()))
                  .map((s: any) => {
                    const fullSupplier = suppliers.find(sup => sup.id === s.id) as any;
                    const supplierWithNotes = { ...s, flag_notes: fullSupplier?.flag_notes, flagNotes: fullSupplier?.flag_notes };
                    return (
                    <div
                      key={s.id}
                      onClick={() => setNewDelivery({ ...newDelivery, supplier_id: s.id })}
                      className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-cyan-50 transition-colors flex items-center justify-between ${newDelivery.supplier_id === s.id ? 'bg-cyan-50 text-cyan-800 font-bold' : 'text-gray-700'}`}
                    >
                      <div className="flex-1 min-w-0 pr-2">{renderSupplierNameWithFlag(supplierWithNotes, "name", "flagCategory")}</div>
                      {newDelivery.supplier_id === s.id && <CheckCircle size={14} className="text-cyan-600" />}
                    </div>
                  )})}
                {(materials.find(m => m.id === newDelivery.inventory_item_id)?.mappedSuppliers || [])
                  .filter((s: any) => s.name.toLowerCase().includes(resupplySupplierSearch.toLowerCase())).length === 0 && (
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                value={newDelivery.requested_quantity}
                onChange={e => setNewDelivery({ ...newDelivery, requested_quantity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Amount in purchase units"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Expected Arrival *</label>
              <input
                type="date"
                value={newDelivery.expected_arrival_date}
                onChange={e => setNewDelivery({ ...newDelivery, expected_arrival_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
            <textarea
              value={newDelivery.notes}
              onChange={e => setNewDelivery({ ...newDelivery, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Optional notes (e.g. reason for request)"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreateDelivery(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          <button onClick={handleCreateResupply} className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl">Submit Request</button>
        </div>
      </Modal>
    </div>
  );
};

export default ProductionInventory;