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

export type AttentionItem = { kind: 'task' | 'exam'; id: string };

interface AttentionSectionProps {
  items: AttentionItem[];
  remainingCount: number;
}

const AttentionSection: React.FC<AttentionSectionProps> = ({ items, remainingCount }) => {
  const { tasks } = useDataClientCourses();
  const { handleAddTask } = useCoursesActions();
  const { handleNavigate } = useNavValue();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: 'task_' + Date.now(),
      title: newTaskTitle.trim(),
      completed: false,
      priority: 'media',
      category: 'outro'
    };

    handleAddTask(newTask);
    setNewTaskTitle('');
  };

  return (
    <section className="space-y-3 px-0.5">
      <SectionTitle
        icon={<Sparkles className="w-4 h-4 text-rose-500" />}
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

      {/* Captura rápida de tarefa */}
      <form onSubmit={handleAddNewTask} className="flex gap-2 pt-1">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="adicionar uma tarefa para hoje..."
          className="flex-1 text-sm px-4 py-3 rounded-full border border-ceci-border-default bg-surface-default focus:outline-none focus:border-rose-500 text-ceci-primary placeholder-ceci-faded shadow-2xs"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          aria-label="adicionar tarefa"
          className="bg-rose-500 hover:bg-ceci-brand text-white px-4 py-3 rounded-full text-sm font-semibold tap-interactive flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>adicionar</span>
        </motion.button>
      </form>
    </section>
  );
};

export default AttentionSection;