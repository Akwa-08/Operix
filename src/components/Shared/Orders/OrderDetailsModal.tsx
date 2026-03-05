// src/components/Shared/Orders/OrderDetailsModal.tsx

import { Modal } from "../UI/Modal";
import { Button } from "../UI/Button";
import type { UserRole, Order } from "../../../Types";
import { permissions } from "../../../util/permissions";
import { OrderStatusBadge } from "./OrderStatusBadge";
import {
  User,
  Package,
  Calendar,
  DollarSign,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  userRole: UserRole;
  onUploadDesign?: () => void;
  onUpdateStatus?: (newStatus: string) => void;
  onEdit?: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  userRole,
  onUploadDesign,
  onUpdateStatus,
  onEdit,
}) => {
  const perms = permissions[userRole].orders;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Order Details" size="xl">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {order.orderId}
              </h2>
              <p className="text-gray-600 font-medium mt-1">
                Ordered on {order.dateOrdered}
              </p>
            </div>
            <div className="flex gap-2">
              <OrderStatusBadge status={order.status} size="md" />
              {perms.canViewAll && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                    order.paymentStatus === "Paid"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : order.paymentStatus === "Partial"
                      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                      : "bg-red-100 text-red-700 border-red-200"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              )}
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Package size={16} className="text-cyan-600" />
                <span className="text-xs text-gray-500 font-semibold uppercase">
                  Product
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {order.productType || order.product}
              </p>
              <p className="text-xs text-gray-600">{order.quantity} pcs</p>
            </div>

            {perms.canViewAll && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={16} className="text-green-600" />
                  <span className="text-xs text-gray-500 font-semibold uppercase">
                    Total Amount
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  ₱{order.totalAmount.toLocaleString()}
                </p>
              </div>
            )}

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={16} className="text-orange-600" />
                <span className="text-xs text-gray-500 font-semibold uppercase">
                  Due Date
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900">{order.dueDate}</p>
            </div>
          </div>
        </div>

        {/* Customer Information - Admin/Cashier only */}
        {perms.canViewAll && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <User size={20} className="text-cyan-600" />
              Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
              <InfoField label="Name" value={order.customerName || order.customer || "N/A"} />
              <InfoField label="Email" value={order.customerEmail || "N/A"} />
              <InfoField label="Phone" value={order.customerPhone || "N/A"} />
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText size={20} className="text-purple-600" />
            Order Information
          </h3>
          <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
            <InfoField label="Product Type" value={order.productType || order.product || ""} />
            <InfoField label="Quantity" value={`${order.quantity} pcs`} />
            {perms.canViewAll && (
              <>
                <InfoField
                  label="Total Amount"
                  value={`₱${order.totalAmount.toLocaleString()}`}
                />
                <InfoField label="Payment Status" value={order.paymentStatus} />
              </>
            )}
            <InfoField label="Date Ordered" value={order.dateOrdered} />
            <InfoField label="Due Date" value={order.dueDate} />
            {order.assignedDesigner && (
              <InfoField label="Assigned Designer" value={order.assignedDesigner} />
            )}
            {order.assignedProduction && (
              <InfoField
                label="Assigned Production"
                value={order.assignedProduction}
              />
            )}
          </div>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-700">
              Special Instructions
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">{order.specialInstructions}</p>
            </div>
          </div>
        )}

        {/* Design File - Designer/Admin/Production */}
        {(perms.canUploadDesign || perms.canViewAll) && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Upload size={18} className="text-purple-600" />
              Design File
            </h3>
            {order.designFile ? (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Design Uploaded
                    </p>
                    <p className="text-xs text-gray-600">{order.designFile}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Download
                </Button>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-gray-400" />
                  <p className="text-sm text-gray-600">No design file uploaded yet</p>
                </div>
                {perms.canUploadDesign &&
                  onUploadDesign &&
                  order.status === "Designing" && (
                    <Button variant="primary" size="sm" onClick={onUploadDesign}>
                      Upload Design
                    </Button>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Production Status Update - Production Role */}
        {perms.canUpdateProductionStatus &&
          onUpdateStatus &&
          order.status === "Production" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                Update Production Status
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onUpdateStatus("Pickup")}
                >
                  Mark as Ready for Pickup
                </Button>
              </div>
            </div>
          )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Close
          </Button>
          {/* Use canEditAll instead of canEdit */}
          {perms.canEditAll && onEdit && (
            <Button variant="primary" onClick={onEdit} className="flex-1">
              Edit Order
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

// Helper component
const InfoField: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div>
    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">{label}</p>
    <p className="text-sm text-gray-900 font-semibold">{value}</p>
  </div>
);
