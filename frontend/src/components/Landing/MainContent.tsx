import React from "react";
import { motion } from "framer-motion";
import Card from "./Card";
import { type Service, services } from "../../assets/MainContentText";

export const MainContent: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
  } as const;

  return (
    <section id="products" className="py-24 lg:py-32 bg-white relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-purple-50/50 rounded-full blur-[100px] -z-10" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 text-center"
        >
          <div className="inline-block px-4 py-1.5 bg-pink-50 rounded-full mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-600">Product Portfolio</span>
          </div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 text-gray-900 tracking-tighter">
            Our <span className="text-[#E80088]">Services</span>
          </h2>
          <p className="text-gray-500 text-lg sm:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            From high-performance athletic wear to ultra-modern business solutions, we bring color to your vision.
          </p>
        </motion.div>

        {/* Services Grid with Staggered Motion */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
        >
          {services.map((service: Service, index: number) => (
            <motion.div key={index} variants={itemVariants}>
              <Card
                image={service.image}
                title={service.title}
                description={service.description}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};