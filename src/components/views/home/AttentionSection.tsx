// Home — "sua atenção hoje": tarefas + provas fundidas + captura rápida (MOD-001 / B.7).
// Extraído de `HomeView.tsx`.
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Plus } from 'lucide-react';
import { useDataClientCourses } from '@/context/DataClientProvider';
import { useNavValue } from '@/context/shellNavContexts';
import { useMotionProfile } from '@/components/motion/MotionProfileProvider';
import type { CalendarEntry } from '../../../lib/schedule';
import { SectionTitle } from '../../ui/SectionTitle';
import { TaskRow } from './rows';
import { TaskSheet } from './TaskSheet';
import { CalendarEntryRow } from '../CalendarEntryRow';

/**
 * Item da "atenção de hoje". Tarefa sem prazo mantém a linha rica (`rows.tsx`);
 * tudo o que tem data vem do agregador e usa a linha do calendário (`D13`).
 */
export type AttentionItem =
  | { kind: 'task'; id: string }
  | { kind: 'calendar'; entry: CalendarEntry };

interface AttentionSectionProps {
  items: AttentionItem[];
  remainingCount: number;
  /** Na primeira montagem da aba, a lista entra com uma coreografia curta (D27). */
  entrada?: boolean;
}

const AttentionSection: React.FC<AttentionSectionProps> = ({
  items,
  remainingCount,
  entrada = false,
}) => {
  const { tasks, exams } = useDataClientCourses();
  const nav = useNavValue();
  const [openTaskSheet, setOpenTaskSheet] = useState(false);
  const profile = useMotionProfile();

  return (
    <section className="space-y-3 px-0.5">
      <SectionTitle
        icon={<Sparkles className="w-4 h-4 text-ceci-brand-strong" />}
        action={
          <button
            onClick={() => nav.openCalendar()}
            className="text-xs font-bold text-ceci-brand-strong hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>ver todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      >
        sua atenção hoje
      </SectionTitle>

      {items.length > 0 ? (
        <motion.div
          className="space-y-2.5"
          initial={entrada ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: profile.d.micro }}
        >
          <AnimatePresence mode="popLayout">
            {items.map((item) => {
              if (item.kind === 'calendar') {
                // `popLayout` exige filho `motion` direto (SPEC-M-028 D27) e a
                // linha do calendário não pode importar o runtime (ratchet I1):
                // quem dona a presença envolve aqui.
                return (
                  <motion.div
                    key={item.entry.id}
                    layout
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: profile.d.micro }}
                  >
                    <CalendarEntryRow entry={item.entry} nav={nav} exams={exams} showDate />
                  </motion.div>
                );
              }
              return <TaskRow key={item.id} task={tasks.find((t) => t.id === item.id)!} />;
            })}
          </AnimatePresence>
          {remainingCount > 0 && (
            <p className="text-[11px] text-ceci-secondary px-1">
              + {remainingCount} {remainingCount === 1 ? 'item pendente' : 'itens pendentes'}{' '}
              aguardando por você ♡
            </p>
          )}
        </motion.div>
      ) : (
        <div className="p-5 rounded-xl bg-surface-default border border-ceci-border-subtle shadow-sm text-center space-y-1">
          <p className="text-sm font-display font-semibold text-ceci-primary">
            nada urgente por aqui ✨
          </p>
          <p className="text-xs text-ceci-secondary">
            dia livre! que tal adiantar uma revisão ou uma leitura?
          </p>
        </div>
      )}

      {/* Captura de tarefa com steps — abre um sheet de fundo para preencher tudo */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpenTaskSheet(true)}
        aria-label="adicionar tarefa"
        className="flex w-full items-center gap-2 bg-ceci-brand hover:bg-ceci-brand text-ceci-on-brand px-4 py-3 rounded-full text-sm font-semibold tap-interactive cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>adicionar tarefa</span>
      </motion.button>

      <TaskSheet open={openTaskSheet} onClose={() => setOpenTaskSheet(false)} />
    </section>
  );
};

export default AttentionSection;
