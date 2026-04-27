import React, { useState, useEffect } from "react";
import { Modal } from "../Shared/UI/Modal";
import type { Order } from "../../Types";
import { Clock, Palette, CreditCard, Hammer, Truck, CheckCircle2, User, Package, ImageIcon, Check } from "lucide-react";
import toast from "react-hot-toast";

type OrderStatus = "Queue" | "Design" | "Payment" | "Production" | "Pick-up" | "Complete";

// Map our Supabase backend status to these 6 steps
const mapBackendStatusToStep = (status: string): OrderStatus => {
  const s = status.toLowerCase();
  if (s === "in_queue" || s === "in queue") return "Queue";
  if (s === "designing") return "Design";
  if (s === "payment") return "Payment";
  if (s === "production") return "Production";
  if (s === "pickup") return "Pick-up";
  if (s === "completed") return "Complete";
  return "Queue";
};

const sanitizeStorageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  return url.replace("/order-attachments/", "/order-files/");
};

const statusSteps: { status: OrderStatus; icon: any; label: string }[] = [
  { status: "Queue", icon: Clock, label: "Queue" },
  { status: "Design", icon: Palette, label: "Design" },
  { status: "Payment", icon: CreditCard, label: "Payment" },
  { status: "Production", icon: Hammer, label: "Production" },
  { status: "Pick-up", icon: Truck, label: "Pick-up" },
  { status: "Complete", icon: CheckCircle2, label: "Complete" },
];

interface CustomerOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onRefresh?: () => Promise<void>;
  onPay?: (order: Order) => void;
}

