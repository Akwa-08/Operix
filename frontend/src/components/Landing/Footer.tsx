import { motion } from "framer-motion";
import { Facebook, Mail, Phone, ArrowUp } from "lucide-react";

export const Footer = () => {
  return (
    <footer id="about" className="bg-[#09090b] text-white pt-24 pb-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">
          {/* Logo & Vision Section */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="text-4xl font-black tracking-tighter">
                <span className="text-cyan-500">O</span>
                <span className="text-pink-500">P</span>
                <span className="text-amber-400">E</span>
                <span className="text-purple-500">R</span>
                <span className="text-pink-500">I</span>
                <span className="text-purple-600">X</span>
              </div>
            </motion.div>
            <p className="text-gray-400 text-lg font-medium leading-relaxed max-w-md">
              Founded in 1998, VTA Link Printing Services has evolved into Surigao City's most trusted partner for high-precision printing solutions. Powered by Operix, we drive efficiency through innovation.
            </p>
            <div className="flex gap-4">
              {[
                { icon: <Facebook size={20} />, href: "https://facebook.com/VTALinkPrintingServices" },
                { icon: <Mail size={20} />, href: "mailto:vtalink15@gmail.com" },
                { icon: <Phone size={20} />, href: "tel:09507596282" }
              ].map((social, i) => (
                <motion.a
                  key={i}
                  href={social.href}
                  whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.1)" }}
                  className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-white/10"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links / About Split */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-pink-500">VTA Link</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                A legacy of excellence in traditional and digital printing. From document handling to large-format signage, we ensure quality that lasts.
              </p>
            </div>
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-cyan-500">Operix Tech</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                The backbone of our operations. A centralized management platform for inventory, orders, and payroll, designed for the modern business.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} VTA Link Printing Services. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Developed by Operix Dev Team</p>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white border border-white/10"
            >
              <ArrowUp size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
};