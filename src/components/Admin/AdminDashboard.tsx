import { useState } from "react";
import { PenTool } from "lucide-react";
import {
  Search,
  TrendingUp,
  Package,
  AlertCircle,
  Trophy,
  Eye,
  ChevronDown,
  X,
  User,
  PackageIcon,
} from "lucide-react";

// Types for backend integration
interface RevenueData {
  date: string;
  revenue: number;
}

interface ProductRevenue {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface TopOrder {
  id: string;
  customer: string;
  productType: string;
  amount: number;
  status: "Paid" | "Unpaid" | "Partial";
  date: string;
}

interface InventoryItem {
  id: string;
  materialName: string;
  currentQty: number;
  reorderLevel: number;
  unit: string;
  status: "Low" | "Sufficient" | "Warning";
}

interface RecentOrder {
  id: string;
  product: string;
  materialsUsed: string;
  remainingStock: string;
}

interface OrderDetails {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  product: {
    name: string;
    quantity: number;
    totalAmount: number;
    status: "Paid" | "Unpaid" | "Partial";
  };
  assignedStaff: {
    designer: string;
    production: string;
  };
  specialInstructions: string;
  design: {
    customerDesign: string;
    finalDesignPath: string;
    finalDesignPreview: string;
  };
}

const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("This Month");
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetails | null>(null);

  const periods = ["This Month", "Last Month", "Last 3 Months", "This Year"];

  // DUMMY DATA - Replace with API calls
  const metrics = {
    totalRevenue: 175000.0,
    revenueChange: "+12.5%",
    completedOrders: 147,
    ordersChange: "+8.2%",
    delayedPayments: 12,
    paymentsChange: "-3.1%",
    topSellingProduct: "Tarpaulin",
    productChange: "+88 units",
  };

  const dailySalesData: RevenueData[] = [
    { date: "Dec 1", revenue: 5800 },
    { date: "Dec 2", revenue: 6200 },
    { date: "Dec 3", revenue: 5900 },
    { date: "Dec 4", revenue: 7100 },
    { date: "Dec 5", revenue: 6800 },
    { date: "Dec 6", revenue: 7500 },
    { date: "Dec 7", revenue: 6900 },
    { date: "Dec 8", revenue: 7200 },
    { date: "Dec 9", revenue: 6500 },
    { date: "Dec 10", revenue: 7800 },
    { date: "Dec 12", revenue: 6300 },
    { date: "Dec 13", revenue: 6900 },
    { date: "Dec 14", revenue: 7400 },
    { date: "Dec 16", revenue: 6800 },
    { date: "Dec 18", revenue: 7200 },
    { date: "Dec 20", revenue: 8100 },
    { date: "Dec 22", revenue: 7600 },
    { date: "Dec 24", revenue: 5900 },
    { date: "Dec 26", revenue: 7300 },
    { date: "Dec 28", revenue: 8200 },
    { date: "Dec 30", revenue: 7800 },
  ];

  const productRevenue: ProductRevenue[] = [
    { category: "Tarpaulin", amount: 70000, percentage: 40, color: "#60A5FA" },
    { category: "Stickers", amount: 43750, percentage: 25, color: "#34D399" },
    { category: "Office Prints", amount: 35000, percentage: 20, color: "#FBBF24" },
    { category: "Lamination", amount: 17500, percentage: 10, color: "#C084FC" },
    { category: "ID Printing", amount: 8750, percentage: 5, color: "#F87171" },
  ];

  const topOrders: TopOrder[] = [
    {
      id: "ORD-001",
      customer: "ABC Marketing Corps",
      productType: "Tarpaulin",
      amount: 15600,
      status: "Paid",
      date: "Dec 28, 2024",
    },
    {
      id: "ORD-002",
      customer: "Tech Solutions Inc",
      productType: "Digital Prints",
      amount: 12500,
      status: "Paid",
      date: "Dec 27, 2024",
    },
    {
      id: "ORD-003",
      customer: "Local Restaurant",
      productType: "Stickers",
      amount: 9900,
      status: "Partial",
      date: "Dec 26, 2024",
    },
    {
      id: "ORD-004",
      customer: "Event Organizers Ltd",
      productType: "Tarpaulin",
      amount: 18500,
      status: "Unpaid",
      date: "Dec 25, 2024",
    },
    {
      id: "ORD-005",
      customer: "Design Studio Pro",
      productType: "Lamination",
      amount: 7200,
      status: "Paid",
      date: "Dec 24, 2024",
    },
    {
      id: "ORD-006",
      customer: "University Campus",
      productType: "ID Printing",
      amount: 9800,
      status: "Partial",
      date: "Dec 23, 2024",
    },
    {
      id: "ORD-007",
      customer: "Retail Chain Store",
      productType: "Digital Prints",
      amount: 11200,
      status: "Paid",
      date: "Dec 22, 2024",
    },
  ];

