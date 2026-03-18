import { useState } from "react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { MaterialsTable } from "../Shared/Inventory/MaterialsTable";
import { MaterialDetailsModal } from "../Shared/Inventory/MaterialDetailsModal";
import { EditMaterialModal } from "../Shared/Inventory/EditMaterialModal";
import { Package, CheckCircle, AlertTriangle } from "lucide-react";
import type { Material } from "../../Types";
import { useInventoryData } from "../../hooks/useInventoryData";

const CashierInventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const { materials, stats: materialStats, loading } = useInventoryData();

  const handleViewMaterial = (material: Material) => { setSelectedMaterial(material); setShowViewModal(true); };
  const handleEditMaterial = (material: Material) => { setSelectedMaterial(material); setShowEditModal(true); };
  const handleSaveEdit = (data: Partial<Material>) => { console.log("Cashier updating stock:", data); setShowEditModal(false); };

  if (loading) return <div className="max-w-7xl mx-auto flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">View materials and update stock levels</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatusCard title="Total Materials" value={materialStats.total} icon={<Package size={18} />} iconColor="text-cyan-600" />
        <StatusCard title="Available" value={materialStats.available} icon={<CheckCircle size={18} />} iconColor="text-green-600" />
        <StatusCard title="Low Stock" value={materialStats.lowStock} icon={<AlertTriangle size={18} />} iconColor="text-yellow-600" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search materials..." />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900 font-medium">ℹ️ <strong>Note:</strong> You can view all materials and update stock quantities. Contact admin for supplier or pricing changes.</p>
      </div>

      <MaterialsTable materials={materials} userRole="cashier" onView={handleViewMaterial} onEdit={handleEditMaterial} searchQuery={searchQuery} />

      {selectedMaterial && (
        <>
          <MaterialDetailsModal isOpen={showViewModal} material={selectedMaterial} userRole="cashier" onClose={() => setShowViewModal(false)} />
          <EditMaterialModal isOpen={showEditModal} material={selectedMaterial} userRole="cashier" onClose={() => setShowEditModal(false)} onSave={handleSaveEdit} />
        </>
      )}
    </div>
  );
};

export default CashierInventory;