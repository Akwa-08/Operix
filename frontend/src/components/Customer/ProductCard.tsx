import React, {useState} from "react";
import {ShoppingCart, Check, AlertTriangle} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";

interface Product {
  id: string | number;
  title: string;
  price: number;
  variant: string;
  size: string;
  maxCapacity: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
}) => {
  const [isAdded, setIsAdded] = useState(false);

  const isOutOfStock = product.maxCapacity <= 0;
  const isLowStock = !isOutOfStock && product.maxCapacity <= 5;

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.div
      initial={{opacity: 0, y: 5}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.15, ease: "easeOut"}}
      whileHover={isOutOfStock ? undefined : {y: -5}}
      className={`group bg-white border rounded-2xl p-4 sm:p-6 shadow-sm transition-all duration-300 flex flex-col h-full overflow-hidden relative ${
        isOutOfStock
          ? "border-gray-100 opacity-70"
          : "border-gray-100 hover:shadow-xl"
      }`}>
      {/* Glow Effect on Hover */}
      {!isOutOfStock && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      {/* Out of Stock overlay stripe */}
      {isOutOfStock && (
        <div className="absolute inset-0 bg-gray-50/60 rounded-2xl z-20 flex items-center justify-center pointer-events-none">
          <span className="bg-gray-800/90 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
            Out of Stock
          </span>
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-extrabold text-gray-900 transition-colors duration-300">
              {product.title}
            </h3>
            <span className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border border-gray-100 shrink-0 ml-2">
              {product.variant}
            </span>
          </div>
          <p className="text-base text-gray-500 font-medium mb-1">
            Dimensions:{" "}
            <span className="text-gray-900 font-semibold">{product.size}</span>
          </p>
          <p className="text-sm text-gray-500 font-medium mb-1">
            Available Stock:{" "}
            <span className="text-gray-900 font-semibold">{product.maxCapacity}</span>
          </p>

          {/* Stock indicator */}
          {isLowStock && (
            <motion.div
              initial={{opacity: 0, y: -4}}
              animate={{opacity: 1, y: 0}}
              className="mt-2 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              Only {product.maxCapacity} left
            </motion.div>
          )}
        </div>

        <div className="mt-auto pt-6 border-t border-gray-50 flex flex-col gap-4">
          <div className="flex items-baseline gap-1">
            <span className="text-gray-400 text-sm font-bold leading-none">
              ₱
            </span>
            <span className="text-3xl font-black text-gray-900 tracking-tight">
              {product.price.toLocaleString()}
            </span>
            <span className="text-gray-400 text-sm font-bold">.00</span>
          </div>

          <button
            onClick={handleAdd}
            disabled={isAdded || isOutOfStock}
            className={`w-full relative overflow-hidden py-4 rounded-xl font-bold text-base uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 shadow-lg
              ${
                isOutOfStock
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                  : isAdded
                  ? "bg-green-500 text-white shadow-green-100 cursor-pointer"
                  : "bg-cyan-400 text-white hover:opacity-90 shadow-cyan-100 cursor-pointer"
              }`}>
            <AnimatePresence mode="wait">
              {isOutOfStock ? (
                <motion.span
                  key="oos"
                  initial={{scale: 0.8, opacity: 0}}
                  animate={{scale: 1, opacity: 1}}
                  exit={{scale: 0.8, opacity: 0}}>
                  Unavailable
                </motion.span>
              ) : isAdded ? (
                <motion.div
                  key="check"
                  initial={{scale: 0.5, opacity: 0}}
                  animate={{scale: 1, opacity: 1}}
                  exit={{scale: 0.5, opacity: 0}}
                  className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <span>Added!</span>
                </motion.div>
              ) : (
                <motion.div
                  key="cart"
                  initial={{scale: 0.5, opacity: 0}}
                  animate={{scale: 1, opacity: 1}}
                  exit={{scale: 0.5, opacity: 0}}
                  className="flex items-center gap-2">
                  <span>Add to Cart</span>
                  <ShoppingCart className="w-5 h-5 shrink-0" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
