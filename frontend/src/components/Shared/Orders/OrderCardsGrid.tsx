// src/components/Shared/Orders/OrderCardsGrid.tsx
// Renders Order[] as card layout with timeline, mapping staff Order type → OrderCard format

import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, CreditCard, Trash2, Clock, Palette,
  CheckCircle2, Hammer, Truck, Package, Edit2, AlertCircle,
} from "lucide-react";
import type { Order } from "../../../Types";
import { getPaymentStatusColor } from "../../../util/formatters";

// ── Status timeline steps ────────────────────────────────────────────────────
type CardStatus = "Queue" | "Design" | "Payment" | "Production" | "Pick-up" | "Complete";

const statusSteps: { status: CardStatus; icon: any; label: string }[] = [
  { status: "Queue", icon: Clock, label: "Queue" },
  { status: "Design", icon: Palette, label: "Design" },
  { status: "Payment", icon: CreditCard, label: "Payment" },
  { status: "Production", icon: Hammer, label: "Production" },
  { status: "Pick-up", icon: Truck, label: "Pick-up" },
  { status: "Complete", icon: CheckCircle2, label: "Complete" },
];

// Map backend status → card status
const mapStatus = (status: string): CardStatus => {
  const map: Record<string, CardStatus> = {
    "In Queue": "Queue", "Designing": "Design", "Design Approval": "Design",
    "Payment": "Payment", "Production": "Production", "Pickup": "Pick-up",
    "Completed": "Complete", "Cancelled": "Complete",
  };
  return map[status] || "Queue";
};

const getStatusColor = (status: CardStatus) => {
  const colors: Record<CardStatus, string> = {
    Queue: "bg-sky-500", Design: "bg-pink-500", Payment: "bg-green-500",
    Production: "bg-violet-500", "Pick-up": "bg-amber-500", Complete: "bg-emerald-500",
  };
  return colors[status] || "bg-gray-400";
};

const getPaymentColor = getPaymentStatusColor;

// ── Single card ─────────────────────────────────────────────────────────────
const StaffOrderCard = ({ order, onView, onEdit, onDelete, onPay, hideDeleteWhen, hidePayWhen }: {
  order: Order;
  onView: (o: Order) => void;
  onEdit?: (o: Order) => void;
  onDelete?: (o: Order) => void;
  onPay?: (o: Order) => void;
  hideDeleteWhen?: (o: Order) => boolean;
  hidePayWhen?: (o: Order) => boolean;
}) => {
  const cardStatus = mapStatus(order.status);
  const stepIdx = statusSteps.findIndex(s => s.status === cardStatus);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-white p-5 rounded-2xl border ${order.hasUnreadDecline ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow`}>

      {/* Header: customer + order number */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-700 font-bold text-sm">
          {(order.customerName || "W")[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{order.customerName || "Walk-in"}</h3>
          <p className="text-xs text-gray-400 font-medium">{order.orderId}</p>
        </div>
        <span className={`${getStatusColor(cardStatus)} text-white px-2.5 py-0.5 rounded-full text-xs font-semibold`}>{order.status}</span>
      </div>

      {/* Product + qty */}
      <div className="flex items-center gap-2 text-sm">
        <Package size={14} className="text-gray-400" />
        <span className="text-gray-700 font-medium truncate">{order.productType || order.product || "—"}</span>
        <span className="text-gray-400">×{order.quantity}</span>
      </div>

      {/* Timeline */}
      <div className="relative flex justify-between items-center px-1 my-1">
        <div className="absolute left-4 right-4 h-px bg-gray-200 top-4" />
        <div className="absolute left-4 h-px bg-green-500 top-4 transition-all" style={{ width: `calc(${(stepIdx / (statusSteps.length - 1)) * 100}% - 32px)` }} />
        {statusSteps.map((step, i) => {
          const Icon = step.icon;
          const done = i < stepIdx;
          const active = i === stepIdx;
          return (
            <div key={step.status} className="relative z-10 flex flex-col items-center flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${done || active ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                {done ? <CheckCircle2 size={12} /> : <Icon size={12} />}
              </div>
              <span className={`text-[8px] mt-1 font-medium ${active ? "text-gray-900 font-bold" : "text-gray-400"}`}>{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Price + dates */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-lg font-bold text-amber-500">₱{order.totalAmount.toLocaleString()}</span>
          <span className={`ml-2 px-2 py-0.5 rounded-full border text-xs font-semibold ${getPaymentColor(order.paymentStatus)}`}>{order.paymentStatus}</span>
          {order.hasUnreadDecline && (
            <span className="ml-2 inline-flex items-center text-red-500" title={`Decline Reason: ${order.lastDeclineReason}`}>
              <AlertCircle size={14} />
            </span>
          )}
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span><Clock size={10} className="inline mr-1" />{order.dateOrdered}</span>
        {order.dueDate && <span className="text-red-400"><Clock size={10} className="inline mr-1" />Due: {order.dueDate}</span>}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1">
        <button onClick={() => onView(order)}
          className="flex-1 bg-sky-500 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-sky-600">
          <Eye size={14} /> View
        </button>
        {onPay && order.status === "Payment" && order.paymentStatus !== "Paid" && (!hidePayWhen || !hidePayWhen(order)) && (
          <button onClick={() => onPay(order)}
            className="flex-1 bg-emerald-500 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-emerald-600">
            <CreditCard size={14} /> Pay
          </button>
        )}
        {onEdit && (
          <button onClick={() => onEdit(order)}
            className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Edit2 size={14} className="text-gray-600" />
          </button>
        )}
        {onDelete && (!hideDeleteWhen || !hideDeleteWhen(order)) && (
          <button onClick={() => onDelete(order)}
            className="px-3 py-2 bg-red-50 rounded-lg hover:bg-red-100">
            <Trash2 size={14} className="text-red-600" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ── Grid container ──────────────────────────────────────────────────────────
interface OrderCardsGridProps {
  orders: Order[];
  searchQuery?: string; // kept for API compat but not used — parent filters
  onView: (order: Order) => void;
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  onPay?: (order: Order) => void;
  hideDeleteWhen?: (order: Order) => boolean;
  hidePayWhen?: (order: Order) => boolean;
}

export const OrderCardsGrid: React.FC<OrderCardsGridProps> = ({ orders, onView, onEdit, onDelete, onPay, hideDeleteWhen, hidePayWhen }) => {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <Package size={48} className="text-gray-200 mb-3" />
        <p className="text-gray-400 font-semibold">No orders found</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="popLayout">
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {orders.map(o => (
          <StaffOrderCard 
            key={o.id} 
            order={o} 
            onView={onView} 
            onEdit={onEdit} 
            onDelete={onDelete} 
            onPay={onPay} 
            hideDeleteWhen={hideDeleteWhen}
            hidePayWhen={hidePayWhen}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
