import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { fadeSlide } from '../../lib/motion';

/**
 * Ação opcional do toast (ex.: "desfazer" na virada de semestre).
 *
 * O botão fica dentro da pílula, então precisa de `pointer-events-auto` — o
 * contêiner do toast é `pointer-events-none` para não bloquear a tela.
 */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastState {
  message: string;
  action?: ToastAction;
}

interface ToastProps {
  toast: ToastState | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  const action = toast?.action;
  return (
    <div className="fixed bottom-24 sm:bottom-28 inset-x-0 z-[60] flex justify-center px-4 pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            // a chave inclui a ação: dois toasts com a mesma mensagem mas ações
            // diferentes (ex.: "guardado ♡" e "virado ♡ · desfazer") precisam
            // re-animar em vez de reaproveitar a pílula anterior
            key={`${toast.message}|${action?.label ?? ''}`}
            variants={fadeSlide}
            initial="initial"
            animate="animate"
            exit="exit"
            className="py-2.5 px-4 rounded-2xl bg-ceci-primary text-ceci-on-primary text-xs font-medium shadow-floating-strong flex items-center gap-2 max-w-[calc(100vw-2rem)]"
          >
            <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
            <span className="truncate">{toast.message}</span>
            {action && (
              <button
                type="button"
                onClick={action.onClick}
                // não some junto com o timeout do toast: a janela de 8s é do
                // desfazer, e sumir o botão antes dela deixaria a usuária sem
                // nenhuma forma de reverter
                className="pointer-events-auto shrink-0 rounded-full bg-ceci-on-primary/15 px-2.5 py-1 font-semibold text-ceci-on-primary hover:bg-ceci-on-primary/25 active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
