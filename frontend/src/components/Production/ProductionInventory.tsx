import { useState } from "react";
import { Plus } from "lucide-react";
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
import { useInventoryData } from "../../hooks/useSupabase";

const ProductionInventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const { materials, stats: materialStats, loading, updateMaterial } = useInventoryData();
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
  const handleCreateResupply = () => { toast.success("Resupply request feature coming soon!"); };

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
          <Button variant="primary" icon={<Plus size={18} />} onClick={handleCreateResupply}>Create Resupply Request</Button>
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
    </div>
  );
};

export default ProductionInventory;