export const CustomerOrderDetailsModal: React.FC<CustomerOrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  onPay,
}) => {

  // Local copy of the design file — updates immediately on upload,
  // independent of the parent's stale selectedOrder snapshot.
  const [localDesignFile, setLocalDesignFile] = useState(order.designFile || "");
  useEffect(() => {
    setLocalDesignFile(order.designFile || "");
  }, [order.id, order.designFile]);

  const currentStep = mapBackendStatusToStep(order.status);
  const currentStepIndex = statusSteps.findIndex((s) => s.status === currentStep);


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Order Details" size="xl">
      <div className="flex flex-col gap-6 -mt-3">
        <p className="text-gray-400 font-medium text-sm">#{order.orderId}</p>

        {/* ── Progress Tracker ────────────────────────────────────────── */}
        <div className="w-full py-4 px-2 sm:px-8 mt-2">
          <div className="relative flex justify-between items-center">
            {/* Background Line */}
            <div className="absolute left-6 right-6 top-5 h-px bg-gray-300 -z-10" />
            
            {statusSteps.map((step, index) => {
              const isPast = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = step.icon;

              let circleColor = "bg-gray-100 text-gray-400 border-2 border-white shadow-sm";
              if (isPast) {
                circleColor = "bg-emerald-500 text-white shadow-md border-transparent";
              } else if (isCurrent) {
                circleColor = "bg-[#E80088] text-white shadow-md border-transparent"; // Active Magenta
              }

              let lineClass = "";
              if (index < statusSteps.length - 1) {
                const nextIsActiveOrPast = index + 1 <= currentStepIndex;
                lineClass = nextIsActiveOrPast ? "bg-emerald-500" : "bg-gray-300";
              }

              return (
                <div key={step.status} className="flex flex-col items-center flex-1 relative z-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${circleColor}`}>
                    {isPast ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-[11px] font-semibold mt-2 ${isCurrent ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                  
                  {/* Active segment overlay line */}
                  {index < statusSteps.length - 1 && (
                    <div 
                      className={`absolute left-[50%] right-[-50%] top-5 h-px -z-10 transition-colors duration-500 ${lineClass}`} 
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Info Blocks (2 Cols) ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Customer Information */}
          <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-gray-900">
              <User size={16} /> Customer Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Name</p>
                <p className="font-bold text-gray-900 text-sm">{order.customerName}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Email</p>
                <p className="font-medium text-gray-800 text-sm">{order.customerEmail || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Phone</p>
                <p className="font-medium text-gray-800 text-sm">{order.customerPhone || "—"}</p>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-gray-900">
              <Package size={16} /> Product Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Product</p>
                <p className="font-bold text-gray-900 text-sm">{order.productType}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Quantity</p>
                <p className="font-medium text-gray-800 text-sm">{order.quantity} pcs</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Size / Detail</p>
                <p className="font-medium text-gray-800 text-sm">{order.specialInstructions && order.specialInstructions.includes('x') ? order.specialInstructions.split('\n')[0] : "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Total Amount</p>
                <p className="font-bold text-[#f59e0b] text-sm">₱{order.totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Status</p>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${order.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {order.paymentStatus}
                  </span>
                  {order.paymentStatus !== 'Paid' && onPay && (
                    <button 
                      onClick={() => onPay(order)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] uppercase tracking-wider px-2 py-1 flex items-center gap-1 rounded transition-colors font-bold shadow-sm"
                    >
                      <CreditCard size={10} /> Pay
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Staff */}
          <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-gray-900">
              Assigned Staff
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Designer</p>
                <p className="font-medium text-gray-800 text-sm break-all">{order.designerName || "xxxxxxxxx"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Production</p>
                <p className="font-medium text-gray-800 text-sm break-all">{order.productionName || "xxxxxxxxx"}</p>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-2 text-gray-900">
              Special Instructions
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed italic">
              {order.specialInstructions || "No special instructions provided."}
            </p>
          </div>

        </div>

        {/* ── Design Section ────────────────────────────────────────────── */}
        <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-5 shadow-sm mt-2">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-6 text-gray-900">
            <Palette size={16} /> Design Reference
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Customer Design */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-tight">Customer Upload</p>
              </div>
              
              <div className="h-[460px] w-full">
                {localDesignFile ? (
                  <div className="relative group w-full h-full rounded-xl overflow-hidden shadow-inner border border-gray-300 bg-white">
                    <a href={sanitizeStorageUrl(localDesignFile)} target="_blank" rel="noreferrer" className="block w-full h-full text-center">
                      <img src={sanitizeStorageUrl(localDesignFile)} alt="Customer Design" className="w-full h-full object-contain p-2 hover:scale-[1.02] transition-transform duration-300 mx-auto" />
                    </a>
                  </div>
                ) : (
                  <div className="h-full w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 text-center">
                    <div className="bg-white p-3 rounded-full shadow-sm mb-4 text-cyan-500/50">
                      <ImageIcon size={32} />
                    </div>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed max-w-[280px]">
                      It appears no file was attached to your submission. 
                    </p>
                    <p className="text-[11px] text-gray-400 mt-3 leading-normal max-w-[240px]">
                      If you require assistance or design adjustments, please reach out to our design team.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Final Design Preview */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-3 text-center">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-tight">Final Design Preview</p>
                {order.finalDesignUrl && (
                  <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Approved</span>
                )}
              </div>
              
              <div className="h-[460px] w-full">
                <div className="w-full h-full bg-gray-100 rounded-xl shadow-inner border border-gray-300 flex flex-col items-center justify-center relative overflow-hidden">
                  {order.finalDesignUrl ? (
                    <a href={sanitizeStorageUrl(order.finalDesignUrl)} target="_blank" rel="noreferrer" className="w-full h-full block">
                      <img src={sanitizeStorageUrl(order.finalDesignUrl)} alt="Final Preview" className="w-full h-full object-contain p-2 bg-white mx-auto shadow-sm" />
                    </a>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-400 p-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <Palette size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-500">Design In Progress</p>
                        <p className="text-[10px] mt-1 italic">Our team is working on your final design. Check back soon!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-200">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Technical Path</p>
            <p className="text-[11px] text-gray-500 break-all font-mono bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
              {sanitizeStorageUrl(order.finalDesignUrl || localDesignFile) || "Waiting for initial upload..."}
            </p>
          </div>
        </div>



        {/* ── Actions ────────────────────────────────────────────────────── */}
        <div className="pt-2">
          <button 
            className="bg-[#00BEF4] hover:bg-[#00a9d9] text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors w-full sm:w-auto"
            onClick={() => toast("Approve functionality not fully implemented yet 🚧")}
          >
            Approve Design
          </button>
        </div>

      </div>
    </Modal>
  );
};
