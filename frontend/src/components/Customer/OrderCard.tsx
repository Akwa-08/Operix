import React from "react";
import {motion} from "framer-motion";
import {
  Eye,
  CreditCard,
  MessageCircle,
  Trash2,
  Clock,
  Palette,
  CheckCircle2,
  Hammer,
  Truck,
  Package,
} from "lucide-react";

export type OrderStatus =
  | "Queue"
  | "Design"
  | "Payment"
  | "Production"
  | "Pick-up"
  | "Complete";

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  role: string;
  productName: string;
  currentStatus: OrderStatus;
  orderDate: string;
  dueDate: string;
  price: number;
  isPriceEstimated?: boolean;
  paymentStatus: "Partial" | "Paid" | "None";
  note?: string;
}

interface OrderCardProps {
  order: Order;
  onViewDetails: (id: string) => void;
  onPay?: (id: string) => void;
  onChat?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const statusSteps: {status: OrderStatus; icon: any; label: string}[] = [
  {status: "Queue", icon: Clock, label: "Queue"},
  {status: "Design", icon: Palette, label: "Design"},
  {status: "Payment", icon: CreditCard, label: "Payment"},
  {status: "Production", icon: Hammer, label: "Production"},
  {status: "Pick-up", icon: Truck, label: "Pick-up"},
  {status: "Complete", icon: CheckCircle2, label: "Complete"},
];

const getStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case "Queue":
      return "In Queue";
    case "Design":
      return "Designing";
    case "Payment":
      return "Payment Confirmation";
    case "Production":
      return "In Production";
    case "Pick-up":
      return "Ready to Pickup";
    case "Complete":
      return "Complete";
    default:
      return status;
  }
};

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onViewDetails,
  onPay,
  onChat,
  onDelete,
}) => {
  const currentStepIndex = statusSteps.findIndex(
    (s) => s.status === order.currentStatus,
  );

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "Queue":
        return "bg-sky-500";
      case "Design":
        return "bg-pink-500";
      case "Payment":
        return "bg-green-500";
      case "Production":
        return "bg-violet-500";
      case "Pick-up":
        return "bg-amber-500";
      case "Complete":
        return "bg-emerald-500";
      default:
        return "bg-gray-400";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700 border-green-200";
      case "Partial":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  return (
    <motion.div
      initial={{opacity: 0, y: 10}}
      animate={{opacity: 1, y: 0}}
      className="bg-[#f3f4f6]/50 p-6 rounded-3xl border border-gray-200 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-gray-900 leading-tight">
            {order.customerName}
          </h3>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
            {order.role} • <span className="uppercase">{order.orderNumber}</span>
          </p>
        </div>
      </div>

      {/* Product & Badge Row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {order.productName}
          </span>
        </div>
        <span
          className={`${getStatusColor(order.currentStatus)} text-white px-3 py-1 rounded-full text-[10px] font-semibold`}>
          {getStatusLabel(order.currentStatus)}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative flex justify-between items-center px-1 my-2">
        {/* Progress bar background */}
        <div className="absolute left-4 right-4 h-[1px] bg-gray-200 top-[16px]" />
        {/* Progress bar active */}
        <div
          className="absolute left-4 h-[1px] bg-green-500 top-[16px] transition-all duration-500"
          style={{
            width: `calc(${(currentStepIndex / (statusSteps.length - 1)) * 100}% - 32px)`,
          }}
        />

        {statusSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.status}
              className="relative z-10 flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-colors duration-300 ${
                  isCompleted || isActive
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-[9px] mt-1.5 font-medium whitespace-nowrap ${
                  isActive ? "text-gray-900 font-bold" : "text-gray-400"
                }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-1 gap-3 mt-1">
        <div className="flex justify-between items-center text-[11px] text-gray-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Ordered:</span>
            <span className="text-gray-900 font-semibold">{order.orderDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Due:</span>
            <span className="text-red-600 font-bold">{order.dueDate}</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            {order.isPriceEstimated && (
              <span className="text-[10px] text-gray-400 font-medium leading-none mt-1">
                Estimated amount
              </span>
            )}
            <span className="text-lg font-bold text-[#f59e0b]">
              ₱{order.price.toLocaleString()}
              {order.isPriceEstimated ? "~" : ""}
            </span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full border text-[9px] font-semibold uppercase ${getPaymentStatusColor(order.paymentStatus)}`}>
            {order.paymentStatus}
          </span>
        </div>

        {order.note && (
          <div className="flex items-start gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
            <p className="text-[10px] text-gray-500 leading-tight">
              {order.note}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-2">
        <button
          onClick={() => onViewDetails(order.id)}
          className="flex-1 bg-cyan-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-cyan-600 transition-colors shadow-sm">
          <Eye className="w-4 h-4" />
          View Details
        </button>
        {order.currentStatus === "Payment" && onPay && (
          <button
            onClick={() => onPay(order.id)}
            className="flex-shrink-0 bg-green-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition-colors shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
            Pay
          </button>
        )}
        <button
          onClick={() => onChat?.(order.id)}
          className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50">
          <MessageCircle className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete?.(order.id)}
          className="w-9 h-9 bg-red-600 text-white rounded-lg flex items-center justify-center hover:bg-red-700">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
