import React, {useState} from "react";
import {useSelector, useDispatch} from "react-redux";
import type {RootState} from "../../store";
import {
  removeProduct,
  setQuantity,
  updateProductFile,
} from "../../store/productsSlice";
import {CartHeader} from "./CartHeader";
import {CartFilters} from "./CartFilters";
import {CartTable} from "./CartTable";
import {CartFooter} from "./CartFooter";
import {FileUploadModal} from "./FileUploadModal";

export const Cart: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // File Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const dispatch = useDispatch();
  const products = useSelector((state: RootState) => state.products.items);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  const selectedCount = selectedIds.length;
  const totalPrice = products
    .filter((p) => selectedIds.includes(p.id))
    .reduce((sum, p) => sum + p.price * (p.quantity || 1), 0);

  const handleOpenUpload = (id: string, name: string) => {
    setUploadTarget({id, name});
    setIsUploadModalOpen(true);
  };

  const handleUploadComplete = (fileUrl: string) => {
    if (uploadTarget) {
      dispatch(updateProductFile({id: uploadTarget.id, fileUrl}));
    }
  };

  return (
    <div className="w-full pt-6 px-8 pb-0 bg-gray-50 flex flex-col gap-2 min-h-[calc(100vh-4rem)]">
      <CartHeader totalItems={products.length} />
      <CartFilters searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <CartTable
        products={pagedProducts}
        selectedIds={selectedIds}
        toggleSelect={toggleSelect}
        toggleSelectAll={toggleSelectAll}
        onUpdateQuantity={(id, quantity) =>
          dispatch(setQuantity({id, quantity: Math.max(0, quantity)}))
        }
        onRemove={(id) => {
          dispatch(removeProduct(id));
          setSelectedIds((prev) => prev.filter((i) => i !== id));
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onOpenUpload={handleOpenUpload}
      />
      <div className="mt-auto">
        <CartFooter
          selectedCount={selectedCount}
          totalPrice={totalPrice}
          onRemoveSelected={() => {
            selectedIds.forEach((id) => dispatch(removeProduct(id)));
            setSelectedIds([]);
          }}
          onCheckout={() => console.log("Checkout clicked")}
        />
      </div>

      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadComplete}
        productName={uploadTarget?.name || ""}
      />
    </div>
  );
};

export default Cart;
