import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Upload } from "lucide-react";
import { FileUploadModal } from "./FileUploadModal";
import { NoFileConfirmModal } from "./NoFileConfirmModal";

interface Product {
  id: string | number;
  title: string;
  price: number;
  variant: string;
  size: string;
}

interface AddToCartModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onAddToCart: (data: {
    product: Product;
    quantity: number;
    fileUrl?: string;
    specialInstructions?: string;
  }) => void;
  onOrder: (data: {
    product: Product;
    quantity: number;
    fileUrl?: string;
    specialInstructions?: string;
  }) => void;
  showAddToCart?: boolean;
  initialQuantity?: number;
  initialFileUrl?: string;
  initialInstructions?: string;
  orderButtonText?: string;
}

const sanitizeStorageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  return url.replace("/order-attachments/", "/order-files/");
};

export const AddToCartModal: React.FC<AddToCartModalProps> = ({
  isOpen,
  product,
  onClose,
  onAddToCart,
  onOrder,
  showAddToCart = true,
  initialQuantity = 1,
  initialFileUrl,
  initialInstructions = "",
  orderButtonText = "Order",
}) => {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [fileUrl, setFileUrl] = useState<string | undefined>(initialFileUrl);
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [specialInstructions, setSpecialInstructions] = useState(initialInstructions);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showNoFileConfirm, setShowNoFileConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when modal opens or initialData changes
  React.useEffect(() => {
    if (isOpen && product) {
      setQuantity(initialQuantity);
      setFileUrl(initialFileUrl);
      setSpecialInstructions(initialInstructions);
      
      if (initialFileUrl) {
        const parts = initialFileUrl.split("/");
        setFileName(decodeURIComponent(parts[parts.length - 1]));
      } else {
        setFileName(undefined);
      }
    }
  }, [isOpen, product, initialQuantity, initialFileUrl, initialInstructions]);

  if (!isOpen || !product) return null;

  const initialPrice = product.price * quantity;

  const resetState = () => {
    setQuantity(1);
    setFileUrl(undefined);
    setFileName(undefined);
    setSpecialInstructions("");
    setShowFileUpload(false);
    setShowNoFileConfirm(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleAddToCart = async () => {
    setIsSubmitting(true);
    await onAddToCart({
      product,
      quantity,
      fileUrl,
      specialInstructions: specialInstructions.trim() || undefined,
    });
    resetState();
  };

  const handleOrder = () => {
    if (!fileUrl) {
      setShowNoFileConfirm(true);
      return;
    }
    confirmOrder();
  };

  const confirmOrder = async () => {
    setShowNoFileConfirm(false);
    setIsSubmitting(true);
    await onOrder({
      product,
      quantity,
      fileUrl,
      specialInstructions: specialInstructions.trim() || undefined,
    });
    resetState();
  };

  const handleFileUploaded = (url: string) => {
    setFileUrl(url);
    // Extract filename from URL for display
    const parts = url.split("/");
    const raw = parts[parts.length - 1];
    setFileName(decodeURIComponent(raw));
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={isSubmitting ? undefined : handleClose}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-gray-100 w-full max-w-lg sm:max-w-xl md:max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-4 sm:px-8 sm:pt-8 sm:pb-5">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
                    {product.title}
                  </h2>
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-900 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
                <div className="h-1 bg-gradient-to-r from-cyan-400 to-cyan-300 rounded-full mt-3 sm:mt-4" />
              </div>

              {/* Body */}
              <div className="px-5 sm:px-8 pb-5 sm:pb-8">
                {/* Product Name */}
                <div className="mb-5 sm:mb-6">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">
                    Product Name
                  </p>
                  <p className="text-lg sm:text-xl font-black text-gray-900">
                    {product.title}
                  </p>
                </div>

                {/* Details Grid — stacked on mobile, 2-col on sm+ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-8 sm:gap-y-5 mb-5 sm:mb-6">
                  {/* Variant */}
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-0.5">
                      Variant
                    </p>
                    <p className="text-base sm:text-lg font-bold text-gray-900">
                      {product.variant || "—"}
                    </p>
                  </div>

                  {/* Unit Price */}
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-0.5">
                      Unit Price
                    </p>
                    <p className="text-base sm:text-lg font-bold text-gray-900">
                      ₱{product.price.toLocaleString()}.00
                    </p>
                  </div>

                  {/* Size */}
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-0.5">
                      Size
                    </p>
                    <p className="text-base sm:text-lg font-bold text-gray-900">
                      {product.size || "—"}
                    </p>
                  </div>

                  {/* Quantity */}
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1.5">
                      Quantity
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border-2 border-gray-300 text-gray-500 hover:border-cyan-400 hover:text-cyan-500 transition-colors cursor-pointer disabled:opacity-30"
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1) setQuantity(val);
                          else if (e.target.value === "") setQuantity(1);
                        }}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setQuantity(!isNaN(val) && val >= 1 ? val : 1);
                        }}
                        className="w-14 sm:w-16 text-xl sm:text-2xl font-black text-gray-900 text-center tabular-nums bg-transparent border-b-2 border-gray-300 focus:border-cyan-400 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border-2 border-gray-300 text-gray-500 hover:border-cyan-400 hover:text-cyan-500 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1.5">
                      File
                    </p>
                    <div className="flex flex-col gap-3">
                      {fileUrl && (
                        <div className="relative group aspect-video w-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                          <img 
                            src={sanitizeStorageUrl(fileUrl)} 
                            alt="Design Preview" 
                            className="w-full h-full object-contain p-2 hover:scale-[1.02] transition-transform duration-300"
                          />
                        </div>
                      )}
                      <button
                        onClick={() => setShowFileUpload(true)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${
                          fileUrl
                            ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                            : "border-gray-300 bg-white text-gray-500 hover:border-cyan-400 hover:text-cyan-500"
                        }`}
                      >
                        <Upload className="w-4 h-4 shrink-0" />
                        <span className="truncate max-w-[140px] sm:max-w-[180px]">
                          {fileUrl ? fileName || "Uploaded" : "Upload"}
                        </span>
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 font-medium">
                      *Upload the file/design of your order
                    </p>
                  </div>

                  {/* Initial Price */}
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-0.5">
                      Initial Price
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-gray-900">
                      ₱{initialPrice.toLocaleString()}.00
                    </p>
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="mb-4 sm:mb-5">
                  <p className="text-sm sm:text-base font-black text-gray-900 mb-2">
                    Special Instructions
                  </p>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Any special requirements or notes..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm text-gray-700 resize-none font-medium placeholder:text-gray-400"
                  />
                </div>

                {/* Pricing note */}
                <p className="text-xs text-gray-400 italic mb-5 sm:mb-6">
                  *Final pricing will depend of the designer.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={handleOrder}
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 sm:py-4 bg-cyan-400 hover:bg-cyan-500 text-white font-black text-sm uppercase tracking-wider rounded-xl sm:rounded-2xl shadow-lg shadow-cyan-100 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {isSubmitting ? "Processing..." : orderButtonText}
                  </button>
                  {showAddToCart && (
                    <button
                      onClick={handleAddToCart}
                      disabled={isSubmitting}
                      className="flex-1 py-3.5 sm:py-4 bg-white border-2 border-cyan-400 text-cyan-500 hover:bg-cyan-50 font-black text-sm uppercase tracking-wider rounded-xl sm:rounded-2xl transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      {isSubmitting ? "Adding..." : "Add to Cart"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* File Upload Modal — layered above this modal */}
      <FileUploadModal
        isOpen={showFileUpload}
        onClose={() => setShowFileUpload(false)}
        onUpload={handleFileUploaded}
        productName={product.title}
      />

      {/* No-File Confirmation Modal */}
      <NoFileConfirmModal
        isOpen={showNoFileConfirm}
        onClose={() => setShowNoFileConfirm(false)}
        onConfirm={confirmOrder}
        confirmLabel={
          orderButtonText === "Checkout" ? "Checkout Anyway" :
          orderButtonText === "Confirm"  ? "Confirm Anyway"  :
          "Order Anyway"
        }
      />
    </>
  );
};
