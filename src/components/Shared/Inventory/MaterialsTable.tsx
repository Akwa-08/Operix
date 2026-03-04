import { Eye, Edit2, Trash2 } from 'lucide-react';
import type { Material, UserRole } from "../../../Types";
import { permissions } from "../../../util/permissions";

interface MaterialsTableProps {
  materials: Material[];
  userRole: UserRole;
  onView: (material: Material) => void;
  onEdit: (material: Material) => void;
  onDelete?: (material: Material) => void;
  searchQuery?: string;
}

export const MaterialsTable: React.FC<MaterialsTableProps> = ({
  materials,
  userRole,
  onView,
  onEdit,
  onDelete,
  searchQuery = '',
}) => {
  const perms = permissions[userRole].inventory;

  const filteredMaterials = materials.filter((material) =>
    material.itemType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.itemVariant.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'text-green-600';
      case 'Low Stock':
        return 'text-yellow-600';
      case 'Restocking':
        return 'text-blue-600';
      case 'Phased Out':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Item Type
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Item Variant
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Usable Stocks
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Stock Unit
              </th>
              {perms.canViewAll && (
                <>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    Purchase QTY
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    Purchase Unit
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Supplier
                  </th>
                </>
              )}
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Status
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredMaterials.map((material) => (
              <tr key={material.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{material.itemType}</td>
                <td className="px-4 py-3 text-gray-900">{material.itemVariant}</td>
                <td className="px-4 py-3 text-center font-semibold text-gray-900">
                  {material.usableStocks}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">
                  {material.stockUnit}
                </td>
                {perms.canViewAll && (
                  <>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {material.purchaseQty}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {material.purchaseUnit}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{material.supplier}</td>
                  </>
                )}
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${getStatusColor(material.status)}`}>
                    {material.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onView(material)}
                      className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye size={18} className="text-gray-600" />
                    </button>
                    {(perms.canEditAllFields || perms.canEditStock) && (
                      <button
                        onClick={() => onEdit(material)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} className="text-gray-600" />
                      </button>
                    )}
                    {perms.canDelete && onDelete && (
                      <button
                        onClick={() => onDelete(material)}
                        className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
