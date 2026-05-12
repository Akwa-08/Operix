// src/components/Shared/Orders/OrdersTable.tsx
// Mobile: stacked card view per order. Desktop: full table.

import { Eye, Edit2, Trash2, Upload, CheckCircle, AlertTriangle } from "lucide-react";
import type { UserRole, Order } from "../../../Types";
import { permissions } from "../../../util/permissions";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { getPaymentStatusColor } from "../../../util/formatters";
import { SukiBadge } from "../UI/SukiBadge";

interface OrdersTableProps {
  orders: Order[];
  userRole: UserRole;
  onViewDetails: (order: Order) => void;
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  onUploadDesign?: (order: Order) => void;
  onUpdateStatus?: (order: Order) => void;
}

const paymentColor = getPaymentStatusColor;

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders, userRole, onViewDetails, onEdit, onDelete,
  onUploadDesign, onUpdateStatus,
}) => {
  const perms = permissions[userRole].orders;

  const filteredOrders = orders;

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
          <div key={order.id} className={`p-4 space-y-2 transition-colors ${order.paymentStatus === "Partially paid" ? "bg-yellow-50/80" : ""}`}>
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-gray-900 text-base">{order.orderId}</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600">{order.customerName || order.customer}</p>
                  {order.isSuki && <SukiBadge />}
                </div>
              </div>
              <OrderStatusBadge status={order.status} paymentStatus={order.paymentStatus} size="sm" />
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
                      {order.paymentStatus === "Partially paid" ? "Paid Partially" : order.paymentStatus}
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
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Designer</th>
                )}
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
                <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${order.paymentStatus === "Partially paid" ? "bg-yellow-50/80" : ""}`}>
                  <td className="px-4 py-3 text-gray-900 font-semibold">{order.orderId}</td>
                  <td className="px-4 py-3 text-gray-900">
                    <div className="flex items-center gap-2">
                      {order.customerName || order.customer}
                      {order.isSuki && <SukiBadge />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{order.productType || order.product}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{order.quantity}</td>
                  {perms.canViewAll && (
                    <td className="px-4 py-3 text-center">
                      {order.assignedDesigner ? (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold uppercase tracking-wider">
                          {order.designerName || "Assigned"}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 mx-auto w-fit">
                          <AlertTriangle size={10} /> Unassigned
                        </span>
                      )}
                    </td>
                  )}
                  {perms.canViewAll && (
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">₱{order.totalAmount.toLocaleString()}</td>
                  )}
                  <td className="px-4 py-3 text-center"><OrderStatusBadge status={order.status} paymentStatus={order.paymentStatus} size="sm" /></td>
                  {perms.canViewAll && (
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${paymentColor(order.paymentStatus)}`}>
                        {order.paymentStatus === "Partially paid" ? "Paid Partially" : order.paymentStatus}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-center text-gray-600">{order.dueDate}</td>
                  <td className="px-4 py-3 text-center"><ActionButtons order={order} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
