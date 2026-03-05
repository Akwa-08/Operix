import { useState } from "react";
import { Plus } from "lucide-react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { Button } from "../Shared/UI/Button";
import { MaterialsTable } from "../Shared/Inventory/MaterialsTable";
import { MaterialDetailsModal } from "../Shared/Inventory/MaterialDetailsModal";
import { EditMaterialModal } from "../Shared/Inventory/EditMaterialModal";
import { Package, CheckCircle, AlertTriangle } from "lucide-react";
import type { Material } from "../../Types";

const ProductionInventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const materials: Material[] = [
    {
      id: "M001",
      itemType: "Tarpaulin",
      itemVariant: "6.1 ft x 164 ft",
      usableStocks: 546,
      stockUnit: "Feet",
      purchaseQty: 5,
      purchaseUnit: "Roll",
      supplier: "ABC co.",
      status: "Available",
    },
    {
      id: "M002",
      itemType: "Ink",
      itemVariant: "Cyan",
      usableStocks: 15,
      stockUnit: "Liters",
      purchaseQty: 1,
      purchaseUnit: "Bottle",
      supplier: "XYZ Supplies",
      status: "Low Stock",
    },
  ];

  const materialStats = {
    total: materials.length,
    available: materials.filter((m) => m.status === "Available").length,
    lowStock: materials.filter((m) => m.status === "Low Stock").length,
  };

  const handleViewMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setShowViewModal(true);
  };

  const handleEditMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setShowEditModal(true);
  };

  const handleSaveEdit = (data: Partial<Material>) => {
    console.log("Production updating stock:", data);
    setShowEditModal(false);
  };

  const handleCreateResupply = () => {
    alert("Create resupply request - to be implemented");
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">
          View materials and create resupply requests
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatusCard
          title="Total Materials"
          value={materialStats.total}
          icon={<Package size={18} />}
          iconColor="text-cyan-600"
        />
        <StatusCard
          title="Available"
          value={materialStats.available}
          icon={<CheckCircle size={18} />}
          iconColor="text-green-600"
        />
        <StatusCard
          title="Low Stock"
          value={materialStats.lowStock}
          icon={<AlertTriangle size={18} />}
          iconColor="text-yellow-600"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search materials..."
          />
          <Button
            variant="primary"
            icon={<Plus size={18} />}
            onClick={handleCreateResupply}
          >
            Create Resupply Request
          </Button>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-orange-900 font-medium">
          📦 <strong>Note:</strong> You can view materials, update stock levels,
          and create resupply requests for low-stock items.
        </p>
      </div>

      <MaterialsTable
        materials={materials}
        userRole="production"
        onView={handleViewMaterial}
        onEdit={handleEditMaterial}
        searchQuery={searchQuery}
      />

      {selectedMaterial && (
        <>
          <MaterialDetailsModal
            isOpen={showViewModal}
            material={selectedMaterial}
            userRole="production"
            onClose={() => setShowViewModal(false)}
          />
          <EditMaterialModal
            isOpen={showEditModal}
            material={selectedMaterial}
            userRole="production"
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveEdit}
          />
        </>
      )}
    </div>
  );
};

export default ProductionInventory;
