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
  User,
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

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case "Queue":
      return "bg-cyan-500";
    case "Design":
      return "bg-pink-500";
    case "Payment":
      return "bg-green-500";
    case "Production":
      return "bg-purple-500";
    case "Pick-up":
      return "bg-orange-500";
    case "Complete":
      return "bg-green-600";
    default:
      return "bg-gray-400";
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
      initial={{opacity: 0, y: 20}}
      animate={{opacity: 1, y: 0}}
      whileHover={{y: -8, boxShadow: "0 20px 40px -15px rgba(0,0,0,0.1)"}}
      className="group bg-white border border-gray-100 rounded-[2rem] p-7 shadow-sm transition-all duration-500 flex flex-col gap-6 relative overflow-hidden h-full">
      {/* Top Header: Avatar & Header Meta */}
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
            <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
              <User className="w-6 h-6" />
            </div>
          </div>
          <div className="pt-1">
            <h3 className="text-xl font-black text-gray-900 leading-none mb-1">
              {order.customerName}{" "}
              <span className="text-gray-300 font-medium px-2">|</span>{" "}
              <span className="text-gray-400 font-bold text-sm">
                {order.role}
              </span>
            </h3>
            <p className="text-gray-400 text-[10px] font-black tracking-widest uppercase">
              {order.orderNumber}
            </p>
          </div>
        </div>

        <span
          className={`${getStatusColor(order.currentStatus)} text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg shadow-current/20`}>
          {getStatusLabel(order.currentStatus)}
        </span>
      </div>

      {/* Product Information */}
      <div className="flex items-center gap-3 mt-1">
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
          <Package className="w-5 h-5 text-gray-400" />
        </div>
        <span className="text-xl font-black text-gray-800 tracking-tight">
          {order.productName}
        </span>
      </div>

      {/* Progress Timeline */}
      <div className="relative flex justify-between items-center px-1 py-6">
        {/* Connection Line */}
        <div className="absolute left-6 right-6 h-[3px] bg-gray-100 top-1/2 -translate-y-1/2 rounded-full overflow-hidden">
          <motion.div
            initial={{width: 0}}
            animate={{
              width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`,
            }}
            className="h-full bg-green-400"
          />
        </div>

        {statusSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.status}
              className="relative z-10 flex flex-col items-center">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 border-4 border-white shadow-md ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                      ? `${getStatusColor(step.status)} text-white scale-125 z-20`
                      : "bg-gray-50 text-gray-300"
                }`}>
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-tighter mt-3 whitespace-nowrap transition-all duration-300 ${
                  isActive ? "text-gray-900 scale-110" : "text-gray-300"
                }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Meta Grid: Dates & Money */}
      <div className="bg-gray-50/70 rounded-2xl p-5 space-y-4 border border-gray-100/50">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{order.orderDate}</span>
          </div>
          <div className="flex items-center gap-2 text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">
            <Clock className="w-4 h-4" />
            <span>Due: {order.dueDate}</span>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
              {order.isPriceEstimated ? "Estimated Amount" : "Price"}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-gray-900 text-3xl font-black tracking-tighter">
                ₱{order.price.toLocaleString()}
                {order.isPriceEstimated && (
                  <span className="text-gray-400">~</span>
                )}
              </span>
              <span className="text-gray-400 text-sm font-bold">.00</span>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getPaymentStatusColor(
              order.paymentStatus,
            )}`}>
            {order.paymentStatus}
          </span>
        </div>

        {order.note && (
          <div className="pt-2 border-t border-gray-200/50">
            <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
              "{order.note}"
            </p>
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div className="mt-auto flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(order.id)}
            className="flex-[3] flex items-center justify-center gap-2 bg-cyan-400 py-4 rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-cyan-100 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer">
            <Eye className="w-5 h-5" />
            View Details
          </button>

          {order.currentStatus === "Payment" && onPay && (
            <button
              onClick={() => onPay(order.id)}
              className="flex-[2] flex items-center justify-center gap-2 bg-green-500 py-4 rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-100 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer">
              <CreditCard className="w-5 h-5" />
              Pay
            </button>
          )}

          <button
            onClick={() => onChat?.(order.id)}
            className="w-14 h-14 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-900 hover:bg-gray-50 transition-all cursor-pointer shadow-sm">
            <MessageCircle className="w-6 h-6" />
          </button>

          <button
            onClick={() => onDelete?.(order.id)}
            className="w-14 h-14 flex items-center justify-center bg-red-500 rounded-xl text-white hover:bg-red-600 transition-all cursor-pointer shadow-lg shadow-red-100">
            <Trash2 className="w-6 h-6" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
