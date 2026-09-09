import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  RefreshCw,
} from 'lucide-react';

export type CalendarView = 'dia' | 'semana' | 'mes' | 'agenda';

interface CalendarToolbarProps {
  title: string;
  subtitle?: string;
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSearch: () => void;
  onNew: () => void;
}

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: 'dia', label: 'dia' },
  { value: 'semana', label: 'semana' },
  { value: 'mes', label: 'mês' },
  { value: 'agenda', label: 'agenda' },
];

/**
 * Barra de ferramentas do calendário desktop: hoje, navegação, título,
 * seletor de vista (Dia/Semana/Mês/Agenda), busca, novo e indicador de sync.
 */
export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  title,
  subtitle,
  view,
  onViewChange,
  onToday,
  onPrev,
  onNext,
  onSearch,
  onNew,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToday}
          className="rounded-[10px] border border-ceci-border-default bg-[var(--ds-surface-raised)] px-3 py-1.5 text-sm font-medium text-ceci-primary transition-colors hover:bg-black/[0.03]"
        >
          hoje
        </button>
        <div className="flex gap-0.5">
          <button
            type="button"
            onClick={onPrev}
            aria-label="período anterior"
            className="rounded-[10px] p-1.5 text-ceci-secondary transition-colors hover:bg-black/[0.04]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="próximo período"
            className="rounded-[10px] p-1.5 text-ceci-secondary transition-colors hover:bg-black/[0.04]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <h1 className="font-display text-lg font-semibold text-ceci-primary">
          {title}
        </h1>
        {subtitle && (
          <span className="ml-1 text-sm text-ceci-muted">· {subtitle}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-0.5 rounded-[10px] bg-[var(--ds-surface-input)] p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => onViewChange(v.value)}
              aria-pressed={view === v.value}
              className={`rounded-[8px] px-3 py-1.5 text-sm font-medium transition-colors ${
                view === v.value
                  ? 'bg-surface-default text-ceci-brand-strong shadow-xs'
                  : 'text-ceci-secondary hover:text-ceci-primary'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onSearch}
          aria-label="buscar"
          className="flex items-center gap-1.5 rounded-[10px] border border-ceci-border-default bg-[var(--ds-surface-raised)] px-3 py-1.5 text-sm text-ceci-muted transition-colors hover:border-ceci-border-strong"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">buscar…</span>
        </button>

        <button
          type="button"
          onClick={onNew}
          className="flex items-center gap-1.5 rounded-[10px] bg-[var(--color-ceci-primary)] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-ceci-primary-hover"
        >
          <Plus className="h-3.5 w-3.5" />
          novo
        </button>

        <div className="hidden items-center gap-1 text-xs text-[var(--ds-status-success)] xl:flex">
          <RefreshCw className="h-3 w-3" />
          sincronizado
        </div>
      </div>
    </div>
  );
};
