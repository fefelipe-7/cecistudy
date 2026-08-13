import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  position?: 'center' | 'top' | 'bottom';
  closeOnBackdrop?: boolean;
}

const POSITION_CLASSES = {
  center: 'items-center justify-center',
  top: 'items-start justify-center pt-12 sm:pt-20',
  bottom: 'items-end justify-center sm:items-center',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  className,
  position = 'center',
  closeOnBackdrop = true,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex bg-black/40 backdrop-blur-xs animate-in fade-in duration-200',
        POSITION_CLASSES[position]
      )}
      onClick={closeOnBackdrop ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div className={cn('relative', className)} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};
