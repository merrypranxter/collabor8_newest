
import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ children, title, onClose }) => {
  return (
    <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto"
        onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-brand-surface/90 backdrop-blur-xl border border-brand-border rounded-2xl shadow-2xl w-full max-w-2xl p-6 md:p-8 relative my-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-silver-gradient">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-brand-text-dark hover:text-white p-1.5 rounded-full hover:bg-white/5 transition-all duration-200"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="text-brand-text-light">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default Modal;
