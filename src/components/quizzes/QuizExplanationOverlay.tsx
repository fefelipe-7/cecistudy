import React from 'react';
import { cn } from '../../lib/utils';
import { Modal } from '../ui/Modal';

interface QuizExplanationOverlayProps {
  /** Se o painel está aberto. */
  open: boolean;
  /** Texto da explicação */
  explanation: string;
  /** Se a resposta estava correta */
  isCorrect: boolean;
  /** Callback ao fechar (avançar para próxima) */
  onClose: () => void;
}

/**
 * Explicação da resposta como bottom sheet na pilha de overlays (SPEC-M-028
 * F5.6). Sai do `motion` direto: entra/sai pelo `Modal` (que já anima a folha
 * inferior) e registra na `overlayStack`, então o `Esc`/back fecha só o topo.
 */
export const QuizExplanationOverlay: React.FC<QuizExplanationOverlayProps> = ({
  open,
  explanation,
  isCorrect,
  onClose,
}) => (
  <Modal open={open} onClose={onClose} position="bottom" closeOnBackdrop>
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 mb-2">
        <span
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isCorrect
              ? 'bg-status-success-surface text-status-success'
              : 'bg-status-danger-surface text-status-danger-strong'
          }`}
        >
          {isCorrect ? '✓' : '✗'}
        </span>
        <h3 className="font-display font-bold text-lg text-ceci-primary">
          {isCorrect ? 'Correto! ♡' : 'Quase lá...'}
        </h3>
      </div>

      <div className="rounded-xl p-4 bg-surface-muted text-sm text-ceci-secondary leading-relaxed">
        <span className="font-semibold text-ceci-primary">Explicação:</span>{' '}
        {explanation}
      </div>

      <button
        onClick={onClose}
        className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-ceci-on-brand bg-ceci-brand hover:bg-ceci-brand-strong cursor-pointer tap-interactive"
      >
        <span>continuar</span>
      </button>
    </div>
  </Modal>
);
