import { useState } from "react";
import { PenTool, Search, TrendingUp, Package, AlertCircle, Trophy, Eye, ChevronDown, X, User, PackageIcon } from "lucide-react";
import { useDashboardData } from "../../hooks/useSupabase";

const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("This Month");
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: liveData, loading: dashLoading } = useDashboardData();

  const periods = ["This Month", "Last Month", "Last 3 Months", "This Year"];

  // ── Live metrics from API ──────────────────────────────────────────────
  const os = liveData?.orderStats;
  const inv = liveData?.inventoryStats;

  const metrics = {
    totalRevenue: os?.totalRevenue || 0,
    revenueChange: "+0%",
    completedOrders: os?.completed || 0,
    ordersChange: `${os?.total || 0} total`,
    delayedPayments: os?.overdue || 0,
    paymentsChange: `${os?.unpaid || 0} unpaid`,
    topSellingProduct: "Tarpaulin",
    productChange: `${os?.inQueue || 0} in queue`,
  };

  // ── Live inventory snapshot ────────────────────────────────────────────
  const inventorySnapshot = (liveData?.lowStockItems || []).map(item => ({
    id: item.id,
    materialName: item.name,
    currentQty: item.currentQty,
    reorderLevel: item.reorderPoint,
    unit: item.unit,
    status: item.currentQty <= 0 ? "Low" : item.currentQty <= item.reorderPoint ? "Warning" : "Sufficient",
  }));

  // ── Live recent orders ─────────────────────────────────────────────────
  const recentOrders = (liveData?.recentOrders || []).map(o => ({
    id: o.orderId,
    product: o.product,
    materialsUsed: "—",
    remainingStock: "—",
  }));

  // ── Live top orders ────────────────────────────────────────────────────
  const topOrders = (liveData?.recentOrders || []).map(o => ({
    id: o.orderId,
    customer: o.customerName,
    amount: o.amount,
    status: o.status === "completed" ? "Paid" : o.status === "cancelled" ? "Unpaid" : "Partial",
    date: o.date,
  }));

  // ── Static chart data (no daily breakdown from API yet) ────────────────
  const dailySalesData = [
    { date: "Mar 1", revenue: 12500 }, { date: "Mar 3", revenue: 8300 },
    { date: "Mar 6", revenue: 15200 }, { date: "Mar 9", revenue: 9800 },
    { date: "Mar 12", revenue: 18500 }, { date: "Mar 15", revenue: 14200 },
    { date: "Mar 18", revenue: 22000 }, { date: "Mar 20", revenue: 16500 },
    { date: "Mar 22", revenue: 19800 }, { date: "Mar 25", revenue: 25000 },
  ];

  const productRevenue = [
    { category: "Tarpaulin", amount: 65000, percentage: 37, color: "#0ea5e9" },
    { category: "T-Shirts", amount: 48000, percentage: 27, color: "#8b5cf6" },
    { category: "ID Cards", amount: 25000, percentage: 14, color: "#f59e0b" },
    { category: "Documents", amount: 22000, percentage: 13, color: "#10b981" },
    { category: "Others", amount: 15000, percentage: 9, color: "#6b7280" },
  ];

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); };
  const handleViewOrder = (orderId: string) => { setSelectedOrderId(orderId); setShowOrderDetails(true); };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "bg-green-100 text-green-700";
      case "Unpaid": return "bg-red-100 text-red-700";
      case "Partial": return "bg-yellow-100 text-yellow-700";
      case "Low": return "text-red-600";
      case "Warning": return "text-yellow-600";
      case "Sufficient": return "text-green-600";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const maxRevenue = Math.max(...dailySalesData.map((d) => d.revenue));
  // ── FIXED: Use viewBox with numeric points instead of percentage strings ──
  const chartWidth = 800;
  const chartHeight = 200;

  if (dashLoading) return <div className="max-w-[1400px] mx-auto flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" /></div>;

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Order Details Modal */}
      {showOrderDetails && selectedOrderId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowOrderDetails(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowOrderDetails(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"><X size={24} className="text-gray-600" /></button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Details</h2>
            <p className="text-sm text-gray-500 mb-6">#{selectedOrderId}</p>
            {(() => {
              const order = topOrders.find(o => o.id === selectedOrderId);
              if (!order) return <p className="text-gray-500">Order not found in current view.</p>;
              return (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Customer:</span><span className="font-semibold">{order.customer}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Amount:</span><span className="font-semibold">₱{order.amount.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Status:</span><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>{order.status}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Date:</span><span className="font-semibold">{order.date}</span></div>
                  </div>
                  <p className="text-xs text-gray-400">Full order details available in the Orders tab.</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-sm text-gray-500">Monitor overall performance, sales trends, and inventory status</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search orders or customers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          </form>
          <div className="relative">
            <button onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white flex items-center gap-2 min-w-[150px]">
              <span>{selectedPeriod}</span><ChevronDown size={16} />
            </button>
            {showPeriodDropdown && (
              <><div className="fixed inset-0 z-10" onClick={() => setShowPeriodDropdown(false)} />
              <div className="absolute top-full mt-1 right-0 w-full bg-white border rounded-lg shadow-lg z-20">
                {periods.map(p => (<button key={p} onClick={() => { setSelectedPeriod(p); setShowPeriodDropdown(false); }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${selectedPeriod === p ? "bg-gray-50 font-semibold" : ""}`}>{p}</button>))}
              </div></>
            )}
          </div>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2"><p className="text-sm text-gray-600">Total Revenue</p><TrendingUp size={20} className="text-green-600" /></div>
          <p className="text-3xl font-bold text-gray-900 mb-1">₱{metrics.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-green-600 font-semibold">{metrics.revenueChange}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2"><p className="text-sm text-gray-600">Completed Orders</p><Package size={20} className="text-blue-600" /></div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{metrics.completedOrders}</p>
          <p className="text-xs text-blue-600 font-semibold">{metrics.ordersChange}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2"><p className="text-sm text-gray-600">Overdue Orders</p><AlertCircle size={20} className="text-red-600" /></div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{metrics.delayedPayments}</p>
          <p className="text-xs text-red-600 font-semibold">{metrics.paymentsChange}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2"><p className="text-sm text-gray-600">Inventory Status</p><Trophy size={20} className="text-yellow-600" /></div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{inv?.total || 0}</p>
          <p className="text-xs font-semibold" style={{color: (inv?.lowStock || 0) > 0 ? '#dc2626' : '#16a34a'}}>{inv?.lowStock || 0} low stock, {inv?.available || 0} available</p>
        </div>
      </div>

      {/* Daily Sales Chart — FIXED polyline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900">Daily Sales Performance</h3>
          <p className="text-xs text-gray-500">Revenue trend (sample data — will connect to live when daily tracking is available)</p>
        </div>
        <div className="relative" style={{ height: `${chartHeight}px` }}>
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
            <span>₱{(maxRevenue / 1000).toFixed(0)}k</span>
            <span>₱{((maxRevenue * 0.5) / 1000).toFixed(0)}k</span>
            <span>₱0k</span>
          </div>
          <div className="absolute left-14 right-0 top-0 bottom-8">
            {/* FIXED: Use viewBox with numeric coords instead of % strings */}
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" width="100%" height="100%" className="overflow-visible">
              {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
                <line key={`h-${i}`} x1="0" y1={f * chartHeight} x2={chartWidth} y2={f * chartHeight} stroke="#e5e7eb" strokeWidth="1" />
              ))}
              <polyline
                fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinejoin="round"
                points={dailySalesData.map((d, i) => {
                  const x = (i / (dailySalesData.length - 1)) * chartWidth;
                  const y = ((maxRevenue - d.revenue) / maxRevenue) * chartHeight;
                  return `${x},${y}`;
                }).join(" ")}
              />
              {dailySalesData.map((d, i) => {
                const x = (i / (dailySalesData.length - 1)) * chartWidth;
                const y = ((maxRevenue - d.revenue) / maxRevenue) * chartHeight;
                return <circle key={i} cx={x} cy={y} r="4" fill="#0ea5e9" />;
              })}
            </svg>
          </div>
          <div className="absolute left-14 right-0 bottom-0 h-8 flex justify-between text-xs text-gray-500">
            {dailySalesData.filter((_, i) => i % 2 === 0).map((d, i) => (<span key={i}>{d.date}</span>))}
          </div>
        </div>
      </div>

      {/* Revenue Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by Product Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4"><h3 className="text-lg font-bold text-gray-900">Revenue by Product Type</h3><p className="text-xs text-gray-500">Distribution across categories</p></div>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {(() => {
                  let cum = 0;
                  return productRevenue.map((item, i) => {
                    const start = (cum * 360) / 100;
                    const end = ((cum + item.percentage) * 360) / 100;
                    cum += item.percentage;
                    const sr = (start * Math.PI) / 180; const er = (end * Math.PI) / 180;
                    const x1 = 50 + 40 * Math.cos(sr); const y1 = 50 + 40 * Math.sin(sr);
                    const x2 = 50 + 40 * Math.cos(er); const y2 = 50 + 40 * Math.sin(er);
                    return <path key={i} d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${item.percentage > 50 ? 1 : 0} 1 ${x2} ${y2} Z`} fill={item.color} />;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-gray-900">{productRevenue.length}</p>
                <p className="text-xs text-gray-500">Categories</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {productRevenue.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-sm text-gray-700">{item.category}</span></div>
                <span className="text-sm font-semibold text-gray-900">₱{(item.amount / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-lg font-bold text-gray-900">₱{(os?.totalRevenue ? (os.totalRevenue / 1000).toFixed(0) : "0")}k</p>
            <p className="text-xs text-gray-500">Total Revenue (from orders)</p>
          </div>
        </div>

        {/* Top Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4"><h3 className="text-lg font-bold text-gray-900">Recent Orders</h3><p className="text-xs text-gray-500">Latest orders from the system</p></div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Customer</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Amount</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">Status</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">Date</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">Action</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {topOrders.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No recent orders</td></tr>
                ) : topOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2"><p className="font-semibold text-gray-900">{order.customer}</p><p className="text-gray-500 text-[10px]">{order.id}</p></td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900">₱{order.amount.toLocaleString()}</td>
                    <td className="px-3 py-2 text-center"><span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${getStatusColor(order.status)}`}>{order.status}</span></td>
                    <td className="px-3 py-2 text-center text-gray-600">{order.date}</td>
                    <td className="px-3 py-2 text-center"><button onClick={() => handleViewOrder(order.id)} className="p-1 hover:bg-gray-200 rounded"><Eye size={14} className="text-gray-600" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inventory Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Snapshot — LIVE DATA */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4"><h3 className="text-lg font-bold text-gray-900">Inventory Alerts</h3><p className="text-xs text-gray-500">Materials at or below reorder point</p></div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Material</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">Current</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">Reorder At</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {inventorySnapshot.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-green-600 font-semibold">All materials above reorder levels</td></tr>
                ) : inventorySnapshot.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900">{item.materialName}</td>
                    <td className="px-3 py-2 text-center font-semibold text-gray-900">{item.currentQty} {item.unit}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{item.reorderLevel} {item.unit}</td>
                    <td className="px-3 py-2 text-center"><span className={`font-semibold ${getStatusColor(item.status)}`}>{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4"><h3 className="text-lg font-bold text-gray-900">Order Summary</h3><p className="text-xs text-gray-500">Current order pipeline breakdown</p></div>
          <div className="space-y-3">
            {[
              { label: "In Queue", value: os?.inQueue || 0, color: "bg-blue-500" },
              { label: "Designing", value: os?.designing || 0, color: "bg-purple-500" },
              { label: "In Production", value: os?.production || 0, color: "bg-orange-500" },
              { label: "Ready for Pickup", value: os?.pickup || 0, color: "bg-green-500" },
              { label: "Completed", value: os?.completed || 0, color: "bg-gray-400" },
              { label: "Overdue", value: os?.overdue || 0, color: "bg-red-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                <span className="text-sm font-bold text-gray-900">{item.value}</span>
                <div className="w-24 bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${os?.total ? (item.value / os.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between text-sm">
            <span className="text-gray-600">Total Collected:</span>
            <span className="font-bold text-green-600">₱{(os?.totalCollected || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;