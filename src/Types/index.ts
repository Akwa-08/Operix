// src/Types/index.ts
// Centralized type definitions for VTA Link Printing Services

export type UserRole = "admin" | "cashier" | "designer" | "production";

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
  assignedDesigner?: string;
  assignedProduction?: string;
}

export interface Material {
  id: string;
  itemType: string;
  itemVariant: string;
  usableStocks: number;
  stockUnit: string;
  purchaseQty: number;
  purchaseUnit: string;
  supplier: string;
  status: MaterialStatus;
  reorderPoint?: number;
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
  hireDate: string;
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
