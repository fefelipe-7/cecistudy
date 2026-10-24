// Linha de um item do calendário (SPEC-024 D4/D13): usada pela tela de
// calendário e pela "atenção de hoje" da Home. O toque abre a entidade real.
import React from 'react';
import type { CalendarEntry, CalendarLayer } from '../../lib/schedule';
import { destinationForEntry } from '../../lib/calendarDestination';
import { formatShortDate } from '../../lib/schedule';
import type { Exam } from '../../types';
import type { NavigationValue } from '../../context/navigationEngine';

export const KIND_LABEL: Record<CalendarEntry['kind'], string> = {
  aula: 'aula',
  prova: 'prova',
  tarefa: 'tarefa',
  tcc: 'tcc',
  estagio: 'estágio',
  estudo: 'estudo',
};

export const LAYER_CHIP: Record<CalendarLayer, string> = {
  faculdade: 'text-ceci-academic-strong bg-surface-default border-ceci-border-academic',
  tcc: 'text-ceci-primary bg-surface-rose border-ceci-border-brand',
  estudos: 'text-ceci-brand-strong bg-surface-default border-ceci-border-brand',
  estagio: 'text-ceci-brand-strong bg-surface-rose border-ceci-border-brand',
};

export type EntryNav = Pick<
  NavigationValue,
  'openCourseDetail' | 'openTccScreen' | 'openInternshipDiary' | 'openStudy' | 'openManageItem'
>;

interface CalendarEntryRowProps {
  entry: CalendarEntry;
  nav: EntryNav;
  exams: Exam[];
  /** A Home não agrupa por dia, então mostra a data na própria linha. */
  showDate?: boolean;
}

export const CalendarEntryRow: React.FC<CalendarEntryRowProps> = ({
  entry,
  nav,
  exams,
  showDate = false,
}) => {
  const go = destinationForEntry(entry, nav, exams);
  const when = entry.start ? `${entry.start}${entry.end ? `–${entry.end}` : ''}` : null;

  return (
    <button
      type="button"
      onClick={go ?? undefined}
      disabled={!go}
      className="w-full py-2 flex items-center justify-between gap-3 text-left cursor-pointer hover:opacity-80 transition-opacity disabled:cursor-default"
    >
      <div className="min-w-0 flex items-baseline gap-2">
        {showDate && (
          <span className="text-[10px] font-semibold text-ceci-tertiary tabular-nums shrink-0">
            {formatShortDate(entry.date)}
          </span>
        )}
        {when && (
          <span className="text-[10px] font-semibold text-ceci-tertiary tabular-nums shrink-0">
            {when}
          </span>
        )}
        <h3 className="font-semibold text-xs text-ceci-primary line-clamp-1">{entry.title}</h3>
      </div>
      <span
        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${LAYER_CHIP[entry.layer]}`}
      >
        {KIND_LABEL[entry.kind]}
      </span>
    </button>
  );
};
