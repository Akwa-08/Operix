import React, {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {
  X,
  Smartphone,
  CreditCard,
  Building2,
  QrCode,
  AlertCircle,
} from "lucide-react";

type PaymentMethod = "GCash" | "PayMaya" | "Bank Transfer";
type PaymentType = "full" | "partial";

const QR_IMAGES: Record<PaymentMethod, string> = {
  GCash: "/images/QR1.png",
  PayMaya: "/images/QR2.png",
  "Bank Transfer": "/images/QR3.png",
};

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  GCash: <Smartphone size={20} />,
  PayMaya: <CreditCard size={20} />,
  "Bank Transfer": <Building2 size={20} />,
};

const METHOD_COLORS: Record<
  PaymentMethod,
  {ring: string; bg: string; text: string; badge: string}
> = {
  GCash: {
    ring: "ring-blue-400",
    bg: "bg-blue-50",
    text: "text-blue-700",
    badge: "bg-blue-500",
  },
  PayMaya: {
    ring: "ring-green-400",
    bg: "bg-green-50",
    text: "text-green-700",
    badge: "bg-green-500",
  },
  "Bank Transfer": {
    ring: "ring-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-500",
  },
};

interface CustomerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  amountPaid: number;
  onSubmit: (payment: {
    amount: number;
    payment_method: string;
    reference_number?: string;
    notes?: string;
  }) => Promise<{success: boolean; error: string | null}>;
}

