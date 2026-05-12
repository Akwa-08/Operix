// src/components/Shared/Orders/OrderDetailsModal.tsx
import {useEffect, useState} from "react";
import {Modal} from "../UI/Modal";
import {Button} from "../UI/Button";
import type {UserRole, Order} from "../../../Types";
import {permissions} from "../../../util/permissions";
import {OrderStatusBadge} from "./OrderStatusBadge";
import {useToast} from "../../../context/ToastContext";
import {
  User,
  Package,
  Calendar,
  DollarSign,
  FileText,
  Upload,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  X,
  Palette,
  Image as ImageIcon,
} from "lucide-react";
import {FileUploadModal} from "../../Customer/FileUploadModal";
import {
  fmtDate,
} from "../../../util/formatters";
import {ConfirmModal} from "../UI/ConfirmModal";
import {SukiBadge} from "../UI/SukiBadge";

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
  onApprovePayment?: (paymentId: string, orderId: string) => Promise<void>;
  onEdit?: (updates?: {
    totalAmount?: number;
    dueDate?: string;
  }) => Promise<void> | void;
  onRecordPayment?: (
    orderId: string,
    payment: {
      amount: number;
      payment_method: string;
      reference_number?: string;
      receipt_number?: string;
      notes?: string;
    },
  ) => Promise<{success: boolean; error: string | null}>;
  onDeclinePayment?: (
    paymentId: string,
    orderId: string,
    reason: string,
  ) => Promise<void>;
  onUpdateCustomerDesign?: (fileUrl: string) => Promise<void>;
  onUpdateFinalDesign?: (fileUrl: string) => Promise<void>;
  onApproveDesign?: () => Promise<void>;
  onRefresh?: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  userRole,
  onUploadDesign,
  onUpdateStatus,
  onApprovePayment,
  onEdit,
  onRecordPayment,
  onDeclinePayment,
  onUpdateCustomerDesign,
  onUpdateFinalDesign,
  onApproveDesign,
  onRefresh,
}) => {
  const perms = permissions[userRole].orders;
  const [isCustomerUploadOpen, setIsCustomerUploadOpen] = useState(false);
  const [isFinalUploadOpen, setIsFinalUploadOpen] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const toast = useToast();

  // ── Payment recording state ──────────────────────────────────────────────
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [editAmount, setEditAmount] = useState(String(order.totalAmount || ""));
  const [editDueDate, setEditDueDate] = useState("");
  const [editingOrder, setEditingOrder] = useState(false);
  const [approvingDesign, setApprovingDesign] = useState(false);
  const [showDeclineReasonModal, setShowDeclineReasonModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    null,
  );
  const [isDeclining, setIsDeclining] = useState(false);

  const outstanding = Math.max(
    0,
    (order.totalAmount || 0) - (order.amountPaid || 0),
  );
  const isInitialPayment = !order.amountPaid || order.amountPaid === 0;
  const minPayment = isInitialPayment ? order.totalAmount * 0.5 : 1;
  const isDesignerDesigning =
    userRole === "designer" && order.status === "Designing";

  useEffect(() => {
    setEditAmount(String(order.totalAmount || ""));
    const parsedDate = order.dueDate ? new Date(order.dueDate) : null;
    const validIso =
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toISOString().slice(0, 10)
        : "";
    setEditDueDate(validIso);
  }, [order.id, order.totalAmount, order.dueDate]);

  const handleRecordPayment = async () => {
    const amt = parseFloat(payAmount);
    if (!payAmount || isNaN(amt) || amt < minPayment) {
      toast.error(
        `Minimum payment required is ₱${minPayment.toLocaleString()}`,
      );
      return;
    }
    if (amt > outstanding + 0.01) {
      toast.error(
        `Amount exceeds outstanding balance of ₱${outstanding.toLocaleString()}`,
      );
      return;
    }

    if (payMethod !== "cash" && !payRef.trim()) {
      toast.error("Reference number is required for non-cash payments");
      return;
    }

    if (!onRecordPayment) return;

    setPayLoading(true);
    const r = await onRecordPayment(order.id, {
      amount: amt,
      payment_method: payMethod,
      reference_number: payRef.trim() || undefined,
      notes: payNotes.trim() || undefined,
    });
    setPayLoading(false);

    if (r.success) {
      toast.success(`₱${amt.toLocaleString()} payment recorded`);
      setShowPaymentForm(false);
      setPayAmount("");
      setPayRef("");
      setPayNotes("");
      setPayMethod("cash");
    } else {
      toast.error(r.error || "Failed to record payment");
    }
  };

  const canRecordPayment =
    (perms.canViewAll || userRole === "cashier") &&
    !!onRecordPayment &&
    order.status === "Payment" &&
    order.paymentStatus !== "Paid";

  const canEditCustomerDesign =
    !!onUpdateCustomerDesign &&
    userRole !== "designer" &&
    ["In Queue", "Designing"].includes(order.status);

  const handleCustomerUploadComplete = async (fileUrl: string) => {
    if (!onUpdateCustomerDesign) return;
    try {
      await onUpdateCustomerDesign(fileUrl);
      toast.success("Design updated!");
      if (onRefresh) onRefresh();
      setIsCustomerUploadOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to update design");
    }
  };

  const handleFinalDesignUploadComplete = async (fileUrl: string) => {
    if (!onUpdateFinalDesign) return;
    try {
      await onUpdateFinalDesign(fileUrl);
      toast.success("Final design uploaded!");
      if (onRefresh) onRefresh();
      setIsFinalUploadOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to upload final design");
    }
  };

  const handleDesignerSave = async () => {
    if (!onEdit) return;
    const nextAmount = Number(editAmount);
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
      toast.error("Enter a valid total amount.");
      return;
    }
    if (nextAmount < (order.totalAmount || 0)) {
      toast.error("Amount can only be increased from current total.");
      return;
    }
    if (!editDueDate) {
      toast.error("Due date is required.");
      return;
    }

    setEditingOrder(true);
    try {
      await onEdit({
        totalAmount: nextAmount,
        dueDate: editDueDate,
      });
      if (onRefresh) onRefresh();
      toast.success("Order details updated.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update order");
    } finally {
      setEditingOrder(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Order Details" size="xl">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  {order.orderId}
                </h2>
                {order.isSuki && <SukiBadge />}
              </div>
              <p className="text-gray-600 font-medium mt-1">
                Ordered on {order.dateOrdered}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <OrderStatusBadge
                status={order.status}
                paymentStatus={order.paymentStatus}
                size="md"
              />
              {perms.canViewAll && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                    order.paymentStatus === "Paid"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : order.paymentStatus === "Partially paid"
                        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                        : "bg-red-100 text-red-700 border-red-200"
                  }`}>
                  {order.paymentStatus === "Partially paid"
                    ? "Paid Partially"
                    : order.paymentStatus}
                </span>
              )}
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Package size={16} className="text-cyan-600" />
                <span className="text-xs text-gray-500 font-semibold uppercase">
                  Product
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {order.productType || order.product}
              </p>
              <p className="text-xs text-gray-600">{order.quantity} pcs</p>
            </div>

            {perms.canViewAll && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={16} className="text-green-600" />
                  <span className="text-xs text-gray-500 font-semibold uppercase">
                    Amount
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  ₱{order.totalAmount.toLocaleString()}
                </p>
                {outstanding > 0 && (
                  <p className="text-xs text-red-500 font-semibold">
                    ₱{outstanding.toLocaleString()} outstanding
                  </p>
                )}
              </div>
            )}

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={16} className="text-orange-600" />
                <span className="text-xs text-gray-500 font-semibold uppercase">
                  Due Date
                </span>
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
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg transition-colors">
                  + Record Payment
                </button>
              )}
              {showPaymentForm && (
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X size={16} className="text-gray-500" />
                </button>
              )}
            </div>

            {/* Payment summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-sm font-bold text-gray-900">
                  ₱{order.totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-500">Paid</p>
                <p className="text-sm font-bold text-green-700">
                  ₱{(order.amountPaid || 0).toLocaleString()}
                </p>
              </div>
              <div
                className={`text-center p-2 rounded-lg ${outstanding > 0 ? "bg-red-50" : "bg-green-50"}`}>
                <p className="text-xs text-gray-500">Outstanding</p>
                <p
                  className={`text-sm font-bold ${outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                  ₱{outstanding.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Record payment form */}
            {showPaymentForm && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Amount (₱) (min ₱{minPayment.toLocaleString()}, max ₱
                      {outstanding.toLocaleString()}) *
                    </label>
                    <input
                      type="number"
                      min={minPayment}
                      max={outstanding}
                      step="0.01"
                      value={payAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setPayAmount("");
                          return;
                        }
                        if (val.endsWith(".")) {
                          setPayAmount(val);
                          return;
                        }
                        const num = parseFloat(val);
                        if (num < 0) {
                          setPayAmount("0");
                        } else if (num > outstanding) {
                          setPayAmount(outstanding.toString());
                        } else {
                          setPayAmount(val);
                        }
                      }}
                      placeholder={`Max ₱${outstanding.toLocaleString()}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Payment Method *
                    </label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                      <option value="cash">Cash</option>
                      <option value="gcash">GCash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="maya">Maya</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Reference # {payMethod !== "cash" ? "*" : "(optional)"}
                    </label>
                    <input
                      type="text"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      placeholder="e.g. GCash ref number"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        payMethod !== "cash" && !payRef.trim()
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                  <div>
                    {/* Receipt number tracking is now handled in the receipts table natively */}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="e.g. Partial payment, balance on pickup"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm">
                    Cancel
                  </button>
                  <button
                    onClick={handleRecordPayment}
                    disabled={payLoading}
                    className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2">
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
              <div className="flex items-center gap-2">
                <InfoField
                  label="Name"
                  value={order.customerName || order.customer || "N/A"}
                />
                {order.isSuki && <SukiBadge />}
              </div>
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
            <InfoField
              label="Product Type"
              value={order.productType || order.product || ""}
            />
            <InfoField label="Quantity" value={`${order.quantity} pcs`} />
            {perms.canViewAll && (
              <>
                <InfoField
                  label="Total Amount"
                  value={`₱${order.totalAmount.toLocaleString()}`}
                />
                <InfoField
                  label="Payment Status"
                  value={
                    order.paymentStatus === "Partially paid"
                      ? "Paid Partially"
                      : order.paymentStatus
                  }
                />
              </>
            )}
            <InfoField label="Date Ordered" value={order.dateOrdered} />
            <InfoField label="Due Date" value={order.dueDate} />
            <InfoField
              label="Assigned Designer"
              value={
                !order.assignedDesigner 
                  ? "Pending" 
                  : (order.status === "In Queue" ? "Waiting for Designer" : order.designerName || "Pending")
              }
            />
            <InfoField
              label="Assigned Production"
              value={order.productionName || "Pending"}
            />
          </div>
        </div>

        {/* Payment Transactions - Admin/Cashier only */}
        {perms.canViewAll && order.payments && order.payments.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CreditCard size={18} className="text-green-600" />
              Payment Transactions
            </h3>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3 text-center">Status</th>
                       <th className="px-4 py-3 text-center">Remarks</th>
                      {(onDeclinePayment || onApprovePayment) && (
                        <th className="px-4 py-3 text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.payments.map((p, i) => (
                      <tr
                        key={i}
                        className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600">
                          {fmtDate(p.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          ₱{p.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs font-medium">
                            {p.payment_method.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-500">
                          {p.reference_number || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              (p.status || "pending") === "declined"
                                ? "bg-red-50 text-red-700 border border-red-100"
                                : (p.status === "pending")
                                  ? "bg-yellow-50 text-yellow-700 border border-yellow-100"
                                  : "bg-green-50 text-green-700 border border-green-100"
                            }`}>
                            {p.status || "pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div
                            className="flex justify-center cursor-help"
                            title={
                              (p.status || "pending") === "declined"
                                ? p.decline_reason || "Declined by cashier"
                                : p.status === "pending"
                                  ? "Awaiting cashier verification"
                                  : "Payment approved"
                            }>
                            {(p.status || "pending") === "declined" ? (
                              <AlertCircle size={16} className="text-red-500" />
                            ) : p.status === "pending" ? (
                              <Clock size={16} className="text-yellow-500" />
                            ) : (
                              <CheckCircle2
                                size={16}
                                className="text-emerald-500"
                              />
                            )}
                          </div>
                        </td>
                        {(onDeclinePayment || onApprovePayment) && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {p.status === "pending" && onApprovePayment && (
                                <button
                                  onClick={() => onApprovePayment(p.id, order.id)}
                                  className="text-emerald-600 hover:text-emerald-700 text-xs font-semibold px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 transition-colors">
                                  Approve
                                </button>
                              )}
                              {(p.status || "pending") !== "declined" &&
                                onDeclinePayment && (
                                  <button
                                    onClick={() => {
                                      setSelectedPaymentId(p.id);
                                      setDeclineReason("");
                                      setShowDeclineReasonModal(true);
                                    }}
                                    className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors">
                                    Decline
                                  </button>
                                )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-700">
              Special Instructions
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                {order.specialInstructions}
              </p>
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
                  <p className="text-[10px] font-bold text-gray-500 uppercase">
                    Customer Upload
                  </p>
                  {canEditCustomerDesign && (
                    <button
                      onClick={() => setIsCustomerUploadOpen(true)}
                      className="text-cyan-600 hover:text-cyan-700 text-[9px] font-black uppercase tracking-wider bg-white border border-cyan-100 px-2 py-0.5 rounded shadow-sm flex items-center gap-1 transition-all active:scale-95">
                      <Upload size={10} strokeWidth={3} />
                      {order.designFile ? "Replace" : "Upload"}
                    </button>
                  )}
                </div>
                {order.designFile ? (
                  <div className="flex-1 flex flex-col gap-2 min-h-0">
                    <div className="flex-1 min-h-0 relative group w-full bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="absolute inset-0">
                        <a
                          href={sanitizeStorageUrl(order.designFile)}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-full h-full p-2">
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
                        <CheckCircle
                          size={14}
                          className="text-green-600 flex-shrink-0"
                        />
                        <p className="text-[10px] text-gray-600 truncate font-mono">
                          {order.designFile.split("/").pop()}
                        </p>
                      </div>
                      <a
                        href={order.designFile}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-600 text-[10px] font-bold hover:underline">
                        Full View
                      </a>
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
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-purple-500 uppercase">
                    Final Design (Staff)
                  </p>
                  {/* Designer can upload to Final Preview */}
                  {onUpdateFinalDesign && (
                    <button
                      onClick={() => setIsFinalUploadOpen(true)}
                      className="text-purple-600 hover:text-purple-700 text-[9px] font-black uppercase tracking-wider bg-white border border-purple-100 px-2 py-0.5 rounded shadow-sm flex items-center gap-1 transition-all active:scale-95">
                      <Upload size={10} strokeWidth={3} />
                      {order.finalDesignUrl ? "Replace" : "Upload"}
                    </button>
                  )}
                </div>
                {order.finalDesignUrl ? (
                  <div className="flex-1 flex flex-col gap-2 min-h-0">
                    <div className="flex-1 min-h-0 relative group w-full bg-white rounded-lg border border-purple-100 shadow-sm">
                      <div className="absolute inset-0">
                        <a
                          href={sanitizeStorageUrl(order.finalDesignUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-full h-full p-2">
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
                        <CheckCircle
                          size={14}
                          className="text-purple-600 flex-shrink-0"
                        />
                        <p className="text-[10px] text-purple-800 truncate font-mono">
                          {order.finalDesignUrl.split("/").pop()}
                        </p>
                      </div>
                      <a
                        href={order.finalDesignUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-600 text-[10px] font-bold hover:underline">
                        Full View
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-gray-400 border border-dashed border-purple-200 rounded-lg bg-white/50">
                    <Palette size={24} className="mb-2 opacity-50" />
                    <div className="text-center">
                      <p className="text-xs italic">Pending upload</p>
                      {perms.canUploadDesign &&
                        onUploadDesign &&
                        order.status === "Designing" && (
                          <button
                            onClick={onUploadDesign}
                            className="mt-2 text-purple-600 text-[10px] font-bold uppercase hover:bg-purple-100 px-2 py-1 rounded transition-colors">
                            + Upload Now
                          </button>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Production Status Update */}
        {perms.canUpdateProductionStatus &&
          onUpdateStatus &&
          order.status === "Production" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                Update Production Status
              </h3>
              <div className="space-y-2">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={outstanding > 0}
                  onClick={() => onUpdateStatus("Pickup")}
                  className={outstanding > 0 ? "opacity-50 cursor-not-allowed" : ""}>
                  Mark as Ready for Pickup
                </Button>
                {outstanding > 0 && (
                  <p className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={12} /> Full payment required to mark as Ready for Pickup
                  </p>
                )}
              </div>
            </div>
          )}

        {/* Action Buttons */}
        {isDesignerDesigning && onEdit && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">
              Designing Phase Update
            </h3>
            <p className="text-xs text-gray-600">
              Designer can increase total amount and adjust due date during
              Designing only.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Total Amount (min current: ₱
                  {order.totalAmount.toLocaleString()})
                </label>
                <input
                  type="number"
                  min={order.totalAmount}
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDesignerSave}
              disabled={editingOrder}>
              {editingOrder ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          {/* Cashier Confirm/Complete Button */}
          {userRole === "cashier" &&
            ["Payment", "Pickup"].includes(order.status) &&
            onUpdateStatus && (
              <div className="flex-1 flex flex-col gap-1">
                <Button
                  variant="primary"
                  className={`w-full bg-cyan-400 hover:bg-cyan-500 border-cyan-500 ${(order.status === "Pickup" && outstanding > 0) ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={order.status === "Pickup" && outstanding > 0}
                  onClick={async () => {
                    const isPaid = (order.amountPaid || 0) >= (order.totalAmount || 0);
                    const nextStatus = order.status === "Pickup" ? "Completed" : "Production";
                    const targetName = nextStatus === "Completed" ? "Completed" : "Production";

                    if (isPaid) {
                      onUpdateStatus(nextStatus);
                      toast.success(`Order confirmed and set to ${targetName}!`);
                    } else if (order.status === "Payment") {
                      // Allow moving to Production with warning
                      setShowPaymentConfirm(true);
                    } else {
                      // Block moving to Completed if not paid
                      toast.error("Full payment is required to complete the order.");
                    }
                  }}>
                  {order.status === "Pickup" ? "Complete Order" : "Confirm"}
                </Button>
                {order.status === "Pickup" && outstanding > 0 && (
                  <p className="text-[10px] text-red-600 font-bold text-center">Full payment required</p>
                )}
              </div>
            )}

          {perms.canEditAll && onEdit && !isDesignerDesigning && (
            <Button
              variant="primary"
              onClick={() => onEdit()}
              className="flex-1">
              Edit Order
            </Button>
          )}

          {isDesignerDesigning && order.finalDesignUrl && onApproveDesign && (
            <Button
              variant="primary"
              className="flex-1 bg-[#00BEF4] hover:bg-[#00a9d9] border-[#00BEF4]"
              disabled={approvingDesign}
              onClick={async () => {
                setApprovingDesign(true);
                try {
                  await onApproveDesign();
                  toast.success("Design approved and order moved to Payment!");
                } catch (err: any) {
                  toast.error(err.message || "Failed to approve design");
                } finally {
                  setApprovingDesign(false);
                }
              }}>
              {approvingDesign ? "Approving..." : "Approve Design"}
            </Button>
          )}

          <Button variant="secondary" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
        <FileUploadModal
          isOpen={isCustomerUploadOpen}
          onClose={() => setIsCustomerUploadOpen(false)}
          onUpload={handleCustomerUploadComplete}
          productName={order.productType || "Order Item"}
          oldUrl={order.designFile}
        />
        <FileUploadModal
          isOpen={isFinalUploadOpen}
          onClose={() => setIsFinalUploadOpen(false)}
          onUpload={handleFinalDesignUploadComplete}
          productName={`Final Preview — ${order.productType || "Order Item"}`}
          oldUrl={order.finalDesignUrl}
        />

        {/* Confirmation for unpaid orders */}
        <ConfirmModal
          isOpen={showPaymentConfirm}
          onClose={() => setShowPaymentConfirm(false)}
          onConfirm={() => {
            if (!onUpdateStatus) return;
            const nextStatus =
              order.status === "Pickup" ? "Completed" : "Production";
            const targetName =
              nextStatus === "Completed" ? "Completed" : "Production";
            onUpdateStatus(nextStatus);
            toast.success(
              `Order sent to ${targetName} despite pending payment.`,
            );
          }}
          title="Payment Pending"
          message={`This order is not fully paid (₱${outstanding.toLocaleString()} remaining). Proceed to ${order.status === "Pickup" ? "Completed" : "Production"} anyway?`}
          confirmLabel="Proceed Anyway"
          cancelLabel="Cancel"
          variant="warning"
        />

        {/* Decline Reason Modal */}
        <Modal
          isOpen={showDeclineReasonModal}
          onClose={() => !isDeclining && setShowDeclineReasonModal(false)}
          title="Decline Payment"
          size="sm">
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-xl flex items-start gap-3">
              <div>
                <p className="text-xs text-red-700">
                  Please provide a reason for declining this payment. This will
                  be sent to the customer.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                Reason for Decline
              </label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Invalid reference number, amount mismatch..."
                className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all resize-none h-24"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowDeclineReasonModal(false)}
                disabled={isDeclining}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-red-500 hover:bg-red-600 border-red-600 shadow-lg shadow-red-100"
                disabled={!declineReason.trim() || isDeclining}
                onClick={async () => {
                  if (!selectedPaymentId || !onDeclinePayment) return;
                  setIsDeclining(true);
                  try {
                    await onDeclinePayment(
                      selectedPaymentId,
                      order.id,
                      declineReason.trim(),
                    );
                    toast.success("Payment declined and customer notified");
                    setShowDeclineReasonModal(false);
                    if (onRefresh) onRefresh();
                  } catch (err: any) {
                    toast.error(err.message || "Failed to decline payment");
                  } finally {
                    setIsDeclining(false);
                  }
                }}>
                {isDeclining ? "Declining..." : "Confirm Decline"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Modal>
  );
};

// Helper component
const InfoField: React.FC<{label: string; value: string}> = ({
  label,
  value,
}) => (
  <div>
    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">
      {label}
    </p>
    <p className="text-sm text-gray-900 font-semibold">{value}</p>
  </div>
);
