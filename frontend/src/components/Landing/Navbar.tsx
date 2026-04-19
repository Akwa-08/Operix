import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export const Navbar = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-[100] bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-purple-500/5 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
            {/* Logo */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => scrollToSection("home")}
            >
              <img
                src="/operix-logo.png"
                alt="OPERIX Logo"
                className="h-8 sm:h-10 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div className="hidden sm:flex text-xl font-black tracking-tighter">
                <span className="text-cyan-500">O</span>
                <span className="text-pink-500">P</span>
                <span className="text-amber-400">E</span>
                <span className="text-purple-500">R</span>
                <span className="text-pink-500">I</span>
                <span className="text-purple-600">X</span>
              </div>
            </motion.div>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {["home", "products", "contact", "about"].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className="font-bold text-sm uppercase tracking-widest text-gray-600 hover:text-pink-500 transition-colors cursor-pointer"
                >
                  {item}
                </button>
              ))}

              {/* Log In Button - Motion enhanced */}
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px -10px rgba(232,0,136,0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/login")}
                className="font-black text-white bg-gradient-to-r from-[#E80088] to-[#AA00FD] px-8 py-2.5 rounded-xl transition-all shadow-lg shadow-pink-500/20 text-sm uppercase tracking-wider cursor-pointer"
              >
                Log in
              </motion.button>
            </nav>

            {/* Mobile Actions */}
            <div className="flex lg:hidden items-center gap-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/login")}
                className="text-white bg-[#E80088] px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-pink-500/20"
              >
                Login
              </motion.button>
            </div>
        </div>
      </div>
    </motion.div>
  );
};
