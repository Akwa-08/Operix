import React, {useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {CheckCircle, X} from "lucide-react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({message, isVisible, onClose}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{opacity: 0, y: 50, x: "-50%"}}
          animate={{opacity: 1, y: 0, x: "-50%"}}
          exit={{opacity: 0, y: 20, x: "-50%", scale: 0.95}}
          className="fixed bottom-10 left-1/2 z-[100] flex items-center gap-3 px-6 py-4 bg-gray-900 border border-gray-800 text-white rounded-2xl shadow-2xl min-w-[320px]">
          <div className="bg-green-500/10 p-2 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold tracking-tight">{message}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
              Success
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
