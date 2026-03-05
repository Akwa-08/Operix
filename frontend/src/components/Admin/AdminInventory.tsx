import { useState } from "react";
import { Plus, Package, CheckCircle, AlertTriangle } from "lucide-react";

import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { Button } from "../Shared/UI/Button";

import { MaterialsTable } from "../Shared/Inventory/MaterialsTable";
import { EditMaterialModal } from "../Shared/Inventory/EditMaterialModal";
import { MaterialDetailsModal } from "../Shared/Inventory/MaterialDetailsModal";
import { DeleteMaterialModal } from "../Shared/Inventory/DeleteMaterialModal";

import type { Material } from "../../Types";

const AdminInventory = () => {
  const [activeTab, setActiveTab] = useState("Materials");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const tabs = ["Materials", "Products", "Deliveries"];

  // Dummy data (replace with API later)
  const materials: Material[] = [
    {
      id: "M001",
      itemType: "Tarpaulin",
      itemVariant: "6.1 ft x 164 ft",
      usableStocks: 546,
      stockUnit: "Feet",
      purchaseQty: 5,
      purchaseUnit: "Roll",
      supplier: "ABC Co.",
      status: "Available",
    },
    {
      id: "M002",
      itemType: "Tarpaulin",
      itemVariant: "8.2 ft x 164 ft",
      usableStocks: 642,
      stockUnit: "Feet",
      purchaseQty: 6,
      purchaseUnit: "Roll",
      supplier: "ABC Co.",
      status: "Available",
    },
  ];

  // Stats
  const materialStats = {
    total: materials.length,
    available: materials.filter(m => m.status === "Available").length,
    lowStock: materials.filter(m => m.status === "Low Stock").length,
    restocking: materials.filter(m => m.status === "Restocking").length,
    phasedOut: materials.filter(m => m.status === "Phased Out").length,
  };

  // Handlers
  const handleViewMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setShowViewModal(true);
  };

  const handleEditMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setShowEditModal(true);
  };

  const handleDeleteMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setShowDeleteModal(true);
  };

  const handleSaveEdit = (data: Partial<Material>) => {
    console.log("Saving material:", data);
    setShowEditModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage materials, products, and incoming deliveries
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-150 ${
              activeTab === tab
                ? "bg-[#00BEF4] text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* MATERIALS TAB */}
      {activeTab === "Materials" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
            <StatusCard
              title="Restocking"
              value={materialStats.restocking}
              icon={<Package size={18} />}
              iconColor="text-blue-600"
            />
            <StatusCard
              title="Phased Out"
              value={materialStats.phasedOut}
              icon={<AlertTriangle size={18} />}
              iconColor="text-red-600"
            />
          </div>

          {/* Search + Add */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search materials..."
              />

              <Button variant="primary" icon={<Plus size={18} />}>
                Add New Material
              </Button>
            </div>
          </div>

          {/* Table */}
          <MaterialsTable
            materials={materials}
            userRole="admin"
            onView={handleViewMaterial}
            onEdit={handleEditMaterial}
            onDelete={handleDeleteMaterial}
            searchQuery={searchQuery}
          />

          {/* Modals */}
          {selectedMaterial && (
            <>
              <MaterialDetailsModal
                isOpen={showViewModal}
                material={selectedMaterial}
                userRole="admin"
                onClose={() => setShowViewModal(false)}
              />

              <EditMaterialModal
                isOpen={showEditModal}
                material={selectedMaterial}
                userRole="admin"
                onClose={() => setShowEditModal(false)}
                onSave={handleSaveEdit}
              />

              <DeleteMaterialModal
                isOpen={showDeleteModal}
                material={selectedMaterial}
                userRole="admin"
                onClose={() => setShowDeleteModal(false)}
                onDelete={() => {
                  console.log("Delete material:", selectedMaterial.id);
                  setShowDeleteModal(false);
                }}
              />
            </>
          )}

          {/* Deliveries Shortcut */}
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={() => setActiveTab("Deliveries")}
            >
              Ongoing Deliveries
            </Button>
          </div>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === "Products" && (
        <div className="space-y-6">
          <p className="text-gray-500">
            Products section coming soon...
          </p>
        </div>
      )}

      {/* DELIVERIES TAB */}
      {activeTab === "Deliveries" && (
        <div className="space-y-6">
          <p className="text-gray-500">
            Deliveries section coming soon...
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
