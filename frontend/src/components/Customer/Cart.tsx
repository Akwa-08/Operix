import React, { useState } from "react";
import { Toast } from "./Toast";
import { useCartData } from "../../hooks/useSupabase";
import type { CartItem } from "../../Types";
import { CartHeader } from "./CartHeader";
import { CartFilters } from "./CartFilters";
import { CartTable } from "./CartTable";
import { CartFooter } from "./CartFooter";
import { FileUploadModal } from "./FileUploadModal";
import { LoadingSpinner } from "../Shared/UI/LoadingSpinner";
import type { Product } from "./CartTable";
import { NoFileConfirmModal } from "./NoFileConfirmModal";

// Maps our API CartItem to the Product type that CartTable expects
function cartItemToProduct(item: CartItem): Product {
  return {
    id: item.id,                       // cart_items.id
    title: item.productName,           // CartTable shows product.title
    variant: item.variant || item.category || "",
    size: item.sizeSpec || "",
    price: item.price,
    quantity: item.quantity,
    fileUrl: item.fileUrl,
  };
}

import { AddToCartModal } from "./AddToCartModal";

export const Cart: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // File Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<{ id: string; name: string } | null>(null);

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedViewItem, setSelectedViewItem] = useState<CartItem | null>(null);

  // Live cart data from API (replaces Redux)
  const { items, totalItems, loading, updateQuantity, updateCartItem, removeItem, checkout } = useCartData();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showNoFileConfirm, setShowNoFileConfirm] = useState(false);

  // Custom Toast State
  const [toastConfig, setToastConfig] = useState<{
    isVisible: boolean;
    message: string;
    type: "success" | "error";
  }>({
    isVisible: false,
    message: "",
    type: "success",
  });

  const showLocalToast = (message: string, type: "success" | "error" = "success") => {
    setToastConfig({ isVisible: true, message, type });
  };

  // Convert CartItem[] → Product[] for CartTable compatibility
  const products: Product[] = items.map(cartItemToProduct);

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.length === filteredProducts.length
        ? []
        : filteredProducts.map((p) => p.id),
    );
  };

  const handleProceedToCheckout = async () => {
    setIsCheckingOut(true);
    const result = await checkout();
    setIsCheckingOut(false);
    if (result.success) {
      showLocalToast("Order placed successfully! Check your Orders tab.", "success");
      setSelectedIds([]);
    } else {
      showLocalToast("Checkout failed: " + result.error, "error");
    }
  };

  const selectedCount = selectedIds.length;
  const selectedTotal = products
    .filter((p) => selectedIds.includes(p.id))
    .reduce((sum, p) => sum + p.price * (p.quantity || 1), 0);

  const handleOpenUpload = (id: string, name: string) => {
    setUploadTarget({ id, name });
    setIsUploadModalOpen(true);
  };

  const handleView = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setSelectedViewItem(item);
      setIsViewModalOpen(true);
    }
  };

  const handleUploadComplete = async (fileUrl: string) => {
    if (uploadTarget) {
      await updateCartItem(uploadTarget.id, { fileUrl });
    }
    setIsUploadModalOpen(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="w-full pt-6 px-8 pb-0 bg-gray-50 flex flex-col gap-2 min-h-[calc(100vh-4rem)]">
      <CartHeader totalItems={totalItems} />
      <CartFilters searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <CartTable
        products={pagedProducts}
        selectedIds={selectedIds}
        toggleSelect={toggleSelect}
        toggleSelectAll={toggleSelectAll}
        onUpdateQuantity={async (id, quantity) => {
          await updateQuantity(id, Math.max(1, quantity));
        }}
        onRemove={async (id) => {
          await removeItem(id);
          setSelectedIds((prev) => prev.filter((i) => i !== id));
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onOpenUpload={handleOpenUpload}
        onView={handleView}
      />
      <div className="mt-auto">
        <CartFooter
          selectedCount={selectedCount}
          totalPrice={selectedTotal}
          isLoading={isCheckingOut}
          onRemoveSelected={async () => {
            for (const id of selectedIds) {
              await removeItem(id);
            }
            setSelectedIds([]);
          }}
          onCheckout={async () => {
            if (items.length === 0) {
              showLocalToast("Your cart is empty", "error");
              return;
            }
            // Universal safety scan: are any items missing a fileUrl?
            const itemsMissingFile = items.some(item => !item.fileUrl);
            if (itemsMissingFile) {
              setShowNoFileConfirm(true);
              return;
            }
            handleProceedToCheckout();
          }}
        />
      </div>

      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadComplete}
        productName={uploadTarget?.name || ""}
      />

      {selectedViewItem && (
        <AddToCartModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          product={cartItemToProduct(selectedViewItem)}
          initialQuantity={selectedViewItem.quantity}
          initialFileUrl={selectedViewItem.fileUrl}
          initialInstructions={selectedViewItem.specifications}
          showAddToCart={false}
          onAddToCart={() => {}} // Not used in view mode
          onOrder={async (data) => {
            // Update item in cart, then immediately trigger checkout
            await updateCartItem(selectedViewItem.id, { 
              quantity: data.quantity, 
              fileUrl: data.fileUrl,
              specifications: data.specialInstructions 
            });
            setIsViewModalOpen(false);
            handleProceedToCheckout();
          }}
          orderButtonText="Checkout"
        />
      )}

      <NoFileConfirmModal
        isOpen={showNoFileConfirm}
        onClose={() => setShowNoFileConfirm(false)}
        onConfirm={() => {
          setShowNoFileConfirm(false);
          handleProceedToCheckout();
        }}
      />

      <Toast
        message={toastConfig.message}
        isVisible={toastConfig.isVisible}
        type={toastConfig.type}
        onClose={() => setToastConfig({ ...toastConfig, isVisible: false })}
      />
    </div>
  );
};

export default Cart;