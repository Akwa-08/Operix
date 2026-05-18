// src/components/Shared/Orders/OrderStatusBadge.tsx
// Single source of truth — uses centralized color map from util/formatters

import { getOrderStatusColor } from "../../../util/formatters";

interface OrderStatusBadgeProps {
  status: string;
  paymentStatus?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_STYLES: Record<string, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  paymentStatus,
  size = "md",
}) => {
  const isCompletedUnpaid = (status === "Completed" || status === "Complete") && paymentStatus !== "Paid";
  const colorClass = isCompletedUnpaid 
    ? "bg-yellow-100 text-yellow-700 border-yellow-200" 
    : getOrderStatusColor(status);
  
  const displayText = isCompletedUnpaid ? "Incomplete" : status;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold border ${colorClass} ${SIZE_STYLES[size] || SIZE_STYLES.md}`}
    >
      {displayText}
    </span>
  );
};