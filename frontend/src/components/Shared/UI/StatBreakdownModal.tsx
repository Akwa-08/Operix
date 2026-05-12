import React from "react";
import { X, Search } from "lucide-react";

interface SummaryItem {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
  subValue?: string;
}

interface StatBreakdownModalProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  data: T[];
  columns: Column<T>[];
  icon?: React.ReactNode;
  summary?: SummaryItem[];
}

export function StatBreakdownModal<T>({
  isOpen,
  onClose,
  title,
  description,
  data,
  columns,
  icon,
  summary
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300 overflow-hidden border border-gray-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {icon && (
              <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl shadow-sm border border-cyan-100/50">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
              {description && (
                <p className="text-sm text-gray-500 mt-1 font-medium">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-all active:scale-95"
          >
            <X size={24} />
          </button>
        </div>

        {/* Summary Header (Scalable breakdown) */}
        {summary && summary.length > 0 && (
          <div className="p-6 bg-gray-50/50 border-b border-gray-100">
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(summary.length, 4)} gap-4`}>
              {summary.map((item, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1 transition-transform hover:scale-[1.02] duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                    {item.icon && <div className={item.color || "text-gray-400"}>{item.icon}</div>}
                  </div>
                  <div className="text-2xl font-black text-gray-900">{item.value}</div>
                  {item.subValue && <div className="text-[10px] font-bold text-gray-500 uppercase">{item.subValue}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 bg-gray-50/30 transition-all"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-2xl border border-gray-200/50">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-600">
              {filteredData.length} Record{filteredData.length !== 1 && 's'} Found
            </span>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto bg-white custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-md z-10">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`px-6 py-4 text-[11px] font-black text-gray-500 uppercase tracking-[0.1em] border-b border-gray-100 ${col.width || ""}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-gray-50 rounded-full text-gray-300">
                        <Search size={32} />
                      </div>
                      <p className="text-gray-500 font-bold">No records matching your search</p>
                      <button 
                        onClick={() => setSearch("")}
                        className="text-cyan-600 text-sm font-bold hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={idx} className="group hover:bg-cyan-50/30 transition-colors">
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="px-6 py-4 text-sm text-gray-700 font-medium">
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
