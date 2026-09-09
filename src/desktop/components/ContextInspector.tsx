import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Flame,
  CalendarClock,
  Sparkles,
} from 'lucide-react';
import { useDesktopApp } from '@/context/desktopApp';
import { Panel } from './ui/Panel';

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function formatSchedule(slots: { day: number; start: string; end?: string }[]): string {
  return slots
    .map((s) => `${WEEKDAYS[s.day] ?? '?'} ${s.start}${s.end ? `-${s.end}` : ''}`)
    .join(' · ');
}

function Row({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[10px] px-2 py-1.5">
      <Icon className="h-4 w-4 shrink-0 text-ceci-tertiary" aria-hidden />
      <span className="w-20 shrink-0 text-[11px] text-ceci-muted">{label}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-ceci-primary">{value}</span>
    </div>
  );
}

/**
 * Painel contextual da casca desktop (JSON: contextInspector, 320px, colapsável).
 * Sempre secundário — nunca compete com o canvas. Mostra o contexto da tela ativa:
 * curso em foco (fatos + progresso) ou resumo leve do dia. Sem rosa de fundo.
 */
export const ContextInspector: React.FC<{ open: boolean; onToggle: () => void }> = ({
  open,
  onToggle,
}) => {
  const app = useDesktopApp();
  const { focusedCourse, exams, tasks, streakStats } = app;

  if (!open) {
    return (
      <button
        onClick={onToggle}
        aria-label="expandir painel de contexto"
        className="flex h-full w-10 shrink-0 flex-col items-center pt-3 transition-colors hover:bg-black/[0.02]"
        style={{ background: 'var(--ds-surface-inspector)', borderLeft: '1px solid var(--ds-border-default)' }}
      >
        <ChevronLeft className="h-4 w-4 text-ceci-tertiary" />
      </button>
    );
  }

  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const nextExam = exams
    .filter((e) => !e.completed)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))[0];

  return (
    <aside
      className="flex h-full w-80 shrink-0 flex-col"
      style={{ background: 'var(--ds-surface-inspector)', borderLeft: '1px solid var(--ds-border-default)' }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--ds-border-subtle)' }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ceci-muted">
          contexto
        </span>
        <button
          onClick={onToggle}
          aria-label="recolher painel de contexto"
          className="rounded-[8px] p-1 text-ceci-tertiary transition-colors hover:bg-black/[0.04]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {focusedCourse ? (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ceci-muted">
                disciplina
              </p>
              <h3 className="mt-1 font-display text-[16px] font-semibold text-ceci-primary">
                {focusedCourse.name}
              </h3>
            </div>

            <div className="flex flex-col gap-0.5">
              {focusedCourse.professor && (
                <Row icon={User} label="professor" value={focusedCourse.professor} />
              )}
              {focusedCourse.room && <Row icon={MapPin} label="sala" value={focusedCourse.room} />}
              {focusedCourse.schedule.length > 0 && (
                <Row icon={Clock} label="horário" value={formatSchedule(focusedCourse.schedule)} />
              )}
            </div>

            <button
              onClick={() => app.openStudy('focus')}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-xs font-semibold transition-colors"
              style={{ background: 'var(--ds-accent-subtle)', color: 'var(--ds-accent-strong)' }}
            >
              <Sparkles className="h-3 w-3" /> bora focar?
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ceci-muted">
              resumo do dia
            </p>
            <Row
              icon={CalendarClock}
              label="próxima prova"
              value={nextExam ? nextExam.title : 'nada por aqui ✨'}
            />
            <Row icon={Sparkles} label="tarefas" value={`${pendingTasks} pendente${pendingTasks === 1 ? '' : 's'}`} />
            <Row icon={Flame} label="ofensiva" value={`${streakStats.current} dias`} />

            <Panel className="p-3.5">
              <p className="text-xs font-semibold text-ceci-primary">dica do cecinho</p>
              <p className="mt-1 text-[11px] leading-relaxed text-ceci-secondary">
                que tal começar pelos cartões rápidos de revisão? um pouquinho de foco com leveza ♡
              </p>
            </Panel>
          </div>
        )}
      </div>
    </aside>
  );
};
