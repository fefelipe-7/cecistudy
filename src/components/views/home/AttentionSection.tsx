// Home — "sua atenção hoje": tarefas + provas fundidas + captura rápida (MOD-001 / B.7).
// Extraído de `HomeView.tsx`.
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Plus } from 'lucide-react';
import type { Task } from '../../../types';
import { useDataClientCourses } from '@/context/DataClientProvider';
import { useCoursesActions, useNavValue } from '@/context/shellNavContexts';
import { SectionTitle } from '../../ui/SectionTitle';
import { TaskRow, ExamRow } from './rows';
import { TaskSheet } from './TaskSheet';

export type AttentionItem = { kind: 'task' | 'exam'; id: string };

interface AttentionSectionProps {
  items: AttentionItem[];
  remainingCount: number;
}

const AttentionSection: React.FC<AttentionSectionProps> = ({ items, remainingCount }) => {
  const { tasks } = useDataClientCourses();
  const { handleAddTask } = useCoursesActions();
  const { handleNavigate } = useNavValue();
  const [openTaskSheet, setOpenTaskSheet] = useState(false);

  return (
    <section className="space-y-3 px-0.5">
      <SectionTitle
        icon={<Sparkles className="w-4 h-4 text-ceci-brand-strong" />}
        action={
          remainingCount > 0 ? (
            <button
              onClick={() => handleNavigate('faculdade')}
              className="text-xs font-bold text-ceci-brand-strong hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : undefined
        }
      >
        sua atenção hoje
      </SectionTitle>

      {items.length > 0 ? (
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {items.map((item) =>
              item.kind === 'task' ? (
                <TaskRow key={item.id} task={tasks.find((t) => t.id === item.id)!} />
              ) : (
                <ExamRow key={item.id} examId={item.id} />
              )
            )}
          </AnimatePresence>
          {remainingCount > 0 && (
            <p className="text-[11px] text-ceci-secondary px-1">
              + {remainingCount} {remainingCount === 1 ? 'item pendente' : 'itens pendentes'} aguardando por você ♡
            </p>
          )}
        </div>
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
