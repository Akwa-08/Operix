import { useState } from "react";
import { Plus, Package, CheckCircle, AlertTriangle, X } from "lucide-react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { Button } from "../Shared/UI/Button";
import { MaterialsTable } from "../Shared/Inventory/MaterialsTable";
import { EditMaterialModal } from "../Shared/Inventory/EditMaterialModal";
import { MaterialDetailsModal } from "../Shared/Inventory/MaterialDetailsModal";
import { DeleteMaterialModal } from "../Shared/Inventory/DeleteMaterialModal";
import type { Material } from "../../Types";
import { useInventoryData } from "../../hooks/useInventoryData";
import apiClient from "../../services/apiClient";

const AdminInventory = () => {
  const [activeTab, setActiveTab] = useState("Materials");
  const [searchQuery, setSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showCreateMaterialModal, setShowCreateMaterialModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: "", unit_of_measure: "", current_quantity: "", reorder_point: "", unit_cost: "", description: "" });
  const [creating, setCreating] = useState(false);

  const tabs = ["Materials", "Products", "Deliveries"];
  const { materials, stats: materialStats, loading, refresh } = useInventoryData();

  const handleViewMaterial = (material: Material) => { setSelectedMaterial(material); setShowViewModal(true); };
  const handleEditMaterial = (material: Material) => { setSelectedMaterial(material); setShowEditModal(true); };
  const handleDeleteMaterial = (material: Material) => { setSelectedMaterial(material); setShowDeleteModal(true); };
  const handleSaveEdit = (data: Partial<Material>) => { console.log("Saving material:", data); setShowEditModal(false); };

  const handleCreateMaterial = async () => {
    if (!newMaterial.name.trim() || !newMaterial.unit_of_measure.trim()) {
      alert("Item name and unit of measure are required");
      return;
    }
    setCreating(true);
    const res = await apiClient.post("/api/inventory/inventory-items", {
      name: newMaterial.name,
      unit_of_measure: newMaterial.unit_of_measure,
      current_quantity: Number(newMaterial.current_quantity) || 0,
      reorder_point: Number(newMaterial.reorder_point) || 0,
      unit_cost: Number(newMaterial.unit_cost) || 0,
      description: newMaterial.description || null,
    });
    setCreating(false);
    if (res.success) {
      alert("Material created successfully!");
      setShowCreateMaterialModal(false);
      setNewMaterial({ name: "", unit_of_measure: "", current_quantity: "", reorder_point: "", unit_cost: "", description: "" });
      refresh();
    } else {
      alert("Error: " + res.error);
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">Manage materials, products, and incoming deliveries</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-150 ${activeTab === tab ? "bg-[#00BEF4] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Materials" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatusCard title="Total Materials" value={materialStats.total} icon={<Package size={18} />} iconColor="text-cyan-600" />
            <StatusCard title="Available" value={materialStats.available} icon={<CheckCircle size={18} />} iconColor="text-green-600" />
            <StatusCard title="Low Stock" value={materialStats.lowStock} icon={<AlertTriangle size={18} />} iconColor="text-yellow-600" />
            <StatusCard title="Restocking" value={materialStats.restocking} icon={<Package size={18} />} iconColor="text-blue-600" />
            <StatusCard title="Phased Out" value={materialStats.phasedOut} icon={<AlertTriangle size={18} />} iconColor="text-red-600" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search materials..." />
              <Button variant="primary" icon={<Plus size={18} />} onClick={() => setShowCreateMaterialModal(true)}>Add New Material</Button>
            </div>
          </div>

          <MaterialsTable materials={materials} userRole="admin" onView={handleViewMaterial} onEdit={handleEditMaterial} onDelete={handleDeleteMaterial} searchQuery={searchQuery} />

          {selectedMaterial && (
            <>
              <MaterialDetailsModal isOpen={showViewModal} material={selectedMaterial} userRole="admin" onClose={() => setShowViewModal(false)} />
              <EditMaterialModal isOpen={showEditModal} material={selectedMaterial} userRole="admin" onClose={() => setShowEditModal(false)} onSave={handleSaveEdit} />
              <DeleteMaterialModal isOpen={showDeleteModal} material={selectedMaterial} userRole="admin" onClose={() => setShowDeleteModal(false)} onDelete={() => { console.log("Delete:", selectedMaterial.id); setShowDeleteModal(false); }} />
            </>
          )}

          {showCreateMaterialModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateMaterialModal(false)}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowCreateMaterialModal(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-600" /></button>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Add New Material</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1">Item Name *</label>
                    <input type="text" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g., Tarpaulin Roll 6.1ft" /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1">Unit of Measure *</label>
                    <input type="text" value={newMaterial.unit_of_measure} onChange={e => setNewMaterial({...newMaterial, unit_of_measure: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g., feet, ml, pieces" /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1">Current Quantity</label>
                    <input type="number" value={newMaterial.current_quantity} onChange={e => setNewMaterial({...newMaterial, current_quantity: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="0" /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1">Reorder Point</label>
                    <input type="number" value={newMaterial.reorder_point} onChange={e => setNewMaterial({...newMaterial, reorder_point: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="0" /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1">Unit Cost (₱)</label>
                    <input type="number" value={newMaterial.unit_cost} onChange={e => setNewMaterial({...newMaterial, unit_cost: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="0.00" step="0.01" /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                    <input type="text" value={newMaterial.description} onChange={e => setNewMaterial({...newMaterial, description: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Optional description" /></div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowCreateMaterialModal(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
                  <button onClick={handleCreateMaterial} disabled={creating} className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl disabled:opacity-50">{creating ? "Creating..." : "Add Material"}</button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setActiveTab("Deliveries")}>Ongoing Deliveries</Button>
          </div>
        </div>
      )}

      {activeTab === "Products" && (<div className="space-y-6"><p className="text-gray-500">Products section coming soon...</p></div>)}
      {activeTab === "Deliveries" && (<div className="space-y-6"><p className="text-gray-500">Deliveries section coming soon...</p></div>)}
    </div>
  );
};

export default AdminInventory;