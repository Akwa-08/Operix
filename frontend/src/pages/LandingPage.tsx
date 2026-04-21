import { motion, useScroll, useSpring } from "framer-motion";
import { Navbar } from "../components/Landing/Navbar";
import { LandingContent } from "../components/Landing/LandingContent";
import { MainContent } from "../components/Landing/MainContent";
import { ContactInfo } from "../components/Landing/ContactInfo";
import { Footer } from "../components/Landing/Footer";

export const LandingPage = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="relative selection:bg-pink-500 selection:text-white">
      {/* Global Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-600 z-[200] origin-left"
        style={{ scaleX }}
      />

      <Navbar />
      
      <main>
        <LandingContent />
        <MainContent />
        <ContactInfo />
      </main>

      <Footer />

      {/* Background Decorative "Glows" - Persistent across sections */}
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-100/30 rounded-full blur-[120px] will-change-transform" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-100/30 rounded-full blur-[150px] will-change-transform" />
      </div>
    </div>
  );
};
