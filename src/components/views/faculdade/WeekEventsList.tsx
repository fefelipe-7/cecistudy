// Faculdade — coluna direita: "sua semana acadêmica" (MOD-001 / B.7).
// Extraído de `FaculdadeView.tsx`.
import React from 'react';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import type { Course } from '../../../types';
import type { CalendarEvent } from '../../../lib/schedule';
import { SectionTitle } from '../../ui/SectionTitle';
import { formatShortDate } from '../../../lib/schedule';

interface WeekEventsListProps {
  weekEvents: CalendarEvent[];
  courses: Course[];
  eventDestination: (ev: CalendarEvent) => (() => void) | null;
}

const WeekEventsList: React.FC<WeekEventsListProps> = ({
  weekEvents,
  courses,
  eventDestination,
}) => (
  <section className="space-y-2.5 px-0.5 pt-6 lg:pt-0">
    <SectionTitle icon={<CalendarIcon className="w-4 h-4 text-ceci-brand-strong" />} action={
      <span className="text-[11px] text-ceci-tertiary font-medium">próximos eventos</span>
    }>
      sua semana acadêmica
    </SectionTitle>

    <div className="divide-y divide-ceci-border-default border-y border-ceci-border-default pt-3">
      {weekEvents.length === 0 && (
        <div className="py-4 text-center">
          <p className="text-xs text-ceci-secondary">
            sem eventos próximos anotados. que tal registrar uma prova ou tarefa?
          </p>
        </div>
      )}

      {weekEvents.map((ev) => {
        const evCourse = ev.courseId ? courses.find((c) => c.id === ev.courseId)?.name : undefined;
        const kindLabel = ev.kind === 'prova' ? 'prova' : ev.kind === 'tarefa' ? 'tarefa' : 'estágio';
        const dest = eventDestination(ev);
        const inner = (
          <>
            <div className="min-w-0">
              <h3 className="font-bold text-xs text-ceci-primary line-clamp-1">{ev.title}</h3>
              <p className="text-[11px] text-ceci-secondary mt-0.5">
                {kindLabel}{evCourse ? ` · ${evCourse}` : ''}
              </p>
            </div>
            <span className="text-[11px] font-bold text-ceci-brand-strong bg-surface-rose px-2.5 py-0.5 rounded-full border border-ceci-border-brand shrink-0">
              {formatShortDate(ev.date)}
            </span>
          </>
        );
        return dest ? (
          <button
            key={ev.id}
            onClick={dest}
            className="w-full py-2.5 flex items-center justify-between gap-3 text-left cursor-pointer group"
          >
            {inner}
            <ChevronRight className="w-3.5 h-3.5 text-ceci-faded group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>
        ) : (
          <div key={ev.id} className="py-2.5 flex items-center justify-between gap-3">
            {inner}
          </div>
        );
      })}
    </div>
  </section>
);

export default WeekEventsList;