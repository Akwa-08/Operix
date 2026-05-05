import {useState} from "react";
import {SearchBar} from "../Shared/UI/SearchBar";
import {StatusCard} from "../Shared/UI/StatusCard";
import {LoadingSpinner} from "../Shared/UI/LoadingSpinner";
import {PageHeader} from "../Shared/UI/PageHeader";
import {InfoBanner} from "../Shared/UI/InfoBanner";
import {ViewToggle} from "../Shared/UI/ViewToggle";
import {getOrderStatusColor} from "../../util/formatters";
import {OrderDetailsModal} from "../Shared/Orders/OrderDetailsModal";
import {OrderCardsGrid} from "../Shared/Orders/OrderCardsGrid";
import {Package, Clock, CheckCircle} from "lucide-react";
import type {Order} from "../../Types";
import {useOrdersData, useMyProfile} from "../../hooks/useSupabase";
import {useToast} from "../../context/ToastContext";
import {ExcessMaterialModal} from "./ExcessMaterialModal";

const ProductionOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const [showExcessModal, setShowExcessModal] = useState(false);
  const [pendingPickupOrder, setPendingPickupOrder] = useState<Order | null>(null);

  const { profile } = useMyProfile();
  const {
    orders: allOrders,
    loading,
    updateStatus,
    updateCustomerDesign,
    refresh,
  } = useOrdersData();

  const toast = useToast();

  // Filter for orders assigned to THIS production staff OR unassigned orders in Production status
  const orders = allOrders.filter(o => 
    o.status === "Production" &&
    (o.assignedProduction === profile?.id || !o.assignedProduction)
  );

  const stats = {
    // Orders in Production status visible to this user (assigned to them OR unassigned)
    inProgress: orders.length,
    // Orders explicitly assigned to this production staff member (any status)
    assigned: allOrders.filter(o => o.assignedProduction === profile?.id && o.status === "Production").length,
    // Orders this user completed (moved past Production)
    completed: allOrders.filter(
      (o) => o.assignedProduction === profile?.id && (o.status === "Pickup" || o.status === "Completed"),
    ).length,
  };

  const filtered = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      o.customerName?.toLowerCase().includes(q) ||
      o.orderId?.toLowerCase().includes(q)
    );
  });

  const selectedOrder = selectedOrderId
    ? allOrders.find((o) => o.id === selectedOrderId) ?? null
    : null;

  const handleViewOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setShowDetailsModal(true);
  };

  const handleMarkPickup = (order: Order) => {
    setPendingPickupOrder(order);
    setShowExcessModal(true);
  };

  const handleConfirmPickup = async (excessUsage: Record<string, number>) => {
    if (!pendingPickupOrder) return;
    const r = await updateStatus(pendingPickupOrder.id, "Pickup", excessUsage);
    if (r.success) {
      toast.success(`${pendingPickupOrder.orderId} → Ready for Pickup!`);
      setShowExcessModal(false);
      setPendingPickupOrder(null);
    } else {
      toast.error("Error: " + r.error);
    }
  };

  if (loading) return <LoadingSpinner type="table" />;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Production Orders"
        subtitle="Orders assigned to production — mark complete when done"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatusCard
          title="In Production"
          value={stats.inProgress}
          icon={<Clock size={18} />}
          iconColor="text-blue-600"
        />
        <StatusCard
          title="Assigned to Me"
          value={stats.assigned}
          icon={<Package size={18} />}
          iconColor="text-orange-600"
        />
        <StatusCard
          title="Done"
          value={stats.completed}
          icon={<CheckCircle size={18} />}
          iconColor="text-green-600"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search orders..."
            />
          </div>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      <InfoBanner color="orange">
        🏭 <strong>Production:</strong> Only you can mark orders as "Ready for
        Pickup" when production is complete.
      </InfoBanner>

      {viewMode === "list" ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* MOBILE */}
          <div className="md:hidden divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-400">
                No production orders
              </p>
            ) : (
              filtered.map((o: any) => (
                <div
                  key={o.id}
                  className={`p-4 space-y-2 ${o.status === "Overdue" ? "bg-red-50" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900">{o.orderId}</p>
                      <p className="text-sm text-gray-500">
                        {o.customerName} · {o.productType}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getOrderStatusColor(o.status)}`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Qty: {o.quantity}</span>
                    <span className="text-xs">Due: {o.dueDate}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewOrder(o)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 rounded-lg text-sm text-cyan-700 font-semibold">
                      <Package size={14} /> View
                    </button>
                    {o.status === "Production" && (
                      <button
                        onClick={() => handleMarkPickup(o)}
                        className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold rounded-lg">
                        ✓ Ready
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {/* DESKTOP */}
          <div className="hidden md:block overflow-x-auto">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Order ID
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Product
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Due
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((o: any) => (
                    <tr
                      key={o.id}
                      className={`hover:bg-gray-50 ${o.status === "Overdue" ? "bg-red-50" : ""}`}>
                      <td className="px-4 py-3 font-mono text-xs">
                        {o.orderId}
                      </td>
                      <td className="px-4 py-3">{o.customerName}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {o.productType}
                      </td>
                      <td className="px-4 py-3 text-center">{o.quantity}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getOrderStatusColor(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {o.dueDate}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewOrder(o)}
                            className="p-1.5 hover:bg-cyan-100 rounded-lg">
                            <Package size={16} className="text-cyan-600" />
                          </button>
                          {o.status === "Production" && (
                            <button
                              onClick={() => handleMarkPickup(o)}
                              className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-semibold rounded-lg">
                              ✓ Ready
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-gray-400">
                        No production orders
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <OrderCardsGrid
          orders={filtered}
          searchQuery={searchQuery}
          onView={handleViewOrder}
        />
      )}

      {selectedOrder && (
        <OrderDetailsModal
          isOpen={showDetailsModal}
          order={selectedOrder}
          userRole="production"
          onClose={() => setShowDetailsModal(false)}
          onUpdateStatus={(s) => {
            updateStatus(selectedOrder.id, s);
            setShowDetailsModal(false);
          }}
          onUpdateCustomerDesign={async (url) => {
            const r = await updateCustomerDesign(selectedOrder.id, url);
            if (!r.success) throw new Error(r.error || "Update failed");
          }}
          onRefresh={refresh}
        />
      )}
      {pendingPickupOrder && (
        <ExcessMaterialModal
          isOpen={showExcessModal}
          onClose={() => {
            setShowExcessModal(false);
            setPendingPickupOrder(null);
          }}
          orderId={pendingPickupOrder.id}
          orderNumber={pendingPickupOrder.orderId}
          onConfirm={handleConfirmPickup}
        />
      )}
    </div>
  );
};

export default ProductionOrders;
