import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', className = '' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-5xl',
    full: 'max-w-none h-screen rounded-none'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          <div className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none ${size === 'full' ? 'p-0' : 'p-4'}`}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`bg-card border border-border w-full shadow-2xl pointer-events-auto overflow-hidden flex flex-col ${
                size === 'full' ? 'h-screen' : 'max-h-[90vh]'
              } ${sizeClasses[size]} ${className}`}
            >
              <div className={`flex items-center justify-between p-6 border-b border-border/50 ${size === 'full' && !title ? 'hidden' : ''}`}>
                <h2 className="font-display font-semibold text-xl">{title}</h2>
                <button 
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>
              <div className={`overflow-y-auto flex-1 ${size === 'full' ? 'p-0' : 'p-6'}`}>
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