  const inventorySnapshot: InventoryItem[] = [
    {
      id: "INV001",
      materialName: "Tarpaulin (Roll)",
      currentQty: 5,
      reorderLevel: 10,
      unit: "rolls",
      status: "Low",
    },
    {
      id: "INV002",
      materialName: "Sticker Sheets",
      currentQty: 250,
      reorderLevel: 200,
      unit: "sheets",
      status: "Sufficient",
    },
    {
      id: "INV003",
      materialName: "Digital Paper A4",
      currentQty: 150,
      reorderLevel: 100,
      unit: "sheets",
      status: "Sufficient",
    },
    {
      id: "INV004",
      materialName: "Ink Cartridges (Black)",
      currentQty: 2,
      reorderLevel: 5,
      unit: "bottles",
      status: "Low",
    },
    {
      id: "INV005",
      materialName: "Lamination Film",
      currentQty: 85,
      reorderLevel: 50,
      unit: "meters",
      status: "Sufficient",
    },
    {
      id: "INV006",
      materialName: "Vinyl Sheets",
      currentQty: 30,
      reorderLevel: 40,
      unit: "sheets",
      status: "Warning",
    },
  ];

  const recentOrders: RecentOrder[] = [
    {
      id: "RO001",
      product: "Poster Print",
      materialsUsed: "Tarpaulin, Ink",
      remainingStock: "5 rolls, 2 bottles",
    },
    {
      id: "RO002",
      product: "Sticker Labels",
      materialsUsed: "Vinyl, Adhesive",
      remainingStock: "250 sheets, 5 liters",
    },
    {
      id: "RO003",
      product: "Business Cards",
      materialsUsed: "Digital Paper, Ink",
      remainingStock: "120 sheets, 2 bottles",
    },
    {
      id: "RO004",
      product: "Banner Print",
      materialsUsed: "Tarpaulin, Ink",
      remainingStock: "4 rolls, 1 bottle",
    },
    {
      id: "RO005",
      product: "ID Lamination",
      materialsUsed: "Lamination Film",
      remainingStock: "75 meters",
    },
  ];

  // Order details data - would come from API
  const getOrderDetails = (orderId: string): OrderDetails => {
    return {
      id: orderId,
      customer: {
        name: "John Doe",
        email: "johndoe@gmail.com",
        phone: "09XX XXX XXXX",
      },
      product: {
        name: "Tarpaulin",
        quantity: 1000,
        totalAmount: 10000.0,
        status: "Unpaid",
      },
      assignedStaff: {
        designer: "Not assigned",
        production: "Not assigned",
      },
      specialInstructions:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum mollis blandit tellus, non semper magna scelerisque eu. Mauris ac efficitur nibh.",
      design: {
        customerDesign: "/designs/customer-design.png",
        finalDesignPath: "C:/Sample/Path/Path/Folder/File",
        finalDesignPreview: "/designs/final-preview.png",
      },
    };
  };

