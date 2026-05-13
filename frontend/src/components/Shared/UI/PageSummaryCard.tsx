import { ChevronDown, ChevronUp, Download, Printer } from "lucide-react";
import { useState } from "react";

// ─── Page Summary Card ─────────────────────────────────────────────────────────
// A business-friendly summary paragraph shown at the top of each page.
// Provides natural-language overview of the current page state.

interface PageSummaryProps {
  /** The natural-language summary text (can include JSX) */
  children: React.ReactNode;
  /** Optional title override (defaults to "Summary") */
  title?: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Export actions */
  onDownloadCSV?: () => void;
  onPrint?: () => void;
  /** Whether to show the export section */
  showExport?: boolean;
}

export const PageSummaryCard: React.FC<PageSummaryProps> = ({
  children,
  title = "Summary",
  icon,
  onDownloadCSV,
  onPrint,
  showExport = true,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-gradient-to-r from-slate-50 to-cyan-50/30 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-cyan-600">{icon}</span>}
          <h3 className="text-sm font-bold text-slate-700">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {showExport && !collapsed && (onDownloadCSV || onPrint) && (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              {onDownloadCSV && (
                <button
                  onClick={onDownloadCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-cyan-300 transition-all active:scale-95"
                  title="Download CSV"
                >
                  <Download size={12} /> CSV
                </button>
              )}
              {onPrint && (
                <button
                  onClick={onPrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-cyan-300 transition-all active:scale-95"
                  title="Print Report"
                >
                  <Printer size={12} /> Print
                </button>
              )}
            </div>
          )}
          {collapsed ? (
            <ChevronDown size={16} className="text-slate-400" />
          ) : (
            <ChevronUp size={16} className="text-slate-400" />
          )}
        </div>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="px-5 pb-4 pt-0">
          <p className="text-sm text-slate-600 leading-relaxed">{children}</p>
        </div>
      )}
    </div>
  );
};

// ─── Stat Breakdown Tooltip ──────────────────────────────────────────────────
// Shows "Where does this number come from?" breakdown on hover/click.

interface BreakdownItem {
  label: string;
  value: string | number;
  color?: string;
}

interface StatBreakdownProps {
  items: BreakdownItem[];
  /** Optional title for the breakdown */
  title?: string;
}

export const StatBreakdown: React.FC<StatBreakdownProps> = ({
  items,
  title = "Breakdown",
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-[10px] text-cyan-500 hover:text-cyan-700 font-semibold underline underline-offset-2 decoration-dotted cursor-pointer transition-colors"
      >
        View breakdown
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between">
              {title}
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </h4>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    {item.color && (
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    <span className="text-slate-500">{item.label}</span>
                  </div>
                  <span className="font-bold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PageSummaryCard;
