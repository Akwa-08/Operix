import {useState} from "react";
import {Search, ChevronLeft, ChevronRight, Sparkles} from "lucide-react";

import {motion, AnimatePresence} from "framer-motion";
import { useProductCatalog } from "../../hooks/useSupabase";
import {ProductCard} from "./ProductCard";
import {Toast} from "./Toast";
import { useCartData } from "../../hooks/useSupabase";
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from "react-router-dom";


export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const { user } = useAuth();
  const { products: allProducts } = useProductCatalog();
  const { items, addToCart } = useCartData();
  const navigate = useNavigate();

  const [duplicateModalProduct, setDuplicateModalProduct] = useState<any>(null);

  const filteredProducts = allProducts.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const itemsPerPage = 6;



  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );


  const handleAddToCart = async (product: any) => {
    const exists = items.some((i) => i.productId === product.id);
    if (exists) {
      setDuplicateModalProduct(product);
      return;
    }
    await processAddToCart(product, false);
  };

  const processAddToCart = async (product: any, forceNewRow: boolean) => {
    const result = await addToCart(product.id, 1, forceNewRow);
    if (result.success) {
      setToastMessage(`${product.title} added to your cart!`);
      setShowToast(true);
    } else {
      setToastMessage("Failed to add to cart");
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

      {/* Duplicate Prompt Modal */}
      <AnimatePresence>
        {duplicateModalProduct && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-auto outline-none">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Item already in cart</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                You already have <strong className="text-gray-900">{duplicateModalProduct.title}</strong> in your cart. What would you like to do?
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={() => { processAddToCart(duplicateModalProduct, false); setDuplicateModalProduct(null); }}
                  className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl shadow-sm transition-colors text-sm">
                  Increase Quantity
                </button>
                <button onClick={() => { processAddToCart(duplicateModalProduct, true); setDuplicateModalProduct(null); }}
                  className="w-full py-3.5 bg-white border-2 border-gray-200 hover:border-cyan-500 hover:text-cyan-600 text-gray-700 font-bold rounded-xl transition-colors text-sm">
                  Add as New Design
                </button>
                <button onClick={() => setDuplicateModalProduct(null)}
                  className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 font-semibold transition-colors mt-2">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-gray-100 py-20 px-10">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-pink-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <motion.div
            initial={{opacity: 0, scale: 0.9}}
            animate={{opacity: 1, scale: 1}}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-100/50 border border-cyan-200 rounded-full text-cyan-600 text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome  to Operix</span>
          </motion.div>

          <motion.h1
            initial={{opacity: 0, x: -20}}
            animate={{opacity: 1, x: 0}}
            className="text-5xl font-black text-gray-900 leading-none tracking-tight mb-4">
            Hello {user?.firstName ? `, ${user.firstName}` : ''}!
          </motion.h1>
          <motion.p
            initial={{opacity: 0, x: -20}}
            animate={{opacity: 1, x: 0}}
            transition={{delay: 0.1}}
            className="text-gray-500 text-lg font-medium max-w-2xl leading-relaxed">
            Browse our products and add them to your cart
          </motion.p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 p-10">
        <div className="flex flex-col gap-10">
          {/* Controls Header */}
          <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
            <div className="w-full lg:w-auto">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Available Products
              </h2>
              <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-1">
                Showing {pagedProducts.length} of {filteredProducts.length}{" "}
                items
              </p>
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-96">
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
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {pagedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product as any}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-10">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-cyan-500 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer group">
                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center px-4">
                <span className="w-10 h-10 rounded-xl bg-cyan-400 text-white flex items-center justify-center text-lg font-black shadow-lg shadow-cyan-100">
                  {currentPage}
                </span>
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-cyan-500 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer group">
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
