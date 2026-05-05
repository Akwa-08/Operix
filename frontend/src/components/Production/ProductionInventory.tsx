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
import { Package, CheckCircle, AlertTriangle } from "lucide-react";
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

const ProductionInventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Resupply state
  const [showCreateDelivery, setShowCreateDelivery] = useState(false);
  const [newDelivery, setNewDelivery] = useState({
    inventory_item_id: "",
    requested_quantity: "",
    expected_arrival_date: "",
    notes: "",
  });

  const { materials, stats: materialStats, loading, updateMaterial } = useInventoryData();
  const { materials: delMaterials, createDelivery } = useDeliveries();
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
    if (!newDelivery.inventory_item_id || !newDelivery.requested_quantity) {
      toast.error("Material and quantity are required");
      return;
    }
    const r = await createDelivery({
      inventory_item_id: newDelivery.inventory_item_id,
      requested_quantity: Number(newDelivery.requested_quantity),
      expected_arrival_date: newDelivery.expected_arrival_date || undefined,
      notes: newDelivery.notes || undefined,
    });
    if (r.success) {
      toast.success("Resupply request submitted!");
      setShowCreateDelivery(false);
      setNewDelivery({ inventory_item_id: "", requested_quantity: "", expected_arrival_date: "", notes: "" });
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
          <EditMaterialModal isOpen={showEditModal} material={selectedMaterial} userRole="production" onClose={() => setShowEditModal(false)} onSave={handleSaveEdit} />
        </>
      )}

      {/* Create Resupply Request Modal */}
      <Modal show={showCreateDelivery} onClose={() => setShowCreateDelivery(false)} title="Create Resupply Request">
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Material *</label>
            <select
              value={newDelivery.inventory_item_id}
              onChange={e => setNewDelivery({ ...newDelivery, inventory_item_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
              <option value="">Select material...</option>
              {delMaterials.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name} ({m.unit_of_measure})</option>
              ))}
            </select>
          </div>
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
              <label className="block text-sm font-semibold text-gray-700 mb-1">Expected Arrival</label>
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