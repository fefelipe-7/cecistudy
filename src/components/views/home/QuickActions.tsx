// Home — "ações rápidas" (foco + revisão) (MOD-001 / B.7).
// Extraído de `HomeView.tsx`.
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Brain } from 'lucide-react';
import { SectionTitle } from '../../ui/SectionTitle';

interface QuickActionsProps {
  dueCardsCount: number;
  onFocus: () => void;
  onReview: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ dueCardsCount, onFocus, onReview }) => (
  <section className="px-0.5">
    <SectionTitle icon={<Clock className="w-4 h-4 text-ceci-brand-strong" />}>
      bora cuidar disso?
    </SectionTitle>
    <div className="grid grid-cols-2 gap-3 pt-3">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onFocus}
        className="bg-ceci-primary hover:bg-ceci-ink text-white rounded-2xl p-5 text-left tap-interactive cursor-pointer space-y-2 shadow-sm min-h-[110px]"
      >
        <Brain className="w-6 h-6 text-rose-200" />
        <p className="text-base font-bold font-display">bora focar?</p>
        <p className="text-[11px] text-white/70">sessão de estudo com timer</p>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onReview}
        className="bg-surface-default hover:border-ceci-border-brand rounded-2xl p-5 text-left border border-ceci-border-default tap-interactive cursor-pointer space-y-2 shadow-sm min-h-[110px]"
      >
        <Clock className="w-6 h-6 text-ceci-brand-strong" />
        <div className="flex items-center gap-2">
          <p className="text-base font-bold font-display text-ceci-primary">revisar</p>
          {dueCardsCount > 0 && (
            <span className="text-[10px] font-bold text-ceci-brand-strong bg-surface-rose px-2 py-0.5 rounded-full border border-ceci-border-brand">
              {dueCardsCount}
            </span>
          )}
        </div>
        <p className="text-[11px] text-ceci-secondary">
          {dueCardsCount > 0 ? `${dueCardsCount} ${dueCardsCount === 1 ? 'cartão vencido' : 'cartões vencidos'}` : 'cartões em dia ♡'}
        </p>
      </motion.button>
    </div>
  </section>
);

export default QuickActions;