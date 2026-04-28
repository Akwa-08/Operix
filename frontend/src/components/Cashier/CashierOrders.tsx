import {useState} from "react";
import {Plus, DollarSign, Package, Clock, CheckCircle} from "lucide-react";
import {SearchBar} from "../Shared/UI/SearchBar";
import {StatusCard} from "../Shared/UI/StatusCard";
import {Button} from "../Shared/UI/Button";
import {LoadingSpinner} from "../Shared/UI/LoadingSpinner";
import {PageHeader} from "../Shared/UI/PageHeader";
import {InfoBanner} from "../Shared/UI/InfoBanner";
import {ViewToggle} from "../Shared/UI/ViewToggle";
import {
  getOrderStatusColor,
  getPaymentStatusColor,
} from "../../util/formatters";
import {OrderCardsGrid} from "../Shared/Orders/OrderCardsGrid";
import {OrderDetailsModal} from "../Shared/Orders/OrderDetailsModal";
import {CreateOrderModal} from "../Shared/Orders/CreateOrderModal";
import type {Order} from "../../Types";
import {useOrdersData} from "../../hooks/useSupabase";
import {useToast} from "../../context/ToastContext";

const CashierOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");

  const {
    orders,
    stats,
    loading,
    createOrder,
    recordPayment,
    updateCustomerDesign,
    updateStatus,
    refresh,
  } = useOrdersData();

  const toast = useToast();

  const handleCreateOrder = async (orderData: any) => {
    const result = await createOrder({
      customer_id: orderData.customerId || null,
      order_type: "walk-in",
      items: [
        {
          product_name: orderData.productType,
          quantity: orderData.quantity,
          unit_price: orderData.totalAmount / (orderData.quantity || 1),
          specifications: orderData.specialInstructions,
        },
      ],
      special_instructions: orderData.specialInstructions,
      due_date: orderData.dueDate,
    });
    if (result.success) {
      setShowCreateModal(false);
      toast.success("Order created successfully!");
    } else toast.error("Error: " + result.error);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setShowDetailsModal(true);
  };

  if (loading) return <LoadingSpinner />;

  const filteredOrders = orders.filter((o) => {
    // Filter by status if not "All"
    if (statusFilter !== "All" && o.status !== statusFilter) return false;

    const q = searchQuery.toLowerCase();
    return (
      !q ||
      o.customerName?.toLowerCase().includes(q) ||
      o.orderId?.toLowerCase().includes(q) ||
      o.productType?.toLowerCase().includes(q)
    );
  });

  const selectedOrder = selectedOrderId
    ? orders.find((o) => o.id === selectedOrderId) ?? null
    : null;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Orders"
        subtitle="Create orders and process payments"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatusCard
          title="Total"
          value={stats.total}
          icon={<Package size={18} />}
          iconColor="text-cyan-600"
        />
        <StatusCard
          title="In Queue"
          value={stats.inQueue}
          icon={<Clock size={18} />}
          iconColor="text-orange-600"
        />
        <StatusCard
          title="Pending Payment"
          value={stats.pendingPayment}
          icon={<DollarSign size={18} />}
          iconColor="text-red-600"
        />
        <StatusCard
          title="Completed"
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
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium text-gray-700">
              <option value="All">All Status</option>
              <option value="In Queue">In Queue</option>
              <option value="Designing">Designing</option>
              <option value="Payment">Payment</option>
              <option value="Production">Production</option>
              <option value="Pickup">Pickup</option>
              <option value="Completed">Completed</option>
            </select>
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <Button
              variant="primary"
              icon={<Plus size={18} />}
              onClick={() => setShowCreateModal(true)}>
              Create Order
            </Button>
          </div>
        </div>
      </div>

      <InfoBanner color="blue">
        ℹ️ <strong>Cashier:</strong> Create walk-in orders, view details, and
        record payments. Tap the ₱ icon to process payment.
      </InfoBanner>

      {viewMode === "list" ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* MOBILE */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredOrders.length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-400">
                No orders found
              </p>
            ) : (
              filteredOrders.map((o: any) => (
                <div key={o.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900">{o.orderId}</p>
                      <p className="text-sm text-gray-500">
                        {o.customerName} · {o.productType}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getOrderStatusColor(o.status)}`}>
                        {o.status}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getPaymentStatusColor(o.paymentStatus)}`}>
                        {o.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-gray-900">
                      ₱{o.totalAmount?.toLocaleString()}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {o.dateOrdered}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewOrder(o)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 rounded-lg text-sm text-cyan-700 font-semibold w-full justify-center">
                      <Package size={14} /> Manage Order
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* DESKTOP */}
          <div className="hidden md:block overflow-x-auto">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
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
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">
                        {o.orderId}
                      </td>
                      <td className="px-4 py-3">{o.customerName}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {o.productType}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ₱{o.totalAmount?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getOrderStatusColor(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(o.paymentStatus)}`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {o.dateOrdered}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewOrder(o)}
                            className="p-1.5 hover:bg-cyan-100 rounded-lg"
                            title="Manage">
                            <Package size={16} className="text-cyan-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-gray-400">
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <OrderCardsGrid orders={filteredOrders} onView={handleViewOrder} />
      )}

      <CreateOrderModal
        isOpen={showCreateModal}
        userRole="cashier"
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateOrder}
      />

      {selectedOrder && (
        <OrderDetailsModal
          isOpen={showDetailsModal}
          order={selectedOrder}
          userRole="cashier"
          onClose={() => setShowDetailsModal(false)}
          onRecordPayment={recordPayment}
          onUpdateCustomerDesign={async (url) => {
            const r = await updateCustomerDesign(selectedOrder.id, url);
            if (!r.success) throw new Error(r.error || "Update failed");
          }}
          onUpdateStatus={async (status) => {
            const r = await updateStatus(selectedOrder.id, status);
            if (!r.success) throw new Error(r.error || "Update failed");
            setShowDetailsModal(false);
          }}
          onRefresh={refresh}
        />
      )}
    </div>
  );
};

export default CashierOrders;
