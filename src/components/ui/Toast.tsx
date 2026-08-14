import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { fadeSlide } from '../../lib/motion';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <div className="fixed bottom-24 sm:bottom-28 inset-x-0 z-[60] flex justify-center px-4 pointer-events-none">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            variants={fadeSlide}
            initial="initial"
            animate="animate"
            exit="exit"
            className="px-4 py-2.5 rounded-2xl bg-ceci-primary text-white text-xs font-medium shadow-floating-strong flex items-center gap-2 max-w-[calc(100vw-2rem)]"
          >
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            <span className="truncate">{message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};