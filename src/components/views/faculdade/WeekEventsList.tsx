// Faculdade — coluna direita: "sua semana acadêmica" (MOD-001 / B.7).
// Lê o agregador único (SPEC-024 D4/D13) — antes era uma projeção parcial.
import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { CalendarEntry } from '../../../lib/schedule';
import type { Exam } from '../../../types';
import { SectionTitle } from '../../ui/SectionTitle';
import { CalendarEntryRow, type EntryNav } from '../CalendarEntryRow';

interface WeekEventsListProps {
  entries: CalendarEntry[];
  nav: EntryNav;
  exams: Exam[];
}

const WeekEventsList: React.FC<WeekEventsListProps> = ({ entries, nav, exams }) => (
  <section className="space-y-2.5 px-0.5 pt-6 lg:pt-0">
    <SectionTitle
      icon={<CalendarIcon className="w-4 h-4 text-ceci-brand-strong" />}
      action={<span className="text-[11px] text-ceci-tertiary font-medium">próximos eventos</span>}
    >
      sua semana acadêmica
    </SectionTitle>

    <div className="divide-y divide-ceci-border-default border-y border-ceci-border-default pt-3">
      {entries.length === 0 && (
        <div className="py-4 text-center">
          <p className="text-xs text-ceci-secondary">
            sem eventos próximos anotados. que tal registrar uma prova ou tarefa?
          </p>
        </div>
      )}

      {entries.map((entry) => (
        <CalendarEntryRow
          key={entry.id}
          entry={entry}
          nav={nav}
          exams={exams}
          showDate
        />
      ))}
    </div>
  </section>
);

export default WeekEventsList;
