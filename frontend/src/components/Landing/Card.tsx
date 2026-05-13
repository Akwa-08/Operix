import React from "react";
import { motion } from "framer-motion";

type CardContent = {
  image: string;
  title: string;
  description: string;
};

const CardPage: React.FC<CardContent> = ({ image, title, description }) => {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="group relative bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-20px_rgba(232,0,136,0.15)] transition-all duration-500 h-full flex flex-col"
    >
      <div className="aspect-[4/3] w-full overflow-hidden relative">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.src = "/images/hero_signage.png"; // Use local fallback
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
          <p className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Learn More</p>
        </div>
      </div>
      <div className="p-6 sm:p-8 grow flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-1 bg-pink-500 rounded-full" />
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
            {title}
          </h3>
        </div>
        <p className="text-gray-500 text-sm sm:text-base leading-relaxed font-medium">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export default CardPage;
