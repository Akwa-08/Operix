//src\components\Shared\Inventory\DeleteMaterialModal.tsx

import { AlertTriangle } from "lucide-react";
import { Modal } from "../UI/Modal";
import { Button } from "../UI/Button";
import type { Material, UserRole } from "../../../Types";
import { permissions } from "../../../util/permissions";

interface DeleteMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material;
  userRole: UserRole;
  onDelete: () => void;
}

export const DeleteMaterialModal: React.FC<DeleteMaterialModalProps> = ({
  isOpen,
  onClose,
  material,
  userRole,
  onDelete,
}) => {
  const perms = permissions[userRole].inventory;

  // Only admin can delete
  if (!perms.canDelete) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Access Denied" size="sm">
        <div className="text-center py-6">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-gray-600">
            You don't have permission to delete materials.
          </p>
          <Button variant="primary" onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Material"
      size="md"
      showCloseButton={false}
    >
      <div className="space-y-6">
        {/* Warning Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
        </div>

        {/* Warning Message */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-gray-900">
            Delete this material?
          </h3>
          <p className="text-gray-600">
            This action cannot be undone. The material will be permanently removed
            from your inventory.
          </p>
        </div>

        {/* Material Details */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-gray-700">
                Item Type:
              </span>
              <span className="text-sm text-gray-900 font-bold">
                {material.itemType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-gray-700">
                Variant:
              </span>
              <span className="text-sm text-gray-900 font-bold">
                {material.itemVariant}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-gray-700">
                Current Stock:
              </span>
              <span className="text-sm text-gray-900 font-bold">
                {material.usableStocks} {material.stockUnit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-gray-700">
                Supplier:
              </span>
              <span className="text-sm text-gray-900 font-bold">
                {material.supplier}
              </span>
            </div>
          </div>
        </div>

        {/* Warning Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-yellow-800 font-medium">
            ⚠️ <strong>Important:</strong> If this material is currently being
            used in active orders or production, deleting it may cause issues.
            Please verify before proceeding.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={onDelete} className="flex-1">
            Yes, Delete Material
          </Button>
        </div>
      </div>
    </Modal>
  );
};
