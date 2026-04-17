import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Printer, Palette, Zap } from "lucide-react";

/* ── Framer Motion variants ─────────────────────────────────────────── */
const fadeUp = {
  hidden: {opacity: 0, y: 18},
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const, delay},
  }),
};

const floatVariant = (yRange: number, rotRange: number, dur: number) => ({
  animate: {
    y: [0, -yRange, 0],
    rotate: [0, rotRange, 0],
    transition: {duration: dur, ease: "easeInOut" as const, repeat: Infinity},
  },
});

const pulseRing = (delay: number = 0) => ({
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.35, 0.55, 0.35],
    transition: {
      duration: 4,
      ease: "easeInOut" as const,
      repeat: Infinity,
      delay,
    },
  },
});

export const AuthLayout = () => {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  const features = [
    {icon: Printer, label: "Custom Printing", desc: "High-quality prints"},
    {icon: Palette, label: "Design Studio", desc: "Professional designs"},
    {icon: Zap, label: "Fast Delivery", desc: "Quick turnaround"},
  ];

  return (
    <div className="min-h-screen flex font-['Inter',system-ui,sans-serif] bg-gray-50/80">
      {/* ══════════════════════════════════════════════════════════════
           BANNER SIDE (Slides left or right using layout)
         ══════════════════════════════════════════════════════════════ */}
      <motion.div
        layout
        className={`hidden lg:flex flex-1 relative overflow-hidden flex-col justify-between p-10 xl:p-12 ${
          isLogin ? "order-2" : "order-1"
        }`}
        style={{
          background:
            "linear-gradient(160deg, #AA00FD 0%, #E80088 40%, #C70070 70%, #AA00FD 100%)",
        }}>
        {/* Decorative floating shapes */}
        <motion.div
          {...floatVariant(20, 8, 6)}
          animate="animate"
          className="absolute"
          style={{
            top: "8%",
            right: "12%",
            width: 80,
            height: 80,
            borderRadius: "24px",
            background: "rgba(255,209,2,.25)",
          }}
        />
        <motion.div
          {...floatVariant(28, -6, 8)}
          animate="animate"
          className="absolute"
          style={{
            top: "35%",
            right: "8%",
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "rgba(0,190,244,.2)",
          }}
        />
        <motion.div
          {...floatVariant(16, 12, 7)}
          animate="animate"
          className="absolute"
          style={{
            bottom: "20%",
            left: "8%",
            width: 100,
            height: 100,
            borderRadius: "28px",
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.15)",
          }}
        />
        <motion.div
          {...floatVariant(28, -6, 8)}
          animate="animate"
          className="absolute"
          style={{
            top: "60%",
            left: "30%",
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(255,209,2,.15)",
          }}
        />
        <motion.div
          {...pulseRing(0)}
          animate="animate"
          className="absolute"
          style={{
            top: "15%",
            left: "15%",
            width: 180,
            height: 180,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,.1)",
          }}
        />
        <motion.div
          {...pulseRing(2)}
          animate="animate"
          className="absolute"
          style={{
            bottom: "10%",
            right: "10%",
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,.08)",
          }}
        />

        {/* Logo */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              OPERIX
            </span>
          </div>
        </motion.div>

        {/* Marketing copy */}
        <div className="relative z-10 space-y-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
            key={isLogin ? "login-msg" : "signup-msg"} // re-animate on switch
          >
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
              {isLogin ? (
                <>
                  Welcome back <br />
                  <span className="text-yellow-300">to Operix.</span>
                </>
              ) : (
                <>
                  Create your{"\n"}
                  <br />
                  <span className="text-yellow-300">free account</span> today.
                </>
              )}
            </h2>
            <p className="mt-3 text-sm text-white/70 max-w-sm leading-relaxed">
              {isLogin
                ? "Manage your printing orders and track progress in real-time."
                : "Join thousands of businesses streamlining their printing orders with Operix."}
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="space-y-2">
            {features.map(({icon: Icon, label, desc}, i) => (
              <motion.div
                key={label}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.2 + i * 0.08}
                whileHover={{x: 4}}
                className="su-glass rounded-xl px-4 py-3 flex items-center gap-3 cursor-default">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-white/60 text-xs">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 min-h-[20px]" />
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════
           FORM SIDE (Slides left or right)
         ══════════════════════════════════════════════════════════════ */}
      <motion.div
        layout
        className={`flex-1 flex items-center justify-center px-5 py-6 sm:px-8 bg-gray-50/80 min-h-screen overflow-y-auto relative ${
          isLogin ? "order-1" : "order-2"
        }`}>
        
        {/* 
          Using AnimatePresence with wait mode ensures the outgoing component
          fades out completely before the new one animates in 
        */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{opacity: 0, x: isLogin ? -20 : 20}}
            animate={{opacity: 1, x: 0}}
            exit={{opacity: 0, x: isLogin ? 20 : -20}}
            transition={{duration: 0.3}}
            className="w-full max-w-[420px]"
          >
            {/* Mobile logo only visible on small screens */}
            <div className="lg:hidden text-center mb-5">
              <div className="inline-flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #E80088, #AA00FD)",
                  }}>
                  <Sparkles size={18} className="text-white" />
                </div>
                <span className="text-xl font-extrabold tracking-tight">
                  <span className="text-[#00BEF4]">O</span>
                  <span className="text-[#E80088]">P</span>
                  <span className="text-[#FFD102]">E</span>
                  <span className="text-[#AA00FD]">R</span>
                  <span className="text-[#E80088]">I</span>
                  <span className="text-[#AA00FD]">X</span>
                </span>
              </div>
            </div>

            <Outlet />
            
            {/* Bottom brand mark */}
            <p className="text-center text-[10px] text-gray-300 mt-4">
              © 2026 VTA Link Printing Services. All rights reserved.
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
