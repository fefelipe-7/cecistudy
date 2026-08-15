import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import { sheetVariants, OVERLAY_FADE } from '@/lib/motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  position?: 'center' | 'top' | 'bottom';
  closeOnBackdrop?: boolean;
  /** Mostra o "handle" de arrastar (apenas em sheets inferiores). */
  showGrabber?: boolean;
}

const POSITION_CLASSES = {
  center: 'items-center justify-center p-4',
  top: 'items-start justify-center pt-12 sm:pt-20 px-4',
  bottom: 'items-end justify-center sm:items-center',
};

const HANDLE_DRAG_THRESHOLD = 90;
const HANDLE_VELOCITY_THRESHOLD = 600;

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  className,
  position = 'center',
  closeOnBackdrop = true,
  showGrabber,
}) => {
  const dragControls = useDragControls();
  const isBottom = position === 'bottom';
  const withGrabber = isBottom && (showGrabber ?? true);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={OVERLAY_FADE}
          className={cn(
            'fixed inset-0 z-50 flex bg-black/40',
            POSITION_CLASSES[position]
          )}
          onClick={closeOnBackdrop ? onClose : undefined}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            key="modal-panel"
            variants={sheetVariants[position]}
            initial="initial"
            animate="animate"
            exit="exit"
            drag={isBottom ? 'y' : false}
            dragListener={false}
            dragControls={isBottom ? dragControls : undefined}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (
                isBottom &&
                (info.offset.y > HANDLE_DRAG_THRESHOLD || info.velocity.y > HANDLE_VELOCITY_THRESHOLD)
              ) {
                onClose();
              }
            }}
            className={cn('relative', isBottom && 'w-full sm:w-auto', className)}
            onClick={(e) => e.stopPropagation()}
          >
            {withGrabber && (
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="flex items-center justify-center py-2.5 -mb-1 cursor-grab active:cursor-grabbing touch-none"
                aria-hidden
              >
                <span className="w-10 h-1.5 rounded-full bg-ceci-border-strong" />
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};