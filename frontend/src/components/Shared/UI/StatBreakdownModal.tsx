import { X, Package } from "lucide-react";
import { fmtMoney } from "../../../util/formatters";
import { getOrderStatusColor } from "../../../util/formatters";

// ── Types ────────────────────────────────────────────────────────────────────
export interface BreakdownItem {
  id: string;
  label: string;       // e.g. order number or material name
  sublabel?: string;   // e.g. customer name
  detail?: string;     // e.g. product type
  amount?: number;     // e.g. total_amount
  paid?: number;       // e.g. amount_paid
  status?: string;     // e.g. "In Queue"
  date?: string;       // formatted date string
  badge?: string;
  badgeColor?: string;
}

interface StatBreakdownModalProps {
  title: string;
  subtitle?: string;
  items: BreakdownItem[];
  isMoney?: boolean;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const StatBreakdownModal: React.FC<StatBreakdownModalProps> = ({
  title, subtitle, items, isMoney = true, onClose,
}) => {
  const total = items.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:rounded-2xl shadow-2xl max-w-lg rounded-t-2xl max-h-[88vh] sm:max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl ml-2 flex-shrink-0 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Summary bar */}
        <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">
            {items.length} record{items.length !== 1 ? "s" : ""}
          </span>
          {isMoney && (
            <span className="text-base font-bold text-gray-900">{fmtMoney(total)}</span>
          )}
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Package size={36} className="opacity-30 mb-2" />
              <p className="text-sm font-medium">No records in this category</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {items.map((item, i) => (
                <li key={item.id || i} className="px-5 py-3.5 hover:bg-gray-50/80 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-bold text-gray-900 truncate">{item.label}</p>
                        {item.status && (
                          <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${getOrderStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        )}
                        {item.badge && (
                          <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${item.badgeColor || "bg-gray-100 text-gray-600"}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.sublabel && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{item.sublabel}</p>
                      )}
                      {item.detail && (
                        <p className="text-xs text-gray-400 truncate">{item.detail}</p>
                      )}
                      {item.date && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.date}</p>
                      )}
                    </div>
                    {item.amount !== undefined && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">{fmtMoney(item.amount)}</p>
                        {item.paid !== undefined && item.paid < item.amount && (
                          <p className="text-xs text-orange-500 font-medium">
                            Paid: {fmtMoney(item.paid)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
