//src\components\Shared\Inventory\EditMaterialModal.tsx

import { useState, useEffect } from "react";
import { Modal } from "../UI/Modal";
import { Button } from "../UI/Button";
import { Star, AlertTriangle, Flag } from "lucide-react";
import type { Material, UserRole } from "../../../Types";
import { permissions } from "../../../util/permissions";

interface EditMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material;
  userRole: UserRole;
  suppliers: { id: string; name: string; flag_category?: string }[];
  onSave: (data: Partial<Material>, supplierIds?: string[]) => void;
}

const getFlagPriority = (category?: string) => {
  if (category === "Preferred") return 1;
  if (category === "Warning") return 3;
  if (category === "Critical") return 4;
  return 2;
};

const renderSupplierNameWithFlag = (s: any) => {
  const category = s.flag_category;
  return (
    <span className="flex items-center gap-1.5">
      {category === "Preferred" && <Star size={14} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />}
      {category === "Warning" && <AlertTriangle size={14} className="text-orange-500 flex-shrink-0" />}
      {category === "Critical" && <Flag size={14} className="text-red-600 fill-red-600 flex-shrink-0" />}
      <span className="truncate">{s.name}</span>
    </span>
  );
};

export const EditMaterialModal: React.FC<EditMaterialModalProps> = ({
  isOpen,
  onClose,
  material,
  userRole,
  suppliers,
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

  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>(
    material.mappedSuppliers?.map((s) => s.id) || [],
  );

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
    setSelectedSupplierIds(material.mappedSuppliers?.map((s) => s.id) || []);
  }, [material.id, material.mappedSuppliers]);

  const handleChange = (field: keyof Material, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSave(formData, selectedSupplierIds);
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
                  Description
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
                  Conversion Rate *
                </label>
                <input
                  type="number"
                  value={formData.purchaseQty}
                  onChange={(e) =>
                    handleChange("purchaseQty", Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">Number of {formData.stockUnit || 'units'} per {formData.purchaseUnit || 'purchase unit'}</p>
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
                <p className="text-[10px] text-gray-400 mt-1">Units based on Stock Unit</p>
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
                <p className="text-[10px] text-gray-400 mt-1">Cost per Stock Unit (for BOM calculations)</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mapped Suppliers (At least one required) *
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-3 border rounded-xl bg-gray-50">
                {[...suppliers].sort((a: any, b: any) => getFlagPriority(a.flag_category) - getFlagPriority(b.flag_category)).map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedSupplierIds.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSupplierIds([
                            ...selectedSupplierIds,
                            s.id,
                          ]);
                        } else {
                          setSelectedSupplierIds(
                            selectedSupplierIds.filter((id) => id !== s.id),
                          );
                        }
                      }}
                      className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 flex-shrink-0"
                    />
                    <div className="text-sm text-gray-700 min-w-0 flex-1">
                      {renderSupplierNameWithFlag(s)}
                    </div>
                  </label>
                ))}
              </div>
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
