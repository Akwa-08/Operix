import { motion } from "framer-motion";
import { MapPin, Facebook, Mail, Phone } from "lucide-react";

export const ContactInfo = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  } as const;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  } as const;

  return (
    <section id="contact" className="bg-[#09090b] py-24 lg:py-32 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-transparent blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-400">Connection Hub</span>
          </div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter mb-6">
            Get In <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Touch</span>
          </h2>
          <p className="text-gray-400 text-lg sm:text-x font-medium max-w-xl mx-auto leading-relaxed">
            Ready to bring your ideas to life? Our team of experts is standing by to help you scale your vision.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {[
            { icon: <MapPin size={40} />, title: "Location", content: "Rizal St. Provincial Grandstand, Surigao", link: "#" },
            { icon: <Facebook size={40} />, title: "Facebook", content: "VTA Link Printing Services", link: "https://facebook.com/VTALinkPrintingServices" },
            { icon: <Mail size={40} />, title: "Email", content: "vtalink15@gmail.com", link: "mailto:vtalink15@gmail.com" },
            { icon: <Phone size={40} />, title: "Phone", content: "0950 759 6282", link: "tel:09507596282" }
          ].map((item, i) => (
            <motion.a
              key={i}
              href={item.link}
              target={item.link.startsWith("http") ? "_blank" : "_self"}
              variants={itemVariants}
              whileHover={{ y: -10, backgroundColor: "rgba(255,255,255,0.08)" }}
              className="p-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] transition-all duration-300 flex flex-col items-center group shadow-2xl shadow-black/50"
            >
              <div className="mb-8 p-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl text-pink-400 group-hover:scale-110 transition-transform duration-500">
                {item.icon}
              </div>
              <h3 className="text-xl font-black text-white mb-3 uppercase tracking-widest">{item.title}</h3>
              <p className="text-gray-400 text-sm font-medium leading-relaxed group-hover:text-white transition-colors">
                {item.content}
              </p>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};