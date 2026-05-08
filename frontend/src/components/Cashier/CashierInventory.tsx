import { useState } from "react";
import { SearchBar } from "../Shared/UI/SearchBar";
import { StatusCard } from "../Shared/UI/StatusCard";
import { LoadingSpinner } from "../Shared/UI/LoadingSpinner";
import { PageHeader } from "../Shared/UI/PageHeader";
import { InfoBanner } from "../Shared/UI/InfoBanner";
import { getDeliveryStatusColor } from "../../util/formatters";
import { MaterialsTable } from "../Shared/Inventory/MaterialsTable";
import { MaterialDetailsModal } from "../Shared/Inventory/MaterialDetailsModal";
import { EditMaterialModal } from "../Shared/Inventory/EditMaterialModal";
import { DeliveryDetailsModal } from "../Shared/Inventory/DeliveryDetailsModal";
import { Package, CheckCircle, AlertTriangle, Truck } from "lucide-react";
import type { Material, Delivery, DeliveryStatus } from "../../Types";
import { useInventoryData, useDeliveries } from "../../hooks/useSupabase";
import { useToast } from "../../context/ToastContext";

const CashierInventory = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("Materials");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Materials View Modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Deliveries Modals
  const [showConfirmReceipt, setShowConfirmReceipt] = useState(false);
  const [showViewDelivery, setShowViewDelivery] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [receipt, setReceipt] = useState({ received_quantity: "", receipt_reference_number: "" });

  const tabs = ["Materials", "Deliveries"];

  const { materials, stats: materialStats, loading: matLoading, updateMaterial } = useInventoryData();
  const { deliveries, stats: delStats, loading: delLoading, updateDelivery, confirmReceipt: confirmReceiptFn } = useDeliveries();

  const loading = activeTab === "Materials" ? matLoading : delLoading;

  // Handlers for Materials
  const handleViewMaterial = (material: Material) => { setSelectedMaterial(material); setShowViewModal(true); };
  const handleEditMaterial = (material: Material) => { setSelectedMaterial(material); setShowEditModal(true); };
  
  const handleSaveEdit = async (data: Partial<Material>) => {
    if (!selectedMaterial) return;
    const r = await updateMaterial(selectedMaterial.id, {
      name: data.itemType,
      unit_of_measure: data.stockUnit,
      current_quantity: data.usableStocks,
      reorder_point: data.reorderPoint,
      unit_cost: data.unitCost,
      description: data.description,
    });
    if (r.success) {
      toast.success("Stock updated successfully");
      setShowEditModal(false);
    } else {
      toast.error("Failed to update: " + r.error);
    }
  };

  // Handlers for Deliveries
  const handleConfirmReceipt = async () => {
    if (!selectedDelivery) return;
    if (!receipt.received_quantity || Number(receipt.received_quantity) <= 0) {
      toast.error("Valid quantity is required");
      return;
    }
    const r = await confirmReceiptFn(selectedDelivery.id, {
      received_quantity: Number(receipt.received_quantity),
      receipt_reference_number: receipt.receipt_reference_number,
    });
    if (r.success) {
      toast.success("Delivery marked as received");
      setShowConfirmReceipt(false);
    } else {
      toast.error("Error receiving delivery: " + r.error);
    }
  };

  const handleUpdateStatus = async (id: string, status: DeliveryStatus) => {
    const r = await updateDelivery(id, { status });
    if (r.success) toast.success("Status updated");
    else toast.error("Update failed: " + r.error);
  };

  if (loading) return <LoadingSpinner type="table" />;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Inventory Management" subtitle="View available materials and receive deliveries" />

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t} onClick={() => { setActiveTab(t); setSearchQuery(""); }} className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === t ? "text-cyan-600 border-b-2 border-cyan-600" : "text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === "Materials" && (
        <>
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
            <StatusCard title="Total Materials" value={materialStats.total} icon={<Package size={18} />} iconColor="text-cyan-600" />
            <StatusCard title="Available" value={materialStats.available} icon={<CheckCircle size={18} />} iconColor="text-green-600" />
            <StatusCard title="Low Stock" value={materialStats.lowStock} icon={<AlertTriangle size={18} />} iconColor="text-yellow-600" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search materials..." />
          </div>

          <InfoBanner color="blue">
            ℹ️ <strong>Note:</strong> You can view materials and update stock manually. Contact admin for supplier changes.
          </InfoBanner>

          <MaterialsTable materials={materials} userRole="cashier" onView={handleViewMaterial} onEdit={handleEditMaterial} searchQuery={searchQuery} />
        </>
      )}

      {activeTab === "Deliveries" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatusCard title="Total Requested" value={delStats.total} icon={<Truck size={18} />} iconColor="text-cyan-600" />
            <StatusCard title="En Route" value={delStats.enRoute} icon={<Truck size={18} />} iconColor="text-orange-600" />
            <StatusCard title="Received" value={delStats.received} icon={<CheckCircle size={18} />} iconColor="text-green-600" />
            <StatusCard title="Completed" value={delStats.completed} icon={<Package size={18} />} iconColor="text-purple-600" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search deliveries..." />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                    <th className="px-4 py-3">Material</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Requested</th>
                    <th className="px-4 py-3">Received</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deliveries.filter(d => d.materialName.toLowerCase().includes(searchQuery.toLowerCase()) || d.supplierName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No deliveries found</td></tr>
                  ) : deliveries.filter(d => d.materialName.toLowerCase().includes(searchQuery.toLowerCase()) || d.supplierName.toLowerCase().includes(searchQuery.toLowerCase())).map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><p className="font-semibold text-gray-900">{d.materialName}</p><p className="text-xs text-gray-500">{d.materialUnit}</p></td>
                      <td className="px-4 py-3 text-gray-600">{d.supplierName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getDeliveryStatusColor(d.status)}`}>{d.status.replace("_", " ")}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{d.requestedQuantity}</td>
                      <td className="px-4 py-3"><span className={d.status === 'received' ? 'text-green-600 font-bold' : ''}>{d.receivedQuantity || '-'}</span></td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          <button
                            onClick={() => { setSelectedDelivery(d); setShowViewDelivery(true); }}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs font-semibold"
                            title="View Details">View</button>


                          {d.status === 'en_route' && (
                            <div className="flex gap-2 justify-center">
                              <button onClick={() => { setSelectedDelivery(d); setReceipt({ received_quantity: d.requestedQuantity.toString(), receipt_reference_number: "" }); setShowConfirmReceipt(true); }} className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-semibold">Receive</button>
                              <button onClick={() => handleUpdateStatus(d.id, "returned")} className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-semibold">Return (Faulty)</button>
                            </div>
                          )}
                          {d.status === 'received' && (
                            <button onClick={() => handleUpdateStatus(d.id, "completed")} className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-xs font-semibold">Complete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-100">
              {deliveries.filter(d => d.materialName.toLowerCase().includes(searchQuery.toLowerCase())).map(d => (
                  <div key={d.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-900">{d.materialName}</p>
                        <p className="text-sm text-gray-500">{d.supplierName}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold capitalize ${getDeliveryStatusColor(d.status)}`}>{d.status.replace("_", " ")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Req: <strong className="text-gray-900">{d.requestedQuantity} {d.materialUnit}</strong></span>
                    </div>
                    <button
                      onClick={() => { setSelectedDelivery(d); setShowViewDelivery(true); }}
                      className="w-full mt-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold text-center">View Details</button>
                    {d.status === 'en_route' && (
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => { setSelectedDelivery(d); setReceipt({ received_quantity: d.requestedQuantity.toString(), receipt_reference_number: "" }); setShowConfirmReceipt(true); }} className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold text-center">Receive Stock</button>
                        <button onClick={() => handleUpdateStatus(d.id, "returned")} className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold text-center">Return (Faulty)</button>
                      </div>
                    )}
                    {d.status === 'received' && (
                      <button onClick={() => handleUpdateStatus(d.id, "completed")} className="w-full mt-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold text-center">Complete</button>
                    )}
                  </div>
              ))}
            </div>
            
          </div>
        </>
      )}

      {/* Confirm Receipt Modal */}
      {showConfirmReceipt && selectedDelivery && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 relative">
            <h3 className="text-xl font-bold mb-4">Confirm Receipt</h3>
            <p className="text-sm text-gray-500 mb-4">Receiving <strong>{selectedDelivery.materialName}</strong> from {selectedDelivery.supplierName}. This will automatically restock inventory.</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-1">Received Quantity *</label>
                <input type="number" value={receipt.received_quantity} onChange={e => setReceipt({...receipt, received_quantity: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Receipt Reference #</label>
                <input type="text" value={receipt.receipt_reference_number} onChange={e => setReceipt({...receipt, receipt_reference_number: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. OR-99812" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmReceipt(false)} className="flex-1 py-2 bg-gray-100 font-semibold rounded-lg">Cancel</button>
              <button onClick={handleConfirmReceipt} className="flex-1 py-2 bg-green-500 text-white font-semibold rounded-lg">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {selectedMaterial && activeTab === "Materials" && (
        <>
          <MaterialDetailsModal isOpen={showViewModal} material={selectedMaterial} userRole="cashier" onClose={() => setShowViewModal(false)} />
          <EditMaterialModal isOpen={showEditModal} material={selectedMaterial} userRole="cashier" onClose={() => setShowEditModal(false)} onSave={handleSaveEdit} />
        </>
      )}

      {/* Delivery Details View Modal */}
      {selectedDelivery && (
        <DeliveryDetailsModal
          isOpen={showViewDelivery}
          onClose={() => setShowViewDelivery(false)}
          delivery={selectedDelivery}
        />
      )}
    </div>
  );
};

export default CashierInventory;