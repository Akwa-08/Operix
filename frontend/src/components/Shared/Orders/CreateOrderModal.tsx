// src/components/Shared/Orders/CreateOrderModal.tsx

import { useState } from "react";
import { Modal } from "../UI/Modal";
import { Button } from "../UI/Button";
import type { UserRole } from "../../../Types";
import { permissions } from "../../../util/permissions";
import { Info, Loader2 } from "lucide-react";
import { useToast } from "../../../context/ToastContext";
import { useEffect, useMemo } from "react";
import { db } from "../../../lib/database";
import { AlertTriangle } from "lucide-react";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  onSave: (orderData: any) => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  userRole,
  onSave,
}) => {
  const toast = useToast();
  const perms = permissions[userRole].orders;

  // Form state
  const [formData, setFormData] = useState({
    orderType: "walk-in",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    productType: "",
    productId: "",
    quantity: "" as number | string,
    totalAmount: 0,
    dueDate: "",
    specialInstructions: "",
    comments: "",
  });

  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Load real products from catalog to get max_capacity
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await db.getCatalogProducts();
        setProducts(data.filter(p => p.is_active));
      } catch (err) {
        console.error("Failed to load products:", err);
        toast.error("Could not load product list");
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.name === formData.productType) || null;
  }, [formData.productType, products]);

  const effectiveCap = selectedProduct ? (selectedProduct.max_capacity ?? Infinity) : Infinity;
  const isOutOfStock = !!selectedProduct && effectiveCap <= 0;
  const isLowStock = !!selectedProduct && !isOutOfStock && effectiveCap <= 5;

  // Auto-calculate total amount
  useEffect(() => {
    if (selectedProduct && formData.quantity) {
      const total = selectedProduct.final_price * Number(formData.quantity);
      setFormData(prev => ({ ...prev, totalAmount: total }));
    } else {
      setFormData(prev => ({ ...prev, totalAmount: 0 }));
    }
  }, [selectedProduct, formData.quantity]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.customerName.trim()) { toast.error("Customer name is required"); return; }
    if (!formData.productType) { toast.error("Product type is required"); return; }
    if (!formData.quantity || Number(formData.quantity) < 1) { toast.error("Quantity must be at least 1"); return; }
    if (selectedProduct && Number(formData.quantity) > effectiveCap) { toast.error(`Quantity cannot exceed available stock (${effectiveCap})`); return; }
    if (!formData.dueDate) { toast.error("Due date is required"); return; }
    if (formData.totalAmount <= 0) { toast.error("Total amount must be greater than 0"); return; }

    onSave({
      ...formData,
      quantity: Number(formData.quantity),
      paymentStatus: "Unpaid" // Default for new orders
    });
    onClose();
  };

  // Only admin and cashier can create orders
  if (!perms.canCreate) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Order - Walk-in" size="xl">
      <div className="space-y-5">
        {/* Customer Information */}
        <div className="space-y-4">



          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
            Customer Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => handleChange("customerName", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => handleChange("customerEmail", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => handleChange("customerPhone", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="+63 912 345 6789"
            />
          </div>
        </div>

        {/* Order Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
            Order Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="relative flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-700">
                  Product Type *
                </label>
                {/* Stock status badge */}
                {isOutOfStock ? (
                  <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ml-2">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Out of Stock
                  </div>
                ) : isLowStock ? (
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ml-2">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Only {effectiveCap} available
                  </div>
                ) : null}
              </div>
              <div className="relative">
                <select
                  value={formData.productType}
                  onChange={(e) => {
                    const selected = products.find(p => p.name === e.target.value) || null;
                    handleChange("productType", e.target.value);
                    handleChange("productId", selected?.id || "");
                    handleChange("quantity", ""); // Reset quantity on product change
                  }}
                  disabled={loadingProducts}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50 disabled:cursor-not-allowed appearance-none"
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.name}>
                      {product.name} (₱{product.final_price})
                    </option>
                  ))}
                </select>
                {loadingProducts && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-700">
                  Quantity *
                </label>
                {effectiveCap !== Infinity && effectiveCap > 0 && !isOutOfStock && (
                  <span className="text-[10px] text-cyan-600 font-bold uppercase tracking-wider">
                    Max: {effectiveCap}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                max={effectiveCap === Infinity ? undefined : effectiveCap}
                value={isOutOfStock ? 0 : formData.quantity}
                disabled={isOutOfStock || !formData.productType}
                onChange={(e) => {
                  if (isOutOfStock) return;
                  const val = e.target.value;
                  if (val === "") {
                    handleChange("quantity", "");
                    return;
                  }
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    handleChange("quantity", effectiveCap !== Infinity ? Math.min(num, effectiveCap) : num);
                  }
                }}
                onBlur={(e) => {
                  if (isOutOfStock) return;
                  const num = parseInt(e.target.value, 10);
                  const clamped = isNaN(num) || num < 1 ? 1
                    : effectiveCap !== Infinity ? Math.min(num, effectiveCap)
                    : num;
                  handleChange("quantity", clamped);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Total Amount (₱)
              </label>
              <input
                type="number"
                value={formData.totalAmount}
                readOnly
                className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-600 font-bold cursor-not-allowed"
                placeholder="0.00"
              />
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">
                * Auto-calculated based on product price and quantity
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              value={formData.dueDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => handleChange("dueDate", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${!formData.dueDate ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Special Instructions
            </label>
            <textarea
              value={formData.specialInstructions}
              onChange={(e) =>
                handleChange("specialInstructions", e.target.value)
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              placeholder="Any special requirements or instructions..."
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Internal Notes
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => handleChange("comments", e.target.value)}
              placeholder="e.g., Customer requested delivery, walk-in: Juan/09171234567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm min-h-[60px]"
            />
          </div>
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-900 font-medium flex items-start gap-1">
            <Info className="w-4 h-4 mt-[2px]" />
            <span>
              <strong>Note:</strong> The order will be created with status "In Queue".
              Designers and production staff will be assigned by admin.
            </span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isOutOfStock || !formData.productType} className="flex-1">
            {isOutOfStock ? "Out of Stock" : "Create Order"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
