import React, { useState, useRef, useEffect } from "react";
import { Modal } from "../Shared/UI/Modal";
import type { Order } from "../../Types";
import { Clock, Palette, CreditCard, Hammer, Truck, CheckCircle2, User, Package, UploadCloud, Check } from "lucide-react";
import { db, uploadOrderFile } from "../../lib/database";
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
  onRefresh?: () => void; // Called after uploading image
}

export const CustomerOrderDetailsModal: React.FC<CustomerOrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  onRefresh,
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local copy of the design file — updates immediately on upload,
  // independent of the parent's stale selectedOrder snapshot.
  const [localDesignFile, setLocalDesignFile] = useState(order.designFile || "");
  useEffect(() => {
    setLocalDesignFile(order.designFile || "");
  }, [order.id, order.designFile]);

  const currentStep = mapBackendStatusToStep(order.status);
  const currentStepIndex = statusSteps.findIndex((s) => s.status === currentStep);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const loadingToast = toast.loading("Uploading design...");

    try {
      const publicUrl = await uploadOrderFile(file);
      console.log('[handleFileUpload] storage upload success, url:', publicUrl);

      // Show the image immediately — before any DB write
      setLocalDesignFile(publicUrl);

      // Attempt to persist to DB (may fail if RLS blocks it)
      try {
        await db.updateOrderItemFile(order.id, publicUrl);
        console.log('[handleFileUpload] DB update success');
      } catch (dbErr: any) {
        console.error('[handleFileUpload] DB update failed (RLS?):', dbErr);
        // Still show the image, but warn the user the save may not persist
        toast.error(`File shown but not saved: ${dbErr?.message || 'DB error'}. Contact support.`, { id: loadingToast, duration: 6000 });
        return;
      }

      toast.success("Design uploaded successfully!", { id: loadingToast });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      const msg = err?.message || err?.error_description || err?.details || "Failed to upload design";
      console.error("Upload error:", err);
      toast.error(msg, { id: loadingToast });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    setUploading(true);
    const loadingToast = toast.loading("Uploading design...");

    try {
      const publicUrl = await uploadOrderFile(file);
      console.log('[handleFileDrop] storage upload success, url:', publicUrl);

      // Show the image immediately
      setLocalDesignFile(publicUrl);

      try {
        await db.updateOrderItemFile(order.id, publicUrl);
        console.log('[handleFileDrop] DB update success');
      } catch (dbErr: any) {
        console.error('[handleFileDrop] DB update failed (RLS?):', dbErr);
        toast.error(`File shown but not saved: ${dbErr?.message || 'DB error'}. Contact support.`, { id: loadingToast, duration: 6000 });
        return;
      }

      toast.success("Design uploaded successfully!", { id: loadingToast });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      const msg = err?.message || err?.error_description || err?.details || "Failed to upload design";
      console.error("Upload error:", err);
      toast.error(msg, { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  const preventDefault = (e: React.DragEvent) => e.preventDefault();

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
            <div className="grid grid-cols-2 gap-4">
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
                  {order.paymentStatus !== 'Paid' && (
                    <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] uppercase tracking-wider px-2 py-1 flex items-center gap-1 rounded transition-colors font-bold shadow-sm">
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
            <div className="grid grid-cols-2 gap-4">
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
          <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-gray-900">
            <Palette size={16} /> Design
          </h3>
          
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Customer Design</p>
              {localDesignFile ? (
                <div className="w-full rounded-xl overflow-hidden shadow-inner border border-gray-300">
                  <a href={localDesignFile} target="_blank" rel="noreferrer" className="block w-full">
                    <img src={localDesignFile} alt="Customer Design" className="w-full object-contain max-h-[400px] hover:opacity-90 transition-opacity" />
                  </a>
                </div>
              ) : (
                <label 
                  onDrop={handleFileDrop}
                  onDragOver={preventDefault}
                  onDragEnter={preventDefault}
                  className={`w-full bg-gray-100/80 border-2 border-dashed border-gray-300 hover:border-[#00BEF4] hover:bg-[#00BEF4]/5 transition-all rounded-xl py-12 flex flex-col items-center justify-center cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                  <UploadCloud size={32} className="text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-700">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF (max. 2MB)</p>
                  {uploading && <p className="text-xs font-bold text-[#00BEF4] mt-3">Uploading...</p>}
                </label>
              )}
            </div>

            <div className="pt-2 border-t border-gray-200">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Final Design Path</p>
              <p className="text-sm text-gray-800 break-all bg-gray-100 p-2 rounded border border-gray-200">
                {localDesignFile ? localDesignFile : "No final design uploaded by designer yet."}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Final Design Preview</p>
              <div className="w-full bg-gray-200 rounded-xl shadow-inner border border-gray-300 h-[150px] flex flex-col items-center justify-center text-gray-400">
                 {/* Placeholder matching screenshot gray box */}
                 {!localDesignFile ? (
                   <span className="text-sm">Pending design generation</span>
                 ) : (
                   <img src={localDesignFile} alt="Preview" className="w-full h-full object-cover opacity-80 mix-blend-multiply" />
                 )}
              </div>
            </div>

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
