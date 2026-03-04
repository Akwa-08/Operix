interface OrderStatusBadgeProps {
  status: "In Queue" | "Designing" | "Payment" | "Production" | "Pickup" | "Completed" | "Overdue" | "Cancelled";
  size?: "sm" | "md" | "lg";
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  size = "md",
}) => {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "Overdue":
        return "bg-red-100 text-red-700 border-red-200";
      case "Cancelled":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "In Queue":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Designing":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Payment":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Production":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Pickup":
        return "bg-cyan-100 text-cyan-700 border-cyan-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getSizeStyles = (size: string) => {
    switch (size) {
      case "sm":
        return "px-2 py-0.5 text-xs";
      case "md":
        return "px-3 py-1 text-sm";
      case "lg":
        return "px-4 py-1.5 text-base";
      default:
        return "px-3 py-1 text-sm";
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold border ${getStatusStyles(
        status
      )} ${getSizeStyles(size)}`}
    >
      {status}
    </span>
  );
};
