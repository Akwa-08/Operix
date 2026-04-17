/** Format a numeric value as Philippine Peso with shorthand (k/M). */
export function fmtMoney(v: number | undefined | null): string {
  const val = Number(v) || 0;
  if (val >= 1_000_000) return `₱${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000)     return `₱${(val / 1_000).toFixed(0)}k`;
  return `₱${val.toLocaleString()}`;
}

// ── Status Color Mappings (Single Source of Truth) ─────────────────────────

/** Order status → Tailwind badge classes */
const ORDER_STATUS_COLORS: Record<string, string> = {
  "In Queue":   "bg-blue-100 text-blue-700",
  Designing:    "bg-purple-100 text-purple-700",
  Payment:      "bg-yellow-100 text-yellow-700",
  Production:   "bg-orange-100 text-orange-700",
  Pickup:       "bg-cyan-100 text-cyan-700",
  Completed:    "bg-green-100 text-green-700",
  Overdue:      "bg-red-100 text-red-700",
  Cancelled:    "bg-gray-100 text-gray-700",
};

/** Payment status → Tailwind badge classes */
const PAYMENT_STATUS_COLORS: Record<string, string> = {
  Paid:    "bg-green-100 text-green-700",
  Partial: "bg-yellow-100 text-yellow-700",
  Unpaid:  "bg-red-100 text-red-700",
  None:    "bg-gray-100 text-gray-500",
};

/** Delivery status → Tailwind badge classes */
const DELIVERY_STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-700",
  ordered:   "bg-blue-100 text-blue-700",
  en_route:  "bg-purple-100 text-purple-700",
  received:  "bg-green-100 text-green-700",
  returned:  "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-600",
};

/** Material status → Tailwind badge classes (with border) */
const MATERIAL_STATUS_COLORS: Record<string, string> = {
  Available:   "bg-green-100 text-green-700 border-green-200",
  "Low Stock": "bg-yellow-100 text-yellow-700 border-yellow-200",
  Restocking:  "bg-blue-100 text-blue-700 border-blue-200",
  "Phased Out":"bg-red-100 text-red-700 border-red-200",
};

/** Payroll status → Tailwind badge classes */
const PAYROLL_STATUS_COLORS: Record<string, string> = {
  complete:   "bg-green-100 text-green-700",
  processing: "bg-yellow-100 text-yellow-700",
  draft:      "bg-gray-100 text-gray-600",
  paid:       "bg-green-100 text-green-700",
  pending:    "bg-yellow-100 text-yellow-700",
};

/** User role → Tailwind badge classes */
const ROLE_COLORS: Record<string, string> = {
  admin:      "bg-purple-100 text-purple-700",
  cashier:    "bg-blue-100 text-blue-700",
  designer:   "bg-pink-100 text-pink-700",
  production: "bg-orange-100 text-orange-700",
  customer:   "bg-green-100 text-green-700",
};

const FALLBACK = "bg-gray-100 text-gray-700";

/** Get badge classes for order status */
export function getOrderStatusColor(status: string): string {
  return ORDER_STATUS_COLORS[status] || FALLBACK;
}

/** Get badge classes for payment status */
export function getPaymentStatusColor(status: string): string {
  return PAYMENT_STATUS_COLORS[status] || FALLBACK;
}

/** Get badge classes for delivery status */
export function getDeliveryStatusColor(status: string): string {
  return DELIVERY_STATUS_COLORS[status] || FALLBACK;
}

/** Get badge classes for material status */
export function getMaterialStatusColor(status: string): string {
  return MATERIAL_STATUS_COLORS[status] || FALLBACK;
}

/** Get badge classes for payroll status */
export function getPayrollStatusColor(status: string): string {
  return PAYROLL_STATUS_COLORS[status] || FALLBACK;
}

/** Get badge classes for user role */
export function getRoleColor(role: string): string {
  return ROLE_COLORS[role] || FALLBACK;
}
