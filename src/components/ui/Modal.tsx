import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, useIsPresent } from 'framer-motion';
import { cn } from '@/lib/utils';
import { sheetVariants, OVERLAY_FADE } from '@/lib/motion';
import { isTopOverlay, pushOverlay, removeOverlay } from '@/lib/overlayStack';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  position?: 'center' | 'top' | 'bottom';
  closeOnBackdrop?: boolean;
  /** Mostra o "handle" de arrastar (apenas em sheets inferiores). */
  showGrabber?: boolean;
  /** id do elemento que rotula o diálogo (replicado em `aria-labelledby`). */
  labelledBy?: string;
}

const POSITION_CLASSES = {
  // Safe area no contêiner (SPEC-M-027 F2.2): o `p-4` sozinho deixa o painel
  // sob o notch/home indicator. `env()` é lido, nunca animado.
  center:
    'items-center justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]',
  top: 'items-start justify-center px-4 pt-[max(3rem,env(safe-area-inset-top))]',
  bottom:
    'items-end justify-center pb-[env(safe-area-inset-bottom)] sm:items-center sm:pb-0',
};

/** Altura máxima previsível com safe area; só o painel rola (docs/modais-wizards.md §2.2). */
const PANEL_SCROLL_CLASSES =
  'max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain outline-none';

const HANDLE_DRAG_THRESHOLD = 90;
const HANDLE_VELOCITY_THRESHOLD = 600;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Overlay do modal. Existe como componente próprio por um motivo só: `useIsPresent`
 * só funciona dentro de um filho do `AnimatePresence`, e é ele que diz quando o
 * painel está **saindo** — nesse intervalo o overlay precisa de `inert` para não
 * ser focalizável (SPEC-M-027 D7/D8).
 */
const ModalOverlay: React.FC<{
  className: string;
  onClick?: () => void;
  labelledBy?: string;
  children: React.ReactNode;
}> = ({ className, onClick, labelledBy, children }) => {
  const isPresent = useIsPresent();
  return (
    <motion.div
      key="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={OVERLAY_FADE}
      inert={!isPresent}
      aria-hidden={!isPresent}
      className={className}
      onClick={onClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      {children}
    </motion.div>
  );
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  className,
  position = 'center',
  closeOnBackdrop = true,
  showGrabber,
  labelledBy,
}) => {
  const dragControls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const overlayIdRef = useRef<number | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const isBottom = position === 'bottom';
  const withGrabber = isBottom && (showGrabber ?? true);

  // Registra na pilha (SPEC-M-027 D8): trava scroll, aplica `inert` no conteúdo
  // de trás e define quem responde ao `Esc`. Vem **antes** do efeito de foco:
  // o cleanup daqui devolve o `inert`, e só depois o foco pode voltar ao
  // disparador — focar dentro de um `#root` inerte seria ignorado.
  useEffect(() => {
    if (!open) return;
    const id = pushOverlay(() => closeRef.current());
    overlayIdRef.current = id;
    return () => {
      removeOverlay(id);
      overlayIdRef.current = null;
    };
  }, [open]);

  // Foco inicial no painel + retorno ao disparador ao fechar (§2.2).
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Só o topo fecha (SPEC-M-027 I6). Com dois modais abertos, cada um tem
        // o próprio listener — sem o teste de topo, os dois fechavam juntos.
        if (overlayIdRef.current !== null && isTopOverlay(overlayIdRef.current)) {
          onClose();
        }
        return;
      }
      // Focus trap — o foco não escapa do diálogo (§2.2).
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <ModalOverlay
          className={cn(
            'fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm',
            POSITION_CLASSES[position],
          )}
          onClick={closeOnBackdrop ? onClose : undefined}
          labelledBy={labelledBy}
        >
          <motion.div
            key="modal-panel"
            ref={panelRef}
            tabIndex={-1}
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
                (info.offset.y > HANDLE_DRAG_THRESHOLD ||
                  info.velocity.y > HANDLE_VELOCITY_THRESHOLD)
              ) {
                onClose();
              }
            }}
            className={cn(
              'relative outline-none',
              PANEL_SCROLL_CLASSES,
              isBottom && 'w-full sm:w-auto',
              className,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {withGrabber && (
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="flex items-center justify-center py-2.5 -mb-1 cursor-grab active:cursor-grabbing touch-none sticky top-0 z-10"
                aria-hidden
              >
                <span className="w-10 h-1.5 rounded-full bg-ceci-border-strong" />
              </div>
            )}
            {children}
          </motion.div>
        </ModalOverlay>
      )}
    </AnimatePresence>,
    document.body,
  );
};
