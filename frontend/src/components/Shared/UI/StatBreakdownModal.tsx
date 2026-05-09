import React from "react";
import { X, Search } from "lucide-react";

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  width?: string;
}

interface StatBreakdownModalProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  data: T[];
  columns: Column<T>[];
  icon?: React.ReactNode;
}

export function StatBreakdownModal<T>({
  isOpen,
  onClose,
  title,
  description,
  data,
  columns,
  icon
}: StatBreakdownModalProps<T>) {
  const [search, setSearch] = React.useState("");

  if (!isOpen) return null;

  const filteredData = data.filter((item) => {
    if (!search) return true;
    const term = search.toLowerCase();
    // Simple deep search on object values
    return Object.values(item as any).some((val) =>
      String(val).toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              {description && (
                <p className="text-sm text-gray-500 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            />
          </div>
          <div className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
            {filteredData.length} Record{filteredData.length !== 1 && 's'}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider ${col.width || ""}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center text-gray-500 font-medium">
                    No records found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="px-5 py-3.5 text-sm text-gray-700">
                        {col.accessor(item)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
