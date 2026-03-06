import {useState} from "react";
import {Search, ChevronLeft, ChevronRight, Sparkles} from "lucide-react";
import {useDispatch} from "react-redux";
import {motion, AnimatePresence} from "framer-motion";
import {addProduct} from "../../store/productsSlice";
import productsData from "../../util/Products";
import {ProductCard} from "./ProductCard";
import {Toast} from "./Toast";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const itemsPerPage = 6;
  const dispatch = useDispatch();

  const filteredProducts = productsData.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleAddToCart = (product: any) => {
    dispatch(addProduct({...product, id: String(product.id)}));
    setToastMessage(`${product.title} added to your cart!`);
    setShowToast(true);
  };

  return (
    <div className="w-full bg-gray-50 flex flex-col min-h-screen">
      {/* Toast Notification */}
      <Toast
        isVisible={showToast}
        message={toastMessage}
        onClose={() => setShowToast(false)}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-gray-100 py-20 px-10">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-pink-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <motion.div
            initial={{opacity: 0, scale: 0.9}}
            animate={{opacity: 1, scale: 1}}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100/50 border border-cyan-200 rounded-full text-cyan-600 text-xs font-black uppercase tracking-widest mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Welcome back to Operix</span>
          </motion.div>

          <motion.h1
            initial={{opacity: 0, x: -20}}
            animate={{opacity: 1, x: 0}}
            className="text-7xl font-black text-gray-900 leading-none tracking-tight mb-4">
            John <span className="text-cyan-500">Doe.</span>
          </motion.h1>
          <motion.p
            initial={{opacity: 0, x: -20}}
            animate={{opacity: 1, x: 0}}
            transition={{delay: 0.1}}
            className="text-gray-500 text-2xl font-medium max-w-2xl leading-relaxed">
            Explore our curated collection of professional-grade products
            designed for your next masterpiece.
          </motion.p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 p-10">
        <div className="flex flex-col gap-10">
          {/* Controls Header */}
          <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
            <div className="w-full lg:w-auto">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                Available Products
              </h2>
              <p className="text-gray-500 font-bold uppercase text-[12px] tracking-widest mt-1">
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
                <span className="w-12 h-12 rounded-xl bg-cyan-400 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-cyan-100">
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