export const CustomerPaymentModal: React.FC<CustomerPaymentModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  totalAmount,
  amountPaid,
  onSubmit,
}) => {
  const remaining = totalAmount - amountPaid;

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [payType, setPayType] = useState<PaymentType>("full");
  const [partialAmt, setPartialAmt] = useState<string>("");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInitialPayment = amountPaid === 0;
  const minPayment = isInitialPayment ? totalAmount * 0.5 : 1;
  const parsedAmt = parseFloat(partialAmt) || 0;
  
  const effectiveAmount = payType === "full" ? remaining : parsedAmt;

  const handleClose = () => {
    if (submitting) return;
    setMethod(null);
    setPayType("full");
    setPartialAmt("");
    setReference("");
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    if (!method) {
      setError("Please select a payment method.");
      return;
    }
    if (payType === "partial") {
      if (!partialAmt || isNaN(parsedAmt)) {
        setError("Please enter a valid payment amount.");
        return;
      }
      if (parsedAmt < minPayment || parsedAmt > remaining) {
        setError(`Amount must be between ₱${minPayment.toLocaleString()} and ₱${remaining.toLocaleString()}.`);
        return;
      }
    }
    if (!reference.trim()) {
      setError("Please enter the reference number.");
      return;
    }

    setSubmitting(true);

    const notes =
      payType === "partial"
        ? `Partial payment of ₱${effectiveAmount.toLocaleString()} (remaining: ₱${(remaining - effectiveAmount).toLocaleString()})`
        : `Full payment of ₱${effectiveAmount.toLocaleString()}`;

    const methodMap: Record<string, string> = {
      "GCash": "gcash",
      "PayMaya": "maya",
      "Bank Transfer": "bank_transfer"
    };

    const result = await onSubmit({
      amount: effectiveAmount,
      payment_method: methodMap[method] || method.toLowerCase(),
      reference_number: reference.trim(),
      notes,
    });

    setSubmitting(false);

    if (result.success) {
      handleClose();
    } else {
      setError(result.error || "Payment failed. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          onClick={handleClose}
          className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{opacity: 0, scale: 0.95, y: 20}}
          animate={{opacity: 1, scale: 1, y: 0}}
          exit={{opacity: 0, scale: 0.95, y: 20}}
          transition={{type: "spring", stiffness: 400, damping: 30}}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  Make a Payment
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  #{orderNumber}
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={submitting}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-700 cursor-pointer disabled:opacity-40">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="px-6 py-5 flex flex-col gap-6">
            {/* Amount Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {label: "Total", value: totalAmount, color: "text-gray-900"},
                {label: "Paid", value: amountPaid, color: "text-green-600"},
                {label: "Remaining", value: remaining, color: "text-amber-600"},
              ].map(({label, value, color}) => (
                <div
                  key={label}
                  className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  <p className={`text-sm font-black ${color}`}>
                    ₱{value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Full / Partial toggle */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Payment Type
              </p>
              <div className="flex gap-2">
                {(["full", "partial"] as PaymentType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPayType(t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border border-gray-200 transition-all cursor-pointer capitalize ${
                      payType === t
                        ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    }`}>
                    {t === "full"
                      ? `Full  ₱${remaining.toLocaleString()}`
                      : "Partially paid"}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {payType === "partial" && (
                  <motion.div
                    initial={{opacity: 0, height: 0}}
                    animate={{opacity: 1, height: "auto"}}
                    exit={{opacity: 0, height: 0}}
                    className="overflow-hidden mt-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                      Amount to Pay (min ₱{minPayment.toLocaleString()}, max ₱{remaining.toLocaleString()})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                        ₱
                      </span>
                      <input
                        type="number"
                        min={minPayment}
                        max={remaining}
                        value={partialAmt}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setPartialAmt("");
                            return;
                          }
                          // Allow typing decimals like "150."
                          if (val.endsWith(".")) {
                            setPartialAmt(val);
                            return;
                          }
                          const num = parseFloat(val);
                          if (num < 0) {
                            setPartialAmt("0");
                          } else if (num > remaining) {
                            setPartialAmt(remaining.toString());
                          } else {
                            setPartialAmt(val);
                          }
                        }}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-cyan-400 focus:outline-none text-sm font-bold text-gray-900 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Payment Method Selector */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Payment Method
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(["GCash", "PayMaya", "Bank Transfer"] as PaymentMethod[]).map(
                  (m) => {
                    const c = METHOD_COLORS[m];
                    const active = method === m;
                    return (
                      <button
                        key={m}
                        onClick={() => setMethod(m)}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border border-gray-200 transition-all cursor-pointer ${
                          active
                            ? `${c.ring} ring-2 ${c.bg} ${c.text} border-transparent`
                            : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"
                        }`}>
                        {METHOD_ICONS[m]}
                        <span className="text-xs font-bold leading-tight text-center">
                          {m}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center">
              {method ? (
                <motion.div
                  key={method}
                  initial={{opacity: 0, scale: 0.9}}
                  animate={{opacity: 1, scale: 1}}
                  className="w-full">
                  <div
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border border-gray-200 ${METHOD_COLORS[method].ring} ${METHOD_COLORS[method].bg}`}>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white ${METHOD_COLORS[method].badge}`}>
                      {method} QR Code
                    </span>
                    <img
                      src={QR_IMAGES[method]}
                      alt={`${method} QR Code`}
                      className="w-48 h-48 object-contain rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <p className="text-xs text-gray-500 font-medium text-center">
                      Scan this QR code with your {method} app
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="w-full flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
                  <QrCode size={48} className="text-gray-300" />
                  <p className="text-sm text-gray-400 font-medium">
                    Select a payment method above
                  </p>
                </div>
              )}
            </div>

            {/* Reference Number */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Reference Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Enter reference number from your app"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-400 focus:outline-none text-sm font-medium text-gray-900 transition-colors placeholder:text-gray-300"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Found in your transaction history after payment
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{opacity: 0, y: -8}}
                  animate={{opacity: 1, y: 0}}
                  exit={{opacity: 0}}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3 pb-1">
              <button
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-40">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-500 text-white font-black text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-100 active:scale-[0.98]">
                {submitting
                  ? "Submitting..."
                  : `Pay ₱${effectiveAmount.toLocaleString()}`}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
