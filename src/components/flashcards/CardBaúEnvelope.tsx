import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Mascote } from '../ui/Mascote';

export interface CardBaúEnvelopeProps {
  /** Abre a tampa e revela o cartão guardado. */
  open: boolean;
  /** Conteúdo do mini-card que "cai na caixinha". */
  card?: { question: string; answer: string };
  label?: string;
  className?: string;
}

/**
 * Baú/caixinha de cartões temática (identidade cecistudy ♡): tampa que abre
 * (`rotateX`, origem na base do baú) + mini-card revelado com `layoutId`
 * compartilhado (magic motion a partir do card-form da revisão). Decorativo —
 * o commit do salvamento acontece de forma síncrona e nunca é bloqueado por ele.
 */
export const CardBaúEnvelope: React.FC<CardBaúEnvelopeProps> = ({
  open,
  card,
  label = 'guardado no baú ♡',
  className,
}) => (
  <div className={cn('relative', className)} data-testid="card-baú">
    <div className="relative w-56 h-36 rounded-2xl bg-gradient-to-br from-surface-rose to-surface-blue border border-ceci-border-brand shadow-[0_12px_28px_rgba(64,56,58,0.14),inset_0_-8px_14px_rgba(64,56,58,0.08)]">
      {/* cartão lá dentro (magic motion, mesmo layoutId do card-form) */}
      <AnimatePresence>
        {open && card && (
          <motion.div
            layoutId="baú-card"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 26 } }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-5 bottom-4 top-3 flex flex-col items-center justify-center gap-1 rounded-xl bg-surface-default border border-ceci-border-default p-3 text-center shadow-sm"
          >
            <span className="text-[9px] font-bold uppercase tracking-wider text-ceci-muted">pergunta</span>
            <span className="text-[11px] font-bold text-ceci-primary leading-snug line-clamp-2">
              {card.question}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* tampa do baú (abre para trás: rotateX em torno da base) */}
    <motion.div
      className="absolute -top-2.5 inset-x-0 h-8 rounded-t-2xl bg-surface-rose border border-b-0 border-ceci-border-brand shadow-sm"
      style={{ transformOrigin: 'center bottom' }}
      animate={{ rotateX: open ? -110 : 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      aria-hidden="true"
    />

    {label && (
      <p className="mt-3 text-center text-sm font-bold text-ceci-primary">{label}</p>
    )}

    <Mascote
      expression="celebrate-small"
      decorative
      className="absolute -right-5 -bottom-4 w-12 h-12 pointer-events-none"
    />
  </div>
);

export default CardBaúEnvelope;