  // Handler functions - Ready for backend
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
    // TODO: API call to search orders/customers
  };

  const handleViewOrder = (orderId: string) => {
    console.log("View order:", orderId);
    // TODO: Fetch order details from API
    const orderDetails = getOrderDetails(orderId);
    setSelectedOrderDetails(orderDetails);
    setShowOrderDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700";
      case "Unpaid":
        return "bg-red-100 text-red-700";
      case "Partial":
        return "bg-yellow-100 text-yellow-700";
      case "Low":
        return "text-red-600";
      case "Warning":
        return "text-yellow-600";
      case "Sufficient":
        return "text-green-600";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const maxRevenue = Math.max(...dailySalesData.map((d) => d.revenue));
  const chartHeight = 200;

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Order Details Modal */}
      {showOrderDetails && selectedOrderDetails && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowOrderDetails(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order Details
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    #{selectedOrderDetails.id}
                  </p>
                </div>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Customer Info and Product Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User size={20} className="text-gray-700" />
                    <h3 className="text-lg font-bold text-gray-900">
                      Customer Information
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Name</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedOrderDetails.customer.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Email</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedOrderDetails.customer.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Phone</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedOrderDetails.customer.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <PackageIcon size={20} className="text-gray-700" />
                    <h3 className="text-lg font-bold text-gray-900">
                      Product Information
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Product</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedOrderDetails.product.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Quantity</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedOrderDetails.product.quantity} pcs
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-red-600">
                          ₱{selectedOrderDetails.product.totalAmount.toLocaleString()}
                        </p>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            selectedOrderDetails.product.status
                          )}`}
                        >
                          {selectedOrderDetails.product.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Staff */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Assigned Staff
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Designer</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedOrderDetails.assignedStaff.designer}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Production</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedOrderDetails.assignedStaff.production}
                    </p>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Special Instructions
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedOrderDetails.specialInstructions}
                </p>
              </div>

              {/* Design Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-gray-700" /> Design
                  </h3>

                {/* Customer Design */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Customer Design
                  </p>
                  <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                    <p className="text-gray-500">Design Preview</p>
                  </div>
                </div>

                {/* Final Design Path */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Final Design Path
                  </p>
                  <p className="text-sm text-gray-900 font-mono bg-white px-4 py-2 rounded border border-gray-300">
                    {selectedOrderDetails.design.finalDesignPath}
                  </p>
                </div>

                {/* Final Design Preview */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Final Design Preview
                  </p>
                  <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                    <p className="text-gray-500">Final Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Monitor overall performance, sales trends, and inventory status in real time
        </p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search orders or customers by name, order ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </form>

          {/* Period Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white flex items-center gap-2 min-w-[150px]"
            >
              <span>{selectedPeriod}</span>
              <ChevronDown size={16} />
            </button>
            {showPeriodDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowPeriodDropdown(false)}
                />
                <div className="absolute top-full mt-1 right-0 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-20 overflow-hidden">
                  {periods.map((period) => (
                    <button
                      key={period}
                      onClick={() => {
                        setSelectedPeriod(period);
                        setShowPeriodDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                        selectedPeriod === period ? "bg-gray-50 font-semibold" : ""
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            ₱{metrics.totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 font-semibold">
            {metrics.revenueChange} vs last month
          </p>
        </div>

        {/* Completed Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Completed Orders</p>
            <Package size={20} className="text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {metrics.completedOrders}
          </p>
          <p className="text-xs text-green-600 font-semibold">
            {metrics.ordersChange} vs last month
          </p>
        </div>

        {/* Delayed Payments */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Delayed Payments</p>
            <AlertCircle size={20} className="text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {metrics.delayedPayments}
          </p>
          <p className="text-xs text-red-600 font-semibold">
            {metrics.paymentsChange} vs last month
          </p>
        </div>

        {/* Top-Selling Product */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Top-Selling Product</p>
            <Trophy size={20} className="text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {metrics.topSellingProduct}
          </p>
          <p className="text-xs text-green-600 font-semibold">
            {metrics.productChange} vs last month
          </p>
        </div>
      </div>

      {/* Daily Sales Performance Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            Daily Sales Performance
          </h3>
          <p className="text-xs text-gray-500">
            Revenue trend over the past 30 days
          </p>
        </div>

        {/* Simple Line Chart */}
        <div className="relative" style={{ height: `${chartHeight}px` }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
            <span>₱{(maxRevenue / 1000).toFixed(0)}k</span>
            <span>₱{((maxRevenue * 0.75) / 1000).toFixed(0)}k</span>
            <span>₱{((maxRevenue * 0.5) / 1000).toFixed(0)}k</span>
            <span>₱{((maxRevenue * 0.25) / 1000).toFixed(0)}k</span>
            <span>₱0k</span>
          </div>

          {/* Chart area */}
          <div className="absolute left-14 right-0 top-0 bottom-8">
            <svg width="100%" height="100%" className="overflow-visible">
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => (
                <line
                  key={`h-${i}`}
                  x1="0"
                  y1={`${fraction * 100}%`}
                  x2="100%"
                  y2={`${fraction * 100}%`}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="none"
                />
              ))}

              {/* Vertical grid lines */}
              {dailySalesData
                .filter((_, i) => i % 3 === 0)
                .map((_, i) => {
                  const x = (i * 3 / (dailySalesData.length - 1)) * 100;
                  return (
                    <line
                      key={`v-${i}`}
                      x1={`${x}%`}
                      y1="0"
                      x2={`${x}%`}
                      y2="100%"
                      stroke="#f3f4f6"
                      strokeWidth="1"
                      strokeDasharray="none"
                    />
                  );
                })}

              {/* Line path */}
              <polyline
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2"
                points={dailySalesData
                  .map((d, i) => {
                    const x = (i / (dailySalesData.length - 1)) * 100;
                    const y = ((maxRevenue - d.revenue) / maxRevenue) * 100;
                    return `${x}%,${y}%`;
                  })
                  .join(" ")}
              />

              {/* Data points */}
              {dailySalesData.map((d, i) => {
                const x = (i / (dailySalesData.length - 1)) * 100;
                const y = ((maxRevenue - d.revenue) / maxRevenue) * 100;
                return (
                  <circle
                    key={i}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="3"
                    fill="#0ea5e9"
                  />
                );
              })}
            </svg>
          </div>

          {/* X-axis labels */}
          <div className="absolute left-14 right-0 bottom-0 h-8 flex justify-between text-xs text-gray-500">
            {dailySalesData
              .filter((_, i) => i % 3 === 0)
              .map((d, i) => (
                <span key={i}>{d.date}</span>
              ))}
          </div>
        </div>
      </div>

      {/* Revenue Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by Product Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Revenue by Product Type
            </h3>
            <p className="text-xs text-gray-500">
              Distribution of revenue across product categories
            </p>
          </div>

          {/* Pie Chart */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {(() => {
                  let cumulativePercent = 0;
                  return productRevenue.map((item, i) => {
                    const startAngle = (cumulativePercent * 360) / 100;
                    const endAngle = ((cumulativePercent + item.percentage) * 360) / 100;
                    cumulativePercent += item.percentage;

                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;

                    const x1 = 50 + 40 * Math.cos(startRad);
                    const y1 = 50 + 40 * Math.sin(startRad);
                    const x2 = 50 + 40 * Math.cos(endRad);
                    const y2 = 50 + 40 * Math.sin(endRad);

                    const largeArc = item.percentage > 50 ? 1 : 0;

                    return (
                      <path
                        key={i}
                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={item.color}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-gray-900">5</p>
                <p className="text-xs text-gray-500">Product Types</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {productRevenue.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-700">{item.category}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ₱{(item.amount / 1000).toFixed(0)}k
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-lg font-bold text-gray-900">₱175k</p>
            <p className="text-xs text-gray-500">Total Revenue</p>
          </div>
        </div>

        {/* Top Orders by Revenue */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Top Orders by Revenue
            </h3>
            <p className="text-xs text-gray-500">
              Highest value orders from this month
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">
                    Product Type
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {order.customer}
                        </p>
                        <p className="text-gray-500 text-[10px]">{order.id}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900">
                      ₱{order.amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-semibold ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600">
                      {order.date}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleViewOrder(order.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye size={14} className="text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-xs text-gray-500">
              Showing top 7 orders • Total for orders: ₱93,100
            </p>
          </div>
        </div>
      </div>

      {/* Inventory Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Snapshot */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Inventory Snapshot
            </h3>
            <p className="text-xs text-gray-500">
              Current state of raw materials and stock
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">
                    Material Name
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">
                    Current Qty
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">
                    Reorder Level
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventorySnapshot.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900">
                      {item.materialName}
                    </td>
                    <td className="px-3 py-2 text-center font-semibold text-gray-900">
                      {item.currentQty} {item.unit}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600">
                      {item.reorderLevel} {item.unit}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-semibold ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders with Inventory Impact */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Recent Orders with Inventory Impact
            </h3>
            <p className="text-xs text-gray-500">
              Orders that recently affected material stock levels
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">
                    Product
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">
                    Materials Used
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">
                    Remaining Stock
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-gray-900">
                      {order.product}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {order.materialsUsed}
                    </td>
                    <td className="px-3 py-2 text-gray-900">
                      {order.remainingStock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
