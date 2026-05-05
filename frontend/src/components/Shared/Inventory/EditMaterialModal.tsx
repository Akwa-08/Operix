//src\components\Shared\Inventory\EditMaterialModal.tsx

import { useState, useEffect } from "react";
import { Modal } from "../UI/Modal";
import { Button } from "../UI/Button";
import type { Material, UserRole } from "../../../Types";
import { permissions } from "../../../util/permissions";

interface EditMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material;
  userRole: UserRole;
  onSave: (data: Partial<Material>) => void;
}

export const EditMaterialModal: React.FC<EditMaterialModalProps> = ({
  isOpen,
  onClose,
  material,
  userRole,
  onSave,
}) => {
  const perms = permissions[userRole].inventory;

  // Re-sync form whenever the selected material changes (fixes stale data bug)
  const [formData, setFormData] = useState<Partial<Material>>(() => ({
    itemType: material.itemType,
    itemVariant: material.itemVariant,
    usableStocks: material.usableStocks,
    stockUnit: material.stockUnit,
    reorderPoint: material.reorderPoint,
    unitCost: material.unitCost,
    purchaseQty: material.purchaseQty,
    purchaseUnit: material.purchaseUnit,
    supplier: material.supplier,
    status: material.status,
    description: material.description,
  }));

  useEffect(() => {
    setFormData({
      itemType: material.itemType,
      itemVariant: material.itemVariant,
      usableStocks: material.usableStocks,
      stockUnit: material.stockUnit,
      reorderPoint: material.reorderPoint,
      unitCost: material.unitCost,
      purchaseQty: material.purchaseQty,
      purchaseUnit: material.purchaseUnit,
      supplier: material.supplier,
      status: material.status,
      description: material.description,
    });
  }, [material.id]);

  const handleChange = (field: keyof Material, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Material" size="lg">
      <div className="space-y-5">
        {/* Admin sees ALL fields and can edit them */}
        {perms.canEditAllFields && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Item Type *
                </label>
                <input
                  type="text"
                  value={formData.itemType}
                  onChange={(e) => handleChange("itemType", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g., Tarpaulin, Ink, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Item Variant *
                </label>
                <input
                  type="text"
                  value={formData.itemVariant}
                  onChange={(e) => handleChange("itemVariant", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g., 6.1 ft x 164 ft"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Usable Stocks *
                </label>
                <input
                  type="number"
                  value={formData.usableStocks}
                  onChange={(e) =>
                    handleChange("usableStocks", Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Stock Unit *
                </label>
                <input
                  type="text"
                  value={formData.stockUnit}
                  onChange={(e) => handleChange("stockUnit", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g., feet, ml, pieces"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Purchase Quantity *
                </label>
                <input
                  type="number"
                  value={formData.purchaseQty}
                  onChange={(e) =>
                    handleChange("purchaseQty", Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Purchase Unit *
                </label>
                <input
                  type="text"
                  value={formData.purchaseUnit}
                  onChange={(e) => handleChange("purchaseUnit", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g., rolls, bottles, packs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Reorder Point
                </label>
                <input
                  type="number"
                  value={formData.reorderPoint}
                  onChange={(e) =>
                    handleChange("reorderPoint", Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Unit Cost (₱)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) =>
                    handleChange("unitCost", Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Supplier *
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => handleChange("supplier", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g., ABC co."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500">
                <option>Available</option>
                <option>Low Stock</option>
                <option>Restocking</option>
                <option>Phased Out</option>
              </select>
            </div>
          </>
        )}

        {/* Cashier/Production see READ-ONLY info + can edit ONLY stock */}
        {perms.canEditStock && !perms.canEditAllFields && (
          <>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Material Information (Read-only)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 font-medium">Item Type:</span>
                  <p className="text-gray-900 font-semibold">
                    {material.itemType}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">
                    Item Variant:
                  </span>
                  <p className="text-gray-900 font-semibold">
                    {material.itemVariant}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Supplier:</span>
                  <p className="text-gray-900 font-semibold">
                    {material.supplier}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Status:</span>
                  <p className="text-gray-900 font-semibold">
                    {material.status}
                  </p>
                </div>
              </div>
            </div>

            {/* Editable Stock Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Usable Stocks
              </label>
              <input
                type="number"
                value={formData.usableStocks}
                onChange={(e) =>
                  handleChange("usableStocks", Number(e.target.value))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current unit: {material.stockUnit}
              </p>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} className="flex-1">
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};
