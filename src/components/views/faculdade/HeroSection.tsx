// Faculdade — hero: semestre + resumo real (MOD-001 / B.7).
// Extraído de `FaculdadeView.tsx`.
import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Mascote } from '../../ui/Mascote';

interface HeroSectionProps {
  semester: number;
  coursesCount: number;
  pendingExamsCount: number;
  pendingTasksCount: number;
  hasClassesToday: boolean;
  onOpenCalendar: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  semester,
  coursesCount,
  pendingExamsCount,
  pendingTasksCount,
  hasClassesToday,
  onOpenCalendar,
}) => (
  <section className="rounded-[26px] bg-gradient-to-br from-surface-default to-surface-rose border border-ceci-border-subtle shadow-sm p-5 relative overflow-hidden">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-ceci-secondary font-medium lowercase tracking-wide">faculdade</p>
        <h1 className="font-serif-academic text-3xl sm:text-4xl text-ceci-primary mt-0.5 tracking-tight">
          {semester}º semestre
        </h1>
      </div>
      <button
        onClick={onOpenCalendar}
        aria-label="ver calendário"
        className="w-10 h-10 rounded-2xl bg-surface-default/80 border border-ceci-border-default flex items-center justify-center text-ceci-secondary hover:bg-surface-default transition-colors shadow-2xs cursor-pointer shrink-0"
      >
        <CalendarIcon className="w-5 h-5" />
      </button>
    </div>
    <p className="text-xs sm:text-[13px] text-ceci-secondary leading-relaxed mt-2.5 max-w-[92%]">
      {coursesCount} disciplinas · {pendingExamsCount}{' '}
      {pendingExamsCount === 1 ? 'prova' : 'provas'} por vir · {pendingTasksCount}{' '}
      {pendingTasksCount === 1 ? 'tarefa' : 'tarefas'} pendentes.
      {hasClassesToday ? ' e hoje ainda tem aula ♡' : ' respira, vai dar tudo certo ♡'}
    </p>
    <Mascote
      expression="class-ready"
      className="w-16 h-16 absolute -bottom-2 -right-2 opacity-95 pointer-events-none"
      decorative
    />
  </section>
);

export default HeroSection;