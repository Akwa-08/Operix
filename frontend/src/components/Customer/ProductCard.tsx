import React, {useState} from "react";
import {ShoppingCart, Check} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";

interface Product {
  id: string | number;
  title: string;
  price: number;
  variant: string;
  size: string;
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

  const handleAdd = () => {
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{opacity: 0, y: 20}}
      animate={{opacity: 1, y: 0}}
      whileHover={{y: -5}}
      className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden relative">
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-extrabold text-gray-900 transition-colors duration-300">
              {product.title}
            </h3>
            <span className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-gray-100">
              {product.variant}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-medium mb-1">
            Dimensions: <span className="text-gray-900">{product.size}</span>
          </p>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-50 flex flex-col gap-4">
          <div className="flex items-baseline gap-1">
            <span className="text-gray-400 text-xs font-bold leading-none">
              ₱
            </span>
            <span className="text-3xl font-black text-gray-900 tracking-tight">
              {product.price.toLocaleString()}
            </span>
            <span className="text-gray-400 text-sm font-bold">.00</span>
          </div>

          <button
            onClick={handleAdd}
            disabled={isAdded}
            className={`w-full relative overflow-hidden py-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer shadow-lg
              ${
                isAdded
                  ? "bg-green-500 text-white shadow-green-100"
                  : "bg-cyan-400 text-white hover:opacity-90 shadow-cyan-100"
              }`}>
            <AnimatePresence mode="wait">
              {isAdded ? (
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
