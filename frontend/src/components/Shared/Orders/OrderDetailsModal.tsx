// src/components/Shared/Orders/OrderDetailsModal.tsx
import { useState } from "react";
import { Modal } from "../UI/Modal";
import { Button } from "../UI/Button";
import type { UserRole, Order } from "../../../Types";
import { permissions } from "../../../util/permissions";
import { OrderStatusBadge } from "./OrderStatusBadge";
import toast from "react-hot-toast";
import {
  User,
  Package,
  Calendar,
  DollarSign,
  FileText,
  Upload,
  CheckCircle,
  CreditCard,
  X,
  Palette,
  Image as ImageIcon,
} from "lucide-react";
import { FileUploadModal } from "../../Customer/FileUploadModal";

const sanitizeStorageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  return url.replace("/order-attachments/", "/order-files/");
};

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  userRole: UserRole;
  onUploadDesign?: () => void;
  onUpdateStatus?: (newStatus: string) => void;
  onEdit?: () => void;
  onRecordPayment?: (orderId: string, payment: { amount: number; payment_method: string; reference_number?: string; receipt_number?: string; notes?: string }) => Promise<{ success: boolean; error: string | null }>;
  onUpdateCustomerDesign?: (fileUrl: string) => Promise<void>;
  onRefresh?: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  userRole,
  onUploadDesign,
  onUpdateStatus,
  onEdit,
  onRecordPayment,
  onUpdateCustomerDesign,
  onRefresh,
}) => {
  const perms = permissions[userRole].orders;
  const [isCustomerUploadOpen, setIsCustomerUploadOpen] = useState(false);

  // ── Payment recording state ──────────────────────────────────────────────
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payRef, setPayRef] = useState("");
  const [payReceipt, setPayReceipt] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  const outstanding = Math.max(0, (order.totalAmount || 0) - (order.amountPaid || 0));

  const handleRecordPayment = async () => {
    const amt = parseFloat(payAmount);
    if (!payAmount || isNaN(amt) || amt <= 0) { toast.error("Enter a valid payment amount"); return; }
    if (amt > outstanding + 0.01) { toast.error(`Amount exceeds outstanding balance of ₱${outstanding.toLocaleString()}`); return; }
    
    if (payMethod !== 'cash' && !payRef.trim()) {
      toast.error("Reference number is required for non-cash payments");
      return;
    }

    if (!onRecordPayment) return;

    setPayLoading(true);
    const r = await onRecordPayment(order.id, {
      amount: amt,
      payment_method: payMethod,
      reference_number: payRef.trim() || undefined,
      receipt_number: payReceipt.trim() || undefined,
      notes: payNotes.trim() || undefined,
    });
    setPayLoading(false);

    if (r.success) {
      toast.success(`₱${amt.toLocaleString()} payment recorded`);
      setShowPaymentForm(false);
      setPayAmount(""); setPayRef(""); setPayNotes(""); setPayMethod("cash");
    } else {
      toast.error(r.error || "Failed to record payment");
    }
  };

  const canRecordPayment = (perms.canViewAll || userRole === "cashier") && !!onRecordPayment && order.paymentStatus !== "Paid";

  const handleCustomerUploadComplete = async (fileUrl: string) => {
    if (!onUpdateCustomerDesign) return;
    const loadingToast = toast.loading("Updating customer design...");
    try {
      await onUpdateCustomerDesign(fileUrl);
      toast.success("Design updated!", { id: loadingToast });
      if (onRefresh) onRefresh();
      setIsCustomerUploadOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to update design", { id: loadingToast });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Order Details" size="xl">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{order.orderId}</h2>
              <p className="text-gray-600 font-medium mt-1">Ordered on {order.dateOrdered}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <OrderStatusBadge status={order.status} size="md" />
              {perms.canViewAll && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                  order.paymentStatus === "Paid"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : order.paymentStatus === "Partial"
                    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                    : "bg-red-100 text-red-700 border-red-200"
                }`}>
                  {order.paymentStatus}
                </span>
              )}
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Package size={16} className="text-cyan-600" />
                <span className="text-xs text-gray-500 font-semibold uppercase">Product</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{order.productType || order.product}</p>
              <p className="text-xs text-gray-600">{order.quantity} pcs</p>
            </div>

            {perms.canViewAll && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={16} className="text-green-600" />
                  <span className="text-xs text-gray-500 font-semibold uppercase">Amount</span>
                </div>
                <p className="text-lg font-bold text-gray-900">₱{order.totalAmount.toLocaleString()}</p>
                {outstanding > 0 && <p className="text-xs text-red-500 font-semibold">₱{outstanding.toLocaleString()} outstanding</p>}
              </div>
            )}

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={16} className="text-orange-600" />
                <span className="text-xs text-gray-500 font-semibold uppercase">Due Date</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{order.dueDate}</p>
            </div>
          </div>
        </div>

        {/* ── PAYMENT SECTION ─────────────────────────────────────────────── */}
        {perms.canViewAll && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-cyan-600" />
                <h3 className="text-base font-bold text-gray-900">Payment</h3>
              </div>
              {canRecordPayment && !showPaymentForm && (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  + Record Payment
                </button>
              )}
              {showPaymentForm && (
                <button onClick={() => setShowPaymentForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X size={16} className="text-gray-500" />
                </button>
              )}
            </div>

            {/* Payment summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-sm font-bold text-gray-900">₱{order.totalAmount.toLocaleString()}</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-500">Paid</p>
                <p className="text-sm font-bold text-green-700">₱{(order.amountPaid || 0).toLocaleString()}</p>
              </div>
              <div className={`text-center p-2 rounded-lg ${outstanding > 0 ? "bg-red-50" : "bg-green-50"}`}>
                <p className="text-xs text-gray-500">Outstanding</p>
                <p className={`text-sm font-bold ${outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                  ₱{outstanding.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Record payment form */}
            {showPaymentForm && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (₱) *</label>
                    <input
                      type="number"
                      min="1"
                      max={outstanding}
                      step="0.01"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      placeholder={`Max ₱${outstanding.toLocaleString()}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method *</label>
                    <select
                      value={payMethod}
                      onChange={e => setPayMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="gcash">GCash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="card">Card</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Reference # {payMethod !== 'cash' ? '*' : '(optional)'}
                    </label>
                    <input
                      type="text"
                      value={payRef}
                      onChange={e => setPayRef(e.target.value)}
                      placeholder="e.g. GCash ref number"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        payMethod !== 'cash' && !payRef.trim() ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Receipt # (optional)</label>
                    <input
                      type="text"
                      value={payReceipt}
                      onChange={e => setPayReceipt(e.target.value)}
                      placeholder="e.g. OR-1025"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Notes (optional)</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={e => setPayNotes(e.target.value)}
                    placeholder="e.g. Partial payment, balance on pickup"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRecordPayment}
                    disabled={payLoading}
                    className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2"
                  >
                    {payLoading ? "Saving..." : "✓ Confirm Payment"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customer Information - Admin/Cashier only */}
        {perms.canViewAll && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <User size={18} className="text-cyan-600" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
              <InfoField label="Name" value={order.customerName || order.customer || "N/A"} />
              <InfoField label="Email" value={order.customerEmail || "N/A"} />
              <InfoField label="Phone" value={order.customerPhone || "N/A"} />
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <FileText size={18} className="text-purple-600" />
            Order Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
            <InfoField label="Product Type" value={order.productType || order.product || ""} />
            <InfoField label="Quantity" value={`${order.quantity} pcs`} />
            {perms.canViewAll && (
              <>
                <InfoField label="Total Amount" value={`₱${order.totalAmount.toLocaleString()}`} />
                <InfoField label="Payment Status" value={order.paymentStatus} />
              </>
            )}
            <InfoField label="Date Ordered" value={order.dateOrdered} />
            <InfoField label="Due Date" value={order.dueDate} />
            {order.assignedDesigner && <InfoField label="Assigned Designer" value={order.designerName || "Not assigned"} />}
            {order.assignedProduction && <InfoField label="Assigned Production" value={order.productionName || "Not assigned"} />}
          </div>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-700">Special Instructions</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">{order.specialInstructions}</p>
            </div>
          </div>
        )}

        {/* Design Files */}
        {(perms.canUploadDesign || perms.canViewAll) && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Upload size={18} className="text-purple-600" />
              Design Files
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Customer Design */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col h-[400px]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Customer Upload</p>
                  {onUpdateCustomerDesign && (
                    <button 
                      onClick={() => setIsCustomerUploadOpen(true)}
                      className="text-cyan-600 hover:text-cyan-700 text-[9px] font-black uppercase tracking-wider bg-white border border-cyan-100 px-2 py-0.5 rounded shadow-sm flex items-center gap-1 transition-all active:scale-95"
                    >
                      <Upload size={10} strokeWidth={3} />
                      {order.designFile ? "Replace" : "Upload"}
                    </button>
                  )}
                </div>
                {order.designFile ? (
                  <div className="flex-1 flex flex-col gap-2 min-h-0">
                    <div className="flex-1 min-h-0 relative group w-full bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="absolute inset-0">
                        <a href={sanitizeStorageUrl(order.designFile)} target="_blank" rel="noreferrer" className="block w-full h-full p-2">
                          <img 
                            src={sanitizeStorageUrl(order.designFile)} 
                            alt="Customer Design" 
                            className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
                          />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                        <p className="text-[10px] text-gray-600 truncate font-mono">{order.designFile.split('/').pop()}</p>
                      </div>
                      <a href={order.designFile} target="_blank" rel="noreferrer" className="text-cyan-600 text-[10px] font-bold hover:underline">Full View</a>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-gray-400 border border-dashed border-gray-300 rounded-lg">
                    <ImageIcon size={24} className="mb-2 opacity-50" />
                    <p className="text-xs italic">No design uploaded</p>
                  </div>
                )}
              </div>

              {/* Final Design */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col h-[400px]">
                <p className="text-[10px] font-bold text-purple-500 uppercase mb-3">Final Design (Staff)</p>
                {order.finalDesignUrl ? (
                  <div className="flex-1 flex flex-col gap-2 min-h-0">
                    <div className="flex-1 min-h-0 relative group w-full bg-white rounded-lg border border-purple-100 shadow-sm">
                      <div className="absolute inset-0">
                        <a href={sanitizeStorageUrl(order.finalDesignUrl)} target="_blank" rel="noreferrer" className="block w-full h-full p-2">
                          <img 
                            src={sanitizeStorageUrl(order.finalDesignUrl)} 
                            alt="Final Design" 
                            className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
                          />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <CheckCircle size={14} className="text-purple-600 flex-shrink-0" />
                        <p className="text-[10px] text-purple-800 truncate font-mono">{order.finalDesignUrl.split('/').pop()}</p>
                      </div>
                      <a href={order.finalDesignUrl} target="_blank" rel="noreferrer" className="text-purple-600 text-[10px] font-bold hover:underline">Full View</a>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-gray-400 border border-dashed border-purple-200 rounded-lg bg-white/50">
                    <Palette size={24} className="mb-2 opacity-50" />
                    <div className="text-center">
                      <p className="text-xs italic">Pending upload</p>
                      {perms.canUploadDesign && onUploadDesign && order.status === "Designing" && (
                        <button onClick={onUploadDesign} className="mt-2 text-purple-600 text-[10px] font-bold uppercase hover:bg-purple-100 px-2 py-1 rounded transition-colors">+ Upload Now</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Production Status Update */}
        {perms.canUpdateProductionStatus && onUpdateStatus && order.status === "Production" && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Update Production Status</h3>
            <Button variant="primary" size="sm" onClick={() => onUpdateStatus("Pickup")}>
              Mark as Ready for Pickup
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} className="flex-1">Close</Button>
          {perms.canEditAll && onEdit && (
            <Button variant="primary" onClick={onEdit} className="flex-1">Edit Order</Button>
          )}
        </div>
        <FileUploadModal
          isOpen={isCustomerUploadOpen}
          onClose={() => setIsCustomerUploadOpen(false)}
          onUpload={handleCustomerUploadComplete}
          productName={order.productType || "Order Item"}
        />
      </div>
    </Modal>
  );
};

// Helper component
const InfoField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">{label}</p>
    <p className="text-sm text-gray-900 font-semibold">{value}</p>
  </div>
);
