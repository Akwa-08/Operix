//src\components\Shared\Inventory\MaterialDetailsModal.tsx


import { Modal } from "../UI/Modal";
import type { Material, UserRole } from "../../../Types";
import { permissions } from "../../../util/permissions";
import { Package, TrendingUp, Calendar, AlertCircle } from "lucide-react";

interface MaterialDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material;
  userRole: UserRole;
}

export const MaterialDetailsModal: React.FC<MaterialDetailsModalProps> = ({
  isOpen,
  onClose,
  material,
  userRole,
}) => {
  const perms = permissions[userRole].inventory;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-700 border-green-200";
      case "Low Stock":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Restocking":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Phased Out":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Material Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Card with Status */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {material.itemType}
              </h2>
              <p className="text-gray-600 font-medium mt-1">
                {material.itemVariant}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(
                material.status
              )}`}
            >
              {material.status}
            </span>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Package size={16} className="text-cyan-600" />
                <span className="text-xs text-gray-500 font-semibold uppercase">
                  Current Stock
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {material.usableStocks}
              </p>
              <p className="text-xs text-gray-600">{material.stockUnit}</p>
            </div>

            {perms.canViewAll && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={16} className="text-green-600" />
                  <span className="text-xs text-gray-500 font-semibold uppercase">
                    Purchase Unit
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {material.purchaseQty}
                </p>
                <p className="text-xs text-gray-600">{material.purchaseUnit}</p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Information - Admin sees all */}
        {perms.canViewAll && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
              Complete Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Item Type" value={material.itemType} />
              <InfoField label="Item Variant" value={material.itemVariant} />
              <InfoField
                label="Usable Stocks"
                value={`${material.usableStocks} ${material.stockUnit}`}
              />
              <InfoField
                label="Purchase Quantity"
                value={`${material.purchaseQty} ${material.purchaseUnit}`}
              />
              <InfoField label="Supplier" value={material.supplier} />
              <InfoField label="Status" value={material.status} />
            </div>
          </div>
        )}

        {/* Limited info for Cashier/Production */}
        {!perms.canViewAll && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
              Available Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Item Type" value={material.itemType} />
              <InfoField label="Item Variant" value={material.itemVariant} />
              <InfoField
                label="Current Stock"
                value={`${material.usableStocks} ${material.stockUnit}`}
              />
              <InfoField label="Status" value={material.status} />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900 font-medium">
                  Limited View
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Contact admin for complete material information including supplier
                  details and purchase quantities.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stock Alert for Low Stock */}
        {material.status === "Low Stock" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-900 font-semibold">
                Low Stock Warning
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                This material is running low. Consider restocking soon to avoid
                production delays.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// Helper component for info fields
const InfoField: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div>
    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">
      {label}
    </p>
    <p className="text-sm text-gray-900 font-semibold">{value}</p>
  </div>
);
