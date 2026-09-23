import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface QuizExplanationOverlayProps {
  /** Texto da explicação */
  explanation: string;
  /** Se a resposta estava correta */
  isCorrect: boolean;
  /** Callback ao fechar (avançar para próxima) */
  onClose: () => void;
}

export const QuizExplanationOverlay: React.FC<QuizExplanationOverlayProps> = ({
  explanation,
  isCorrect,
  onClose,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/30 backdrop-blur-sm'
      )}
    >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-md bg-surface-default rounded-2xl shadow-floating p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isCorrect
                ? 'bg-status-success-surface text-status-success'
                : 'bg-status-danger-surface text-status-danger-strong'
            }`}>
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
            className="w-full mt-5 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-ceci-on-brand bg-ceci-brand hover:bg-ceci-brand-strong cursor-pointer"
          >
            <span>continuar</span>
          </button>
      </motion.div>
    </motion.div>
  );
};