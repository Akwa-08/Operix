// src/components/Shared/Orders/OrdersTable.tsx

import { Eye, Edit2, Trash2, Upload, CheckCircle } from "lucide-react";
import type { UserRole, Order } from "../../../Types";
import { permissions } from "../../../util/permissions";
import { OrderStatusBadge } from "./OrderStatusBadge";

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

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  userRole,
  onViewDetails,
  onEdit,
  onDelete,
  onUploadDesign,
  onUpdateStatus,
  searchQuery = "",
}) => {
  const perms = permissions[userRole].orders;

  const filteredOrders = orders.filter((order) => {
    const customerName = order.customerName || order.customer || "";
    const productName = order.productType || order.product || "";
    
    const matchesSearch =
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      productName.toLowerCase().includes(searchQuery.toLowerCase());

    // Designer sees only assigned orders
    if (userRole === "designer" && perms.canViewAssigned) {
      return matchesSearch && order.assignedDesigner === "Current User";
    }

    // Production sees only assigned orders
    if (userRole === "production" && perms.canViewAssigned) {
      return matchesSearch && order.assignedProduction === "Current User";
    }

    // Admin/Cashier see all orders
    return matchesSearch;
  });

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700 border-green-200";
      case "Unpaid":
        return "bg-red-100 text-red-700 border-red-200";
      case "Partial":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
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
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Quantity
              </th>
              {perms.canViewAll && (
                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                  Amount
                </th>
              )}
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Status
              </th>
              {perms.canViewAll && (
                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                  Payment
                </th>
              )}
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Due Date
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={perms.canViewAll ? 9 : 7}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-semibold">
                    {order.orderId}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {order.customerName || order.customer}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.productType || order.product}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">
                    {order.quantity}
                  </td>
                  {perms.canViewAll && (
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">
                      ₱{order.totalAmount.toLocaleString()}
                    </td>
                  )}
                  <td className="px-4 py-3 text-center">
                    <OrderStatusBadge status={order.status} size="sm" />
                  </td>
                  {perms.canViewAll && (
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusColor(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-center text-gray-600">
                    {order.dueDate}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onViewDetails(order)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} className="text-gray-600" />
                      </button>

                      {/* Admin/Cashier can edit - use canEditAll */}
                      {perms.canEditAll && onEdit && (
                        <button
                          onClick={() => onEdit(order)}
                          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Edit Order"
                        >
                          <Edit2 size={18} className="text-gray-600" />
                        </button>
                      )}

                      {/* Designer can upload design */}
                      {perms.canUploadDesign &&
                        onUploadDesign &&
                        order.status === "Designing" && (
                          <button
                            onClick={() => onUploadDesign(order)}
                            className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors"
                            title="Upload Design"
                          >
                            <Upload size={18} className="text-purple-600" />
                          </button>
                        )}

                      {/* Production can update status */}
                      {perms.canUpdateProductionStatus &&
                        onUpdateStatus &&
                        order.status === "Production" && (
                          <button
                            onClick={() => onUpdateStatus(order)}
                            className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
                            title="Update Status"
                          >
                            <CheckCircle size={18} className="text-green-600" />
                          </button>
                        )}

                      {/* Admin can delete */}
                      {perms.canDelete && onDelete && (
                        <button
                          onClick={() => onDelete(order)}
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete Order"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
