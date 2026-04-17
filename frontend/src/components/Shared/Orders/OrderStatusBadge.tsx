// src/components/Shared/Orders/OrderStatusBadge.tsx
// Single source of truth — uses centralized color map from util/formatters

import { getOrderStatusColor } from "../../../util/formatters";

interface OrderStatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_STYLES: Record<string, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  size = "md",
}) => (
  <span
    className={`inline-flex items-center justify-center rounded-full font-semibold border ${getOrderStatusColor(status)} ${SIZE_STYLES[size] || SIZE_STYLES.md}`}
  >
    {status}
  </span>
);