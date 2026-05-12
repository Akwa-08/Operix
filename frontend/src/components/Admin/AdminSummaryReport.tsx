import { X, Printer, FileText, TrendingUp, Package, Users, Activity } from "lucide-react";
import { useDashboardData } from "../../hooks/useSupabase";
import { fmtMoney } from "../../util/formatters";
import { LoadingSpinner } from "../Shared/UI/LoadingSpinner";

interface AdminSummaryReportProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSummaryReport = ({ isOpen, onClose }: AdminSummaryReportProps) => {
  const { data, loading } = useDashboardData();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-10 flex justify-center">
          <LoadingSpinner message="Generating report..." />
        </div>
      </div>
    );
  }

  const { orderStats, inventoryStats, lowStockItems, recentOrders } = data || {};
  const dateStr = new Date().toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "numeric"
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm print:bg-white print:p-0">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200 print:shadow-none print:max-h-none print:h-auto overflow-hidden">
        
        {/* Modal Header (Hidden on Print) */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Admin Summary Report</h2>
              <p className="text-sm text-gray-500 mt-0.5">Comprehensive overview of system data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-xl font-bold text-sm transition-colors"
            >
              <Printer size={16} /> Print Report
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-auto p-8 print:p-0 bg-gray-50/30">
          
          {/* Printable Header */}
          <div className="text-center mb-8 pb-8 border-b-2 border-gray-100">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">OPERIX SYSTEM REPORT</h1>
            <p className="text-gray-500 font-medium mt-2">Generated on {dateStr}</p>
          </div>

          <div className="space-y-8 max-w-3xl mx-auto">
            
            {/* Financial Summary */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-[#E80088]" />
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-widest">Financial Overview</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total Revenue</p>
                  <p className="text-2xl font-black text-gray-900">{fmtMoney(orderStats?.totalRevenue || 0)}</p>
                </div>
                <div className="p-4 bg-white border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Material Cost</p>
                  <p className="text-2xl font-black text-orange-600">{fmtMoney(orderStats?.totalMaterialCost || 0)}</p>
                </div>
                <div className="p-4 bg-white border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Gross Profit</p>
                  <p className="text-2xl font-black text-green-600">{fmtMoney(orderStats?.totalProfit || 0)}</p>
                </div>
                <div className="p-4 bg-white border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Collected</p>
                  <p className="text-2xl font-black text-blue-600">{fmtMoney(orderStats?.totalCollected || 0)}</p>
                </div>
                <div className="p-4 bg-white border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Outstanding</p>
                  <p className="text-2xl font-black text-amber-600">{fmtMoney(Math.max(0, (orderStats?.totalRevenue || 0) - (orderStats?.totalCollected || 0)))}</p>
                </div>
                <div className="p-4 bg-white border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Profit Margin</p>
                  <p className="text-2xl font-black text-purple-600">
                    {orderStats?.totalRevenue ? Math.round((orderStats.totalProfit / orderStats.totalRevenue) * 100) : 0}%
                  </p>
                </div>
              </div>
            </section>

            {/* Orders Summary */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Package size={18} className="text-cyan-600" />
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-widest">Orders Pipeline</h3>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { label: "Total", val: orderStats?.total },
                  { label: "In Queue", val: orderStats?.inQueue },
                  { label: "Designing", val: orderStats?.designing },
                  { label: "Production", val: orderStats?.production },
                  { label: "Ready", val: orderStats?.readyPickup },
                  { label: "Completed", val: orderStats?.completed },
                ].map((s, i) => (
                  <div key={i} className="p-3 bg-white border border-gray-200 rounded-xl text-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">{s.label}</p>
                    <p className="text-xl font-black text-gray-900">{s.val || 0}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Inventory Status */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Activity size={18} className="text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-widest">Inventory Status</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                 <div className="p-4 bg-white border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total Items</p>
                  <p className="text-2xl font-black text-gray-900">{inventoryStats?.total || 0}</p>
                </div>
                <div className="p-4 bg-white border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Healthy</p>
                  <p className="text-2xl font-black text-green-600">{inventoryStats?.available || 0}</p>
                </div>
                <div className="p-4 bg-white border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Low Stock</p>
                  <p className="text-2xl font-black text-amber-600">{inventoryStats?.lowStock || 0}</p>
                </div>
                <div className="p-4 bg-white border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Out of Stock</p>
                  <p className="text-2xl font-black text-red-600">{inventoryStats?.restocking || 0}</p>
                </div>
              </div>

              {lowStockItems && lowStockItems.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-amber-900 mb-3 uppercase">Items Needing Restock</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {lowStockItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm border-b border-amber-100 pb-1">
                        <span className="font-semibold text-amber-800 truncate pr-2">{item.name}</span>
                        <span className="text-amber-900 font-black whitespace-nowrap">
                          {item.currentQty} <span className="text-xs text-amber-700 font-normal">{item.unit}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:bg-white, .print\\:bg-white * { visibility: visible; }
          .print\\:bg-white { position: absolute; left: 0; top: 0; width: 100%; height: auto; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};
