import React from "react";
import {motion, AnimatePresence} from "framer-motion";
import {AlertCircle} from "lucide-react";

interface NoFileConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
}

export const NoFileConfirmModal: React.FC<NoFileConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "No File Uploaded",
  message = "You haven't attached a design file yet. Would you like to proceed with the checkout anyway?",
  confirmLabel = "Checkout Anyway",
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{opacity: 0, scale: 0.95}}
            animate={{opacity: 1, scale: 1}}
            exit={{opacity: 0, scale: 0.95}}
            className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-sm w-full p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">
                {title}
              </h3>
            </div>

            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
              {message}
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={onConfirm}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-pink-100">
                {confirmLabel}
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm uppercase tracking-wider rounded-xl transition-all">
                Go Back
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
