import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export const LandingContent = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const productImages = [
    "/images/hero_jersey.png",
    "/images/hero_signage.png",
    "/images/hero_cards.png",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [productImages.length]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
  } as const;

  return (
    <div id="home" className="relative min-h-screen pt-24 sm:pt-32 overflow-hidden bg-[#fafafa]">
      {/* Dynamic Background Accents */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          x: [0, 100, 0],
          y: [0, 50, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-cyan-100/50 rounded-full blur-[120px]" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
          x: [0, -100, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-pink-100/50 rounded-full blur-[120px]" 
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Text Content */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-8 text-center lg:text-left order-2 lg:order-1 relative z-10"
          >
            <div className="space-y-4">
              <motion.div variants={itemVariants} className="inline-block px-4 py-1.5 bg-white border border-gray-100 rounded-full shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500">Premium Printing Since 1998</span>
              </motion.div>
              
              <motion.h1 
                variants={itemVariants}
                className="text-5xl sm:text-7xl lg:text-8xl font-black text-gray-900 tracking-tighter leading-[0.9]"
              >
                VTA <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500">LINK</span>
                <br />
                <span className="text-3xl sm:text-5xl lg:text-6xl text-gray-400">Services</span>
              </motion.h1>
            </div>

            <motion.p 
              variants={itemVariants}
              className="text-lg sm:text-xl text-gray-600 font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed"
            >
              Your one-stop destination for ultra-vivid, high-definition custom prints and professional signage.
            </motion.p>

            {/* CMYK Accent Icons */}
            <motion.div variants={itemVariants} className="flex gap-4 justify-center lg:justify-start items-center">
              {[
                { color: "bg-cyan-400", label: "C" },
                { color: "bg-pink-500", label: "M" },
                { color: "bg-amber-400", label: "Y" },
                { color: "bg-purple-600", label: "K" }
              ].map((dot, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ scale: 1.2, rotate: 15 }}
                  className={`${dot.color} w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-gray-200`}
                >
                  {dot.label}
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={itemVariants} className="pt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/signup")}
                className="group relative inline-flex items-center gap-3 bg-gray-900 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest overflow-hidden transition-all shadow-2xl shadow-gray-400 cursor-pointer"
              >
                <span className="relative z-10">Start Your Order</span>
                <motion.div 
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "0%" }}
                  className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 opacity-100 transition-transform duration-500"
                />
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Right: Visual Showcase */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.5 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2 relative"
          >
            {/* Main Image Container with Floating Effect */}
            <motion.div 
              animate={{ 
                y: [0, -20, 0],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative aspect-square sm:aspect-[4/5] lg:aspect-square bg-white rounded-[40px] sm:rounded-[60px] p-4 sm:p-6 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="absolute inset-0 p-4 sm:p-6"
                >
                  <img
                    src={productImages[currentImageIndex]}
                    alt="Product Showcase"
                    className="w-full h-full object-cover rounded-[30px] sm:rounded-[50px] shadow-inner"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Glassmorphic Badge */}
              <div className="absolute bottom-10 left-10 right-10 p-6 bg-white/20 backdrop-blur-md border border-white/30 rounded-3xl hidden sm:block">
                <p className="text-white font-black text-xs uppercase tracking-widest mb-1">Featured Item</p>
                <p className="text-white/80 text-[10px] leading-relaxed">
                  High-fidelity finishes and vibrant colors that define excellence in every print.
                </p>
              </div>
            </motion.div>

            {/* Decorative Element */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-10 -right-10 w-32 h-32 border-2 border-dashed border-pink-200 rounded-full opacity-50 hidden lg:block" 
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};