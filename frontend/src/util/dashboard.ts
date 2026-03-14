export interface RevenueData {
  date: string;
  revenue: number;
}

export interface ProductRevenue {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface TopOrder {
  id: string;
  customer: string;
  productType: string;
  amount: number;
  status: "Paid" | "Unpaid" | "Partial";
  date: string;
}

export interface InventoryItem {
  id: string;
  materialName: string;
  currentQty: number;
  reorderLevel: number;
  unit: string;
  status: "Low" | "Sufficient" | "Warning";
}

export interface RecentOrder {
  id: string;
  product: string;
  materialsUsed: string;
  remainingStock: string;
}

export interface OrderDetails {
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

export interface DashboardData {
  metrics: {
    totalRevenue: number;
    revenueChange: string;
    completedOrders: number;
    ordersChange: string;
    delayedPayments: number;
    paymentsChange: string;
    topSellingProduct: string;
    productChange: string;
  };
  dailySalesData: RevenueData[];
  productRevenue: ProductRevenue[];
  topOrders: TopOrder[];
  inventorySnapshot: InventoryItem[];
  recentOrders: RecentOrder[];
  sampleOrderDetails: Omit<OrderDetails, "id">;
}

export const dashboardData: DashboardData = {
  metrics: {
    totalRevenue: 175000.0,
    revenueChange: "+12.5%",
    completedOrders: 147,
    ordersChange: "+8.2%",
    delayedPayments: 12,
    paymentsChange: "-3.1%",
    topSellingProduct: "Tarpaulin",
    productChange: "+88 units",
  },
  dailySalesData: [
    {date: "Dec 1", revenue: 5800},
    {date: "Dec 2", revenue: 6200},
    {date: "Dec 3", revenue: 5900},
    {date: "Dec 4", revenue: 7100},
    {date: "Dec 5", revenue: 6800},
    {date: "Dec 6", revenue: 7500},
    {date: "Dec 7", revenue: 6900},
    {date: "Dec 8", revenue: 7200},
    {date: "Dec 9", revenue: 6500},
    {date: "Dec 10", revenue: 7800},
    {date: "Dec 12", revenue: 6300},
    {date: "Dec 13", revenue: 6900},
    {date: "Dec 14", revenue: 7400},
    {date: "Dec 16", revenue: 6800},
    {date: "Dec 18", revenue: 7200},
    {date: "Dec 20", revenue: 8100},
    {date: "Dec 22", revenue: 7600},
    {date: "Dec 24", revenue: 5900},
    {date: "Dec 26", revenue: 7300},
    {date: "Dec 28", revenue: 8200},
    {date: "Dec 30", revenue: 7800},
  ],
  productRevenue: [
    {
      category: "Tarpaulin",
      amount: 70000,
      percentage: 40,
      color: "#60A5FA",
    },
    {
      category: "Stickers",
      amount: 43750,
      percentage: 25,
      color: "#34D399",
    },
    {
      category: "Office Prints",
      amount: 35000,
      percentage: 20,
      color: "#FBBF24",
    },
    {
      category: "Lamination",
      amount: 17500,
      percentage: 10,
      color: "#C084FC",
    },
    {
      category: "ID Printing",
      amount: 8750,
      percentage: 5,
      color: "#F87171",
    },
  ],
  topOrders: [
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
  ],
  inventorySnapshot: [
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
  ],
  recentOrders: [
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
  ],
  sampleOrderDetails: {
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
  },
};
