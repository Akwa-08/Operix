import React, {useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {CheckCircle, X} from "lucide-react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

export const Toast: React.FC<ToastProps> = ({message, isVisible, onClose, onAction, actionLabel}) => {
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
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              Success
            </p>
          </div>
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className="ml-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white text-xs font-bold rounded-lg transition-colors border border-green-500/30">
              {actionLabel}
            </button>
          )}
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
