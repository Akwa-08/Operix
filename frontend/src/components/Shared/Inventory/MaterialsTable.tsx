import { useEffect, useRef } from 'react';
import { Eye, Edit2, Trash2, Users } from 'lucide-react';
import type { Material, UserRole } from "../../../Types";
import { permissions } from "../../../util/permissions";
import { getMaterialStatusColor } from "../../../util/formatters";

interface MaterialsTableProps {
  materials: Material[];
  userRole: UserRole;
  onView: (material: Material) => void;
  onEdit: (material: Material) => void;
  onDelete?: (material: Material) => void;
  onManageSuppliers?: (material: Material) => void;
  searchQuery?: string;
  statusFilter?: string;
  highlightedId?: string | null;
}

const statusColor = getMaterialStatusColor;

export const MaterialsTable: React.FC<MaterialsTableProps> = ({
  materials, userRole, onView, onEdit, onDelete, onManageSuppliers, searchQuery = '', statusFilter = 'All', highlightedId
}) => {
  const perms = permissions[userRole].inventory;
  const highlightedRef = useRef<HTMLDivElement | HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (highlightedId && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedId]);

  const filtered = materials.filter((m) => {
    const matchesSearch =
      m.itemType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.itemVariant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.status.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || m.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  if (filtered.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center text-gray-400 text-base">
        No materials found
      </div>
    );
  }

  const ActionBtns = ({ m }: { m: Material }) => (
    <div className="flex items-center gap-1 flex-wrap">
      <button
        onClick={() => onView(m)}
        className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-200 rounded-lg text-xs text-gray-700 font-semibold">
        <Eye size={14} /> View
      </button>
      {(perms.canEditAllFields || perms.canEditStock) && (
        <button
          onClick={() => onEdit(m)}
          className="flex items-center gap-1 px-2 py-1.5 hover:bg-cyan-100 rounded-lg text-xs text-cyan-700 font-semibold">
          <Edit2 size={14} /> Edit
        </button>
      )}
      {userRole === "admin" && onManageSuppliers && (
        <button
          onClick={() => onManageSuppliers(m)}
          className="flex items-center gap-1 px-2 py-1.5 hover:bg-blue-100 rounded-lg text-xs text-blue-700 font-semibold whitespace-nowrap">
          <Users size={14} /> Suppliers
        </button>
      )}
      {perms.canDelete && onDelete && m.status.toLowerCase() !== "phased out" && (
        <button
          onClick={() => onDelete(m)}
          className="flex items-center gap-1 px-2 py-1.5 hover:bg-red-100 rounded-lg text-xs text-red-700 font-semibold whitespace-nowrap">
          <Trash2 size={14} /> Phase out
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* ── MOBILE CARD VIEW ─────────────────────────────────────────────── */}
      <div className="md:hidden divide-y divide-gray-100">
        {filtered.map((m) => (
          <div 
            key={m.id} 
            ref={highlightedId === m.id ? (el) => { (highlightedRef as any).current = el; } : null}
            className={`p-4 space-y-2 transition-all ${highlightedId === m.id ? "highlight-pulse ring-2 ring-cyan-500" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-gray-900 text-base">{m.itemType}</p>
                {m.itemVariant && <p className="text-sm text-gray-500">{m.itemVariant}</p>}
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full border whitespace-nowrap ${statusColor(m.status)}`}>
                {m.status}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div><span className="text-gray-400">Stock:</span> <span className="font-semibold text-gray-900">{m.usableStocks} {m.stockUnit}</span></div>
              <div><span className="text-gray-400">Reorder at:</span> <span className="font-medium text-gray-700">{m.reorderPoint}</span></div>
              {perms.canViewAll && (
                <>
                  <div><span className="text-gray-400">Conversion:</span> <span className="font-medium text-gray-700">1 {m.purchaseUnit} = {m.purchaseQty} {m.stockUnit}</span></div>
                  <div><span className="text-gray-400">Supplier:</span> <span className="font-medium text-gray-700">{m.supplier || '—'}</span></div>
                </>
              )}
            </div>
            <ActionBtns m={m} />
          </div>
        ))}
      </div>

      {/* ── DESKTOP TABLE ─────────────────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <div className="overflow-x-auto w-full">
<table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Item Type</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Stocks</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Unit</th>
              {perms.canViewAll && (
                <>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Conversion</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Supplier</th>
                </>
              )}
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((m) => (
              <tr 
                key={m.id} 
                ref={highlightedId === m.id ? (el) => { (highlightedRef as any).current = el; } : null}
                className={`hover:bg-gray-50 transition-all ${highlightedId === m.id ? "highlight-pulse bg-cyan-50/50" : ""}`}
              >
                <td className="px-4 py-3 text-gray-900 font-medium">{m.itemType}</td>
                <td className="px-4 py-3 text-gray-600">{m.itemVariant || '—'}</td>
                <td className="px-4 py-3 text-center font-semibold text-gray-900">{m.usableStocks}</td>
                <td className="px-4 py-3 text-center text-gray-600">{m.stockUnit}</td>
                {perms.canViewAll && (
                  <>
                    <td className="px-4 py-3 text-center text-gray-600 whitespace-nowrap">1 {m.purchaseUnit} = {m.purchaseQty} {m.stockUnit}</td>
                    <td className="px-4 py-3 text-gray-700">{m.supplier || '—'}</td>
                  </>
                )}
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border whitespace-nowrap ${statusColor(m.status)}`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3"><ActionBtns m={m} /></td>
              </tr>
            ))}
          </tbody>
        </table>
</div>
      </div>
    </div>
  );
};
