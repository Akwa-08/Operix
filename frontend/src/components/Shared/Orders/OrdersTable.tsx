// src/components/Shared/Orders/OrdersTable.tsx
// Mobile: stacked card view per order. Desktop: full table.

import { Eye, Edit2, Trash2, Upload, CheckCircle } from "lucide-react";
import type { UserRole, Order } from "../../../Types";
import { permissions } from "../../../util/permissions";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { getPaymentStatusColor } from "../../../util/formatters";

interface OrdersTableProps {
  orders: Order[];
  userRole: UserRole;
  onViewDetails: (order: Order) => void;
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  onUploadDesign?: (order: Order) => void;
  onUpdateStatus?: (order: Order) => void;
  searchQuery?: string;
}

const paymentColor = getPaymentStatusColor;

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders, userRole, onViewDetails, onEdit, onDelete,
  onUploadDesign, onUpdateStatus, searchQuery = "",
}) => {
  const perms = permissions[userRole].orders;

  const filteredOrders = orders.filter((order) => {
    const customerName = order.customerName || order.customer || "";
    const productName  = order.productType  || order.product  || "";
    const matchesSearch =
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      productName.toLowerCase().includes(searchQuery.toLowerCase());
    if (userRole === "designer"   && perms.canViewAssigned) return matchesSearch && order.assignedDesigner  === "Current User";
    if (userRole === "production" && perms.canViewAssigned) return matchesSearch && order.assignedProduction === "Current User";
    return matchesSearch;
  });

  const ActionButtons = ({ order }: { order: Order }) => (
    <div className="flex items-center gap-1 flex-wrap">
      <button onClick={() => onViewDetails(order)}
        className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-200 rounded-lg text-xs text-gray-700 font-semibold transition-colors">
        <Eye size={14} /> View
      </button>
      {perms.canEditAll && onEdit && (
        <button onClick={() => onEdit(order)}
          className="flex items-center gap-1 px-2 py-1.5 hover:bg-cyan-100 rounded-lg text-xs text-cyan-700 font-semibold transition-colors">
          <Edit2 size={14} /> Assign
        </button>
      )}
      {perms.canUploadDesign && onUploadDesign && order.status === "Designing" && (
        <button onClick={() => onUploadDesign(order)}
          className="flex items-center gap-1 px-2 py-1.5 hover:bg-purple-100 rounded-lg text-xs text-purple-700 font-semibold transition-colors">
          <Upload size={14} /> Upload
        </button>
      )}
      {perms.canUpdateProductionStatus && onUpdateStatus && order.status === "Production" && (
        <button onClick={() => onUpdateStatus(order)}
          className="flex items-center gap-1 px-2 py-1.5 hover:bg-green-100 rounded-lg text-xs text-green-700 font-semibold transition-colors">
          <CheckCircle size={14} /> Update
        </button>
      )}
      {perms.canDelete && onDelete && (
        <button onClick={() => onDelete(order)}
          className="flex items-center gap-1 px-2 py-1.5 hover:bg-red-100 rounded-lg text-xs text-red-700 font-semibold transition-colors">
          <Trash2 size={14} /> Delete
        </button>
      )}
    </div>
  );

  if (filteredOrders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center text-gray-400 text-base">
        No orders found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* ── MOBILE CARD VIEW (hidden on md+) ─────────────────────────────── */}
      <div className="md:hidden divide-y divide-gray-100">
        {filteredOrders.map((order) => (
          <div key={order.id} className="p-4 space-y-2">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-gray-900 text-base">{order.orderId}</p>
                <p className="text-sm text-gray-600">{order.customerName || order.customer}</p>
              </div>
              <OrderStatusBadge status={order.status} size="sm" />
            </div>
            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div><span className="text-gray-400">Product:</span> <span className="font-medium text-gray-700">{order.productType || order.product || "—"}</span></div>
              <div><span className="text-gray-400">Qty:</span> <span className="font-medium text-gray-700">{order.quantity}</span></div>
              {perms.canViewAll && (
                <>
                  <div><span className="text-gray-400">Amount:</span> <span className="font-semibold text-gray-900">₱{order.totalAmount.toLocaleString()}</span></div>
                  <div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${paymentColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </>
              )}
              <div><span className="text-gray-400">Due:</span> <span className="font-medium text-gray-700">{order.dueDate || "—"}</span></div>
            </div>
            {/* Actions */}
            <ActionButtons order={order} />
          </div>
        ))}
      </div>

      {/* ── DESKTOP TABLE (hidden on mobile) ─────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <div className="overflow-x-auto w-full">
<table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Order ID</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Qty</th>
              {perms.canViewAll && (
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Amount</th>
              )}
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
              {perms.canViewAll && (
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Payment</th>
              )}
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Due Date</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900 font-semibold">{order.orderId}</td>
                <td className="px-4 py-3 text-gray-900">{order.customerName || order.customer}</td>
                <td className="px-4 py-3 text-gray-600">{order.productType || order.product}</td>
                <td className="px-4 py-3 text-center font-semibold text-gray-900">{order.quantity}</td>
                {perms.canViewAll && (
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">₱{order.totalAmount.toLocaleString()}</td>
                )}
                <td className="px-4 py-3 text-center"><OrderStatusBadge status={order.status} size="sm" /></td>
                {perms.canViewAll && (
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${paymentColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3 text-center text-gray-600">{order.dueDate}</td>
                <td className="px-4 py-3"><ActionButtons order={order} /></td>
              </tr>
            ))}
          </tbody>
        </table>
</div>
      </div>
    </div>
  );
};
