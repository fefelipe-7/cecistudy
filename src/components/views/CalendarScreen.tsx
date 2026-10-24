// Calendário (SPEC-024 D1/D3/D5): agenda de 14 dias + mês navegável + painel do
// dia com `+`. Sem grade de horários (D3) e sem escrita no render (I4): tudo é
// derivado de `buildCalendarEntries`, que é a única fonte de eventos (D4).
import React, { useMemo, useState } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import {
  useDataClientApp,
  useDataClientCourses,
  useDataClientStudy,
} from '@/context/DataClientProvider';
import { useNavValue } from '@/context/shellNavContexts';
import { buildCalendarEntries, daysInMonth } from '../../lib/schedule';
import type { CalendarEntry } from '../../lib/schedule';
import { addDaysKey, formatDateBR, todayKeyLocal } from '../../lib/dateBR';
import type { DateKey } from '../../types';
import { VAZIO, frase } from '../../lib/voice';
import CalendarMonth, { dateKeyOf } from './faculdade/CalendarMonth';
import { CalendarEntryRow } from './CalendarEntryRow';
import { TaskSheet } from './home/TaskSheet';
import { MeetingSheet } from '../tcc/MeetingSheet';

type Door = 'task' | 'exam' | 'meeting';

export const CalendarScreen: React.FC = () => {
  const { internshipLogs, tcc, thesisChapters, thesisMeetings, thesisTasks } = useDataClientApp();
  const { courses, exams, tasks } = useDataClientCourses();
  const { sessions } = useDataClientStudy();
  const nav = useNavValue();

  const today = todayKeyLocal();
  const initial = nav.calendarDay ?? today;
  const [selected, setSelected] = useState<DateKey | null>(initial);
  const [year, setYear] = useState(Number(initial.slice(0, 4)));
  const [month, setMonth] = useState(Number(initial.slice(5, 7)));
  const [door, setDoor] = useState<Door | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const entriesFor = (from: DateKey, to: DateKey) =>
    buildCalendarEntries({
      courses,
      exams,
      tasks,
      thesis: tcc,
      chapters: thesisChapters,
      thesisTasks,
      meetings: thesisMeetings,
      internshipLogs,
      studySessions: sessions,
      from,
      to,
    });

  const agenda = useMemo(
    () => entriesFor(today, addDaysKey(today, 13)),
    [
      courses,
      exams,
      tasks,
      tcc,
      thesisChapters,
      thesisTasks,
      thesisMeetings,
      internshipLogs,
      sessions,
      today,
    ],
  );

  const monthEntries = useMemo(
    () => entriesFor(dateKeyOf(year, month, 1), dateKeyOf(year, month, daysInMonth(year, month))),
    [
      courses,
      exams,
      tasks,
      tcc,
      thesisChapters,
      thesisTasks,
      thesisMeetings,
      internshipLogs,
      sessions,
      year,
      month,
    ],
  );

  const agendaGroups = useMemo(() => {
    const groups: { date: DateKey; entries: CalendarEntry[] }[] = [];
    for (const entry of agenda) {
      const last = groups[groups.length - 1];
      if (last?.date === entry.date) last.entries.push(entry);
      else groups.push({ date: entry.date, entries: [entry] });
    }
    return groups;
  }, [agenda]);

  const selectedEntries = selected ? monthEntries.filter((e) => e.date === selected) : [];

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
    setSelected(null);
  };

  const goToday = () => {
    setYear(Number(today.slice(0, 4)));
    setMonth(Number(today.slice(5, 7)));
    setSelected(today);
  };

  const renderEntry = (entry: CalendarEntry) => (
    <CalendarEntryRow key={entry.id} entry={entry} nav={nav} exams={exams} />
  );

  const hasTcc = tcc.title.trim().length > 0;
  const doors: Array<{ id: Door; label: string }> = [
    { id: 'task', label: 'pendência' },
    { id: 'exam', label: 'prova' },
    ...(hasTcc ? [{ id: 'meeting' as Door, label: 'reunião do tcc' }] : []),
  ];

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-5 pb-6">
      <header className="flex items-center gap-2">
        <button
          onClick={nav.closeCalendar}
          aria-label="voltar"
          className="w-9 h-9 rounded-xl bg-surface-default border border-ceci-border-default flex items-center justify-center text-ceci-secondary hover:bg-surface-muted transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h1 className="font-display text-lg font-bold text-ceci-primary">calendário</h1>
      </header>

      {/* agenda: próximos 14 dias, agrupados por dia (D3) */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-ceci-secondary px-0.5">próximos 14 dias</h2>
        {agendaGroups.length === 0 ? (
          <p className="text-xs text-ceci-secondary px-0.5">{frase(VAZIO, 'calendarioVazio')}</p>
        ) : (
          <div className="divide-y divide-ceci-border-subtle rounded-2xl border border-ceci-border-default bg-surface-default px-4">
            {agendaGroups.map((group) => (
              <div key={group.date} className="py-2">
                <p className="text-[11px] font-semibold text-ceci-tertiary">
                  {formatDateBR(group.date)}
                  {group.date === today ? ' · hoje' : ''}
                </p>
                {group.entries.map(renderEntry)}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* mês navegável + painel do dia (D5) */}
      <section className="rounded-2xl border border-ceci-border-default bg-surface-default p-4 space-y-3">
        <CalendarMonth
          year={year}
          month={month}
          entries={monthEntries}
          today={today}
          selected={selected}
          onShift={shiftMonth}
          onToday={goToday}
          onSelect={setSelected}
        />

        {selected && (
          <div className="rounded-xl p-3 bg-surface-subtle border border-ceci-border-subtle space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-ceci-primary">{formatDateBR(selected)}</p>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="adicionar item neste dia"
                className="w-7 h-7 rounded-full bg-ceci-brand-strong text-ceci-on-brand flex items-center justify-center cursor-pointer active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {menuOpen && (
              <div className="flex flex-wrap gap-1.5">
                {doors.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setMenuOpen(false);
                      if (d.id === 'exam') nav.openWizard('exam', undefined, undefined, selected);
                      else setDoor(d.id);
                    }}
                    className="px-3 py-1.5 rounded-full text-[11px] font-semibold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand cursor-pointer"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}

            {selectedEntries.length === 0 ? (
              <p className="text-xs text-ceci-secondary">{frase(VAZIO, 'diaSemNada')}</p>
            ) : (
              <div className="divide-y divide-ceci-border-subtle">
                {selectedEntries.map(renderEntry)}
              </div>
            )}
          </div>
        )}
      </section>

      <TaskSheet
        open={door === 'task'}
        defaultDate={selected ?? undefined}
        onClose={() => setDoor(null)}
      />
      <MeetingSheet
        open={door === 'meeting'}
        meetingId="new"
        intent="agendar"
        defaultDate={selected ?? undefined}
        onClose={() => setDoor(null)}
      />
    </div>
  );
};
