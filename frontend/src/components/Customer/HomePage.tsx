import {useState} from "react";
import {Search, ChevronLeft, ChevronRight, Sparkles} from "lucide-react";

import {motion, AnimatePresence} from "framer-motion";
import { useProductCatalog } from "../../hooks/useSupabase";
import {ProductCard} from "./ProductCard";
import {Toast} from "./Toast";
import { useCartData } from "../../hooks/useSupabase";
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from "react-router-dom";
import { AddToCartModal } from "./AddToCartModal";


export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const { user } = useAuth();
  const { products: allProducts } = useProductCatalog();
  const { addToCart, directOrder } = useCartData();
  const navigate = useNavigate();

  // Modal state — holds the product the user clicked on
  const [modalProduct, setModalProduct] = useState<any>(null);

  const filteredProducts = allProducts.filter((p) =>
    p.isActive && p.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const itemsPerPage = 6;

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // When a product card's "Add to Cart" is clicked, open the modal
  const handleProductClick = (product: any) => {
    setModalProduct(product);
  };

  // "Add to Cart" from the modal — always force a new row since each has unique file/specs
  const handleModalAddToCart = async (data: {
    product: any;
    quantity: number;
    fileUrl?: string;
    specialInstructions?: string;
  }) => {
    const result = await addToCart(
      data.product.id,
      data.quantity,
      true, // forceNewRow — each modal submission is a unique design intent
      data.specialInstructions,
      data.fileUrl,
    );
    if (result.success) {
      setToastMessage(`${data.product.title} added to your cart!`);
      setShowToast(true);
    } else {
      setToastMessage("Failed to add to cart");
      setShowToast(true);
    }
    setModalProduct(null);
  };

  // "Order" from the modal — create order directly, navigate to /orders
  const handleModalOrder = async (data: {
    product: any;
    quantity: number;
    fileUrl?: string;
    specialInstructions?: string;
  }) => {
    const result = await directOrder({
      productId: data.product.id,
      productName: data.product.title,
      quantity: data.quantity,
      unitPrice: data.product.price,
      specifications: data.specialInstructions,
      fileUrl: data.fileUrl,
    });
    if (result.success) {
      setToastMessage(`Order placed for ${data.product.title}!`);
      setShowToast(true);
      setModalProduct(null);
      navigate("/orders");
    } else {
      setToastMessage(result.error || "Failed to place order");
      setShowToast(true);
    }
  };

  return (
    <div className="w-full bg-gray-50 flex flex-col min-h-screen">
      {/* Toast Notification */}
      <Toast
        isVisible={showToast}
        message={toastMessage}
        onClose={() => setShowToast(false)}
        onAction={() => navigate('/cart')}
        actionLabel="View Cart"
      />

      {/* Add to Cart Modal */}
      <AddToCartModal
        isOpen={!!modalProduct}
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        onAddToCart={handleModalAddToCart}
        onOrder={handleModalOrder}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-gray-100 py-10 px-4 sm:py-14 sm:px-6 md:py-16 md:px-8 lg:py-20 lg:px-10">
        {/* Abstract Background Shapes — hidden on small screens to prevent overflow */}
        <div className="hidden sm:block absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-full max-w-2xl mx-4 h-[400px] md:w-[600px] md:h-[600px] bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="hidden sm:block absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[250px] h-[250px] md:w-full max-w-md mx-4 md:h-[400px] bg-pink-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <motion.div
            initial={{opacity: 0, scale: 0.9}}
            animate={{opacity: 1, scale: 1}}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-100/50 border border-cyan-200 rounded-full text-cyan-600 text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to Operix</span>
          </motion.div>

          <motion.h1
            initial={{opacity: 0, x: -20}}
            animate={{opacity: 1, x: 0}}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 leading-none tracking-tight mb-3 md:mb-4">
            Hello{user?.firstName ? `, ${user.firstName}` : ''}!
          </motion.h1>
          <motion.p
            initial={{opacity: 0, x: -20}}
            animate={{opacity: 1, x: 0}}
            transition={{delay: 0.1}}
            className="text-gray-500 text-sm sm:text-base md:text-lg font-medium max-w-2xl leading-relaxed">
            Browse our products and add them to your cart
          </motion.p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="flex flex-col gap-6 md:gap-8 lg:gap-10">
          {/* Controls Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 md:gap-6">
            <div className="w-full lg:w-auto">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Available Products
              </h2>
              <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-1">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length)}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length}{" "}
                items
              </p>
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-full max-w-sm mx-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 font-bold" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-700 shadow-sm transition-all hover:shadow-md font-medium"
                />
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <AnimatePresence mode="popLayout">
              {pagedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product as any}
                  onAddToCart={handleProductClick}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 sm:gap-3 mt-6 md:mt-10">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 sm:p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-cyan-500 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer group"
                title="Previous Page">
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-sm sm:text-base font-black transition-all shadow-sm flex items-center justify-center cursor-pointer ${
                      currentPage === page
                        ? "bg-cyan-400 text-white shadow-lg shadow-cyan-100 ring-2 ring-cyan-200"
                        : "bg-white text-gray-500 hover:bg-gray-50 hover:text-cyan-500 border border-gray-200"
                    }`}>
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 sm:p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-cyan-500 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer group"
                title="Next Page">
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
