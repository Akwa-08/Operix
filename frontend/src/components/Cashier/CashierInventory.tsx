import { useState } from "react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { MaterialsTable } from "../Shared/Inventory/MaterialsTable";
import { MaterialDetailsModal } from "../Shared/Inventory/MaterialDetailsModal";
import { EditMaterialModal } from "../Shared/Inventory/EditMaterialModal";
import { Package, CheckCircle, AlertTriangle } from "lucide-react";
import type { Material } from "../../Types";

const CashierInventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // DUMMY DATA - Replace with API
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
      itemType: "Tarpaulin",
      itemVariant: "8.2 ft x 164 ft",
      usableStocks: 42,
      stockUnit: "Feet",
      purchaseQty: 6,
      purchaseUnit: "Roll",
      supplier: "ABC co.",
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
    console.log("Cashier updating stock:", data);
    // TODO: API call to update material stock
    setShowEditModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">
          View materials and update stock levels
        </p>
      </div>

      {/* Summary Cards - Cashier sees limited info */}
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

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search materials..."
        />
      </div>

      {/* Info Note for Cashier */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900 font-medium">
          ℹ️ <strong>Note:</strong> You can view all materials and update stock
          quantities. Contact admin for supplier or pricing changes.
        </p>
      </div>

      {/* Materials Table - Cashier sees LIMITED columns */}
      <MaterialsTable
        materials={materials}
        userRole="cashier" // 👈 CASHIER ROLE - Automatic permission filtering!
        onView={handleViewMaterial}
        onEdit={handleEditMaterial}
        searchQuery={searchQuery}
      />

      {/* View Modal - Cashier sees LIMITED info */}
      {selectedMaterial && (
        <MaterialDetailsModal
          isOpen={showViewModal}
          material={selectedMaterial}
          userRole="cashier" // 👈 Shows limited information
          onClose={() => setShowViewModal(false)}
        />
      )}

      {/* Edit Modal - Cashier can ONLY edit stock */}
      {selectedMaterial && (
        <EditMaterialModal
          isOpen={showEditModal}
          material={selectedMaterial}
          userRole="cashier" // 👈 Shows ONLY stock field, rest is read-only
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default CashierInventory;
