// src/Types/index.ts
// Centralized type definitions for VTA Link Printing Services

export type UserRole = "admin" | "cashier" | "designer" | "production" | "customer";

export type OrderStatus =
  | "In Queue"
  | "Designing"
  | "Payment"
  | "Production"
  | "Pickup"
  | "Completed"
  | "Overdue";

export type PaymentStatus = "Paid" | "Unpaid" | "Partial";

export type MaterialStatus = "Available" | "Low Stock" | "Restocking" | "Phased Out";

// Unified Order interface - use this everywhere
export interface Order {
  id: string;
  orderId: string;
  customerName: string; // Main field name
  customer?: string; // Alias for compatibility
  customerEmail?: string;
  customerPhone?: string;
  productType: string;
  product?: string; // Alias for compatibility
  quantity: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  dateOrdered: string;
  dueDate: string;
  specialInstructions?: string;
  designFile?: string;
  finalDesignUrl?: string;
  assignedDesigner?: string;
  assignedProduction?: string;
  designerName?: string;
  productionName?: string;
  comments?: string;
  amountPaid?: number;
  orderType?: string;
}

export interface Material {
  id: string;
  itemType: string;
  itemVariant: string;
  usableStocks: number;
  stockUnit: string;
  reorderPoint: number;
  unitCost: number;
  purchaseQty: number;
  purchaseUnit: string;
  supplier: string;
  status: MaterialStatus;
  isActive: boolean;
  description?: string;
  lastSupplierCost?: number;
}

export interface Product {
  id: string;
  productType: string;
  productVariant: string;
  unitCost: number;
  unitPrice: number;
  unitType: "Size Based" | "Dimension Based";
  productUnit: string;
  status: MaterialStatus;
  description?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  username: string;
  contactNumber: string;
  isActive: boolean;
}

export interface Employee extends User {
  position: string;
  department: string;
  role: UserRole;
  hireDate: string;
  baseHourlyRate?: number;
  holidayRateMultiplier?: number;
  overtimeRateMultiplier?: number;
}



export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  status: "Active" | "Inactive" | "Flagged";
  flagReason?: string;
}

// ── Frontend display types (camelCase, mapped from Supabase snake_case) ──────

export interface FrontendUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  role: string;
  contactNumber: string;
  isActive: boolean;
  createdAt: string;
}

export interface FrontendSupplier {
  id: string;
  supplierName: string;
  email: string;
  contactNumber: string;
  address: string;
  supplierStatus: string;
  isFlagged: boolean;
  flagNotes: string;
  createdAt: string;
}

export type EmployeeRole = "Cashier" | "Designer" | "Production" | "Admin" | "Other";

export interface EmployeeRecord {
  id: string;
  employeeCode: string;
  fullName: string;
  position: string;
  role: UserRole;
  baseHourlyRate: number;
  holidayRateMultiplier: number;
  overtimeRateMultiplier: number;
  hireDate: string;
  isActive: boolean;
}


export interface CatalogProduct {
  id: string;
  title: string;
  category: string;
  variant: string;
  size: string;
  price: number;
  description: string;
  isActive: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  variant: string;
  sizeSpec: string;
  price: number;
  quantity: number;
  specifications?: string;
  fileUrl?: string;
}

// ── Admin Product (with Bill of Materials) ───────────────────────────────────
export interface BOMItem {
  id: string;
  inventoryItemId: string;
  materialName: string;
  quantityRequired: number;
  unitOfMeasure: string;
  unitCost: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  category: string;
  variant: string;
  sizeSpec: string;
  materialCost: number;
  profitFee: number;
  finalPrice: number;
  isActive: boolean;
  description: string;
  bom: BOMItem[];
}

// ── Deliveries ───────────────────────────────────────────────────────────────
export type DeliveryStatus = "requested" | "ordered" | "en_route" | "received" | "returned" | "completed";

export interface Delivery {
  id: string;
  inventoryItemId: string;
  materialName: string;
  materialUnit: string;
  supplierId: string | null;
  supplierName: string;
  requestedBy: string | null;
  requestedByName: string;
  requestedQuantity: number;
  expectedArrivalDate: string;
  status: DeliveryStatus;
  receivedQuantity: number;
  receiptReferenceNumber: string;
  receivedDate: string;
  notes: string;
  createdAt: string;
}
