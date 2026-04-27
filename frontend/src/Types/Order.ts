export type OrderStatus = 
  | "In Queue"
  | "Designing"
  | "Payment"
  | "Production"
  | "Pickup"
  | "Completed"
  | "Overdue";

export interface Order {
  id: string;
  order: string; // product/customer field names may differ
  product: string;
  quantity: number;
  paymentStatus: "Paid" | "Unpaid" | "Partial";
  dateOrdered: string;
  dueDate: string;
  specialInstructions?: string;
  assignedStaff?: string;
  status: OrderStatus;
}
