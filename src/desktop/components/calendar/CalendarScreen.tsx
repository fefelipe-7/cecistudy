import React, { useMemo, useState } from 'react';
import { useDesktopApp } from '@/context/desktopApp';
import {
  buildCalendarWeek,
  monthName,
  type CalendarLayer,
  type CalendarEntry,
  type DayCalendarEntries,
  type TimedEntry,
} from '@/lib/schedule';
import { CalendarToolbar, type CalendarView } from './CalendarToolbar';
import { CalendarLayerToggle } from './CalendarLayerToggle';
import { WeekHeader } from './WeekHeader';
import { AllDayRow } from './AllDayRow';
import { WeekGrid } from './WeekGrid';
import { type ReschedulePayload } from './DraggableTimedEvent';
import { type RescheduleDayPayload } from './DraggableAllDayEvent';
import { CalendarContextPanel } from './CalendarContextPanel';
import { MonthView } from './MonthView';
import { AgendaView } from './AgendaView';

const keyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;

function mondayOf(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Tela de calendário desktop. Pluga na casca existente (reaproveita
 * DesktopSidebar/Topbar) e renderiza sua própria toolbar, filtro de camadas,
 * grade semanal (Dia/Semana), mês e agenda, com painel de contexto à direita.
 * Eventos vêm do estado real do app (camadas Faculdade / TCC / Estudos).
 */
export const CalendarScreen: React.FC = () => {
  const app = useDesktopApp();
  const [view, setView] = useState<CalendarView>('semana');
  const [refDate, setRefDate] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visible, setVisible] = useState<Record<CalendarLayer, boolean>>({
    faculdade: true,
    tcc: true,
    estudos: true,
    gcal: true,
  });

  const weekDays = useMemo(() => {
    const mon = mondayOf(refDate);
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      return d;
    });
  }, [refDate]);

  const todayKey = keyOf(new Date());
  const currentIdx = weekDays.findIndex((d) => keyOf(d) === todayKey);

  const weekData = useMemo(
    () =>
      buildCalendarWeek({
        weekDays,
        courses: app.courses,
        exams: app.exams,
        tasks: app.tasks,
        sessions: app.sessions,
        tcc: app.tcc,
      }),
    [weekDays, app.courses, app.exams, app.tasks, app.sessions, app.tcc],
  );

  // filtra por camadas visíveis
  const filtered = useMemo(() => {
    const out: Record<number, DayCalendarEntries> = {};
    Object.entries(weekData).forEach(([k, day]) => {
      out[Number(k)] = {
        timed: day.timed.filter((e) => visible[e.layer]),
        allDay: day.allDay.filter((e) => visible[e.layer]),
      };
    });
    return out;
  }, [weekData, visible]);

  const allEntries = useMemo(() => {
    const map = new Map<string, CalendarEntry>();
    Object.values(filtered).forEach((day) => {
      day.timed.forEach((e) => map.set(e.id, e));
      day.allDay.forEach((e) => map.set(e.id, e));
    });
    return map;
  }, [filtered]);

  const timedByDay = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filtered).map(([k, v]) => [Number(k), v.timed]),
      ) as Record<number, TimedEntry[]>,
    [filtered],
  );
  const allDayByDay = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filtered).map(([k, v]) => [Number(k), v.allDay]),
      ) as Record<number, CalendarEntry[]>,
    [filtered],
  );

  const selectedEntry = selectedId ? allEntries.get(selectedId) ?? null : null;

  const select = (e: CalendarEntry) => setSelectedId(e.id);

  const navigate = (dir: number) => {
    const d = new Date(refDate);
    if (view === 'mes') d.setMonth(d.getMonth() + dir);
    else if (view === 'dia') d.setDate(d.getDate() + dir);
    else d.setDate(d.getDate() + dir * 7);
    setRefDate(d);
    setSelectedId(null);
  };

  const goToday = () => {
    setRefDate(new Date());
    setSelectedId(null);
  };

  const title = monthName(refDate.getFullYear(), refDate.getMonth() + 1);
  const subtitle =
    view === 'semana'
      ? `sem. ${weekDays[0].getDate()} — ${weekDays[4].getDate()}`
      : undefined;

  const onToggleStage = (stageId: string) => {
    if (!selectedEntry || selectedEntry.layer !== 'tcc' || !app.tcc) return;
    const idx = Number(stageId.replace('tcc-ch-', ''));
    if (Number.isNaN(idx)) return;
    const chapters = app.tcc.chapters.map((c, i) =>
      i === idx ? { ...c, completed: !c.completed } : c,
    );
    app.handleUpdateTcc({ ...app.tcc, chapters });
  };

  const onStartTimer = () => app.openStudy('focus');

  const applyReschedule = (
    entry: CalendarEntry,
    newDate: string,
    newStart?: string,
    newEnd?: string,
  ) => {
    switch (entry.entryRef) {
      case 'exam': {
        const exam = app.exams.find((e) => e.id === entry.dataId);
        if (exam) app.handleUpdateExam({ ...exam, date: newDate, time: newStart ?? exam.time });
        break;
      }
      case 'session': {
        const s = app.sessions.find((x) => x.id === entry.dataId);
        if (s) app.handleUpdateSession({ ...s, date: newDate, startTime: newStart ?? s.startTime });
        break;
      }
      case 'tccChapter': {
        const idx = Number(entry.dataId);
        if (app.tcc && !Number.isNaN(idx)) {
          const chapters = app.tcc.chapters.map((c, i) =>
            i === idx ? { ...c, dueDate: newDate } : c,
          );
          app.handleUpdateTcc({ ...app.tcc, chapters });
        }
        break;
      }
      case 'task': {
        if (entry.dataId) app.handleUpdateTask(entry.dataId, { dueDate: newDate });
        break;
      }
    }
    app.showToast('reagendado com carinho ♡');
  };

  const rescheduleTimed = (payload: ReschedulePayload) =>
    applyReschedule(payload.entry, payload.newDate, payload.newStart, payload.newEnd);

  const rescheduleDay = (payload: RescheduleDayPayload) =>
    applyReschedule(payload.entry, payload.newDate);

  const toggleDone = () => {
    const e = selectedEntry;
    if (!e?.entryRef) return;
    if (e.entryRef === 'exam') {
      const exam = app.exams.find((x) => x.id === e.dataId);
      if (exam) app.handleUpdateExam({ ...exam, completed: !exam.completed });
    } else if (e.entryRef === 'task' && e.dataId) {
      app.handleUpdateTask(e.dataId, { completed: !e.completed });
    } else if (e.entryRef === 'tccChapter') {
      const idx = Number(e.dataId);
      if (app.tcc && !Number.isNaN(idx)) {
        const chapters = app.tcc.chapters.map((c, i) =>
          i === idx ? { ...c, completed: !c.completed } : c,
        );
        app.handleUpdateTcc({ ...app.tcc, chapters });
      }
    }
    app.showToast('atualizado ♡');
  };

  const editEntry = () => {
    const e = selectedEntry;
    if (!e?.entryRef) return;
    switch (e.entryRef) {
      case 'exam':
      case 'task':
        app.openWizard('task-exam', e.courseId);
        break;
      case 'session':
        app.openStudy('focus');
        break;
      case 'class':
        if (e.courseId) app.openCourseDetail(e.courseId);
        break;
      case 'tccChapter':
        app.openEditTcc();
        break;
    }
  };

  const slotCreate = (date: string, time?: string) => {
    app.openQuickAdd();
    app.showToast(
      time ? `novo para ${date} às ${time} ♡` : `novo para ${date} ♡`,
    );
  };

  const toggleLayer = (layer: CalendarLayer) =>
    setVisible((v) => ({ ...v, [layer]: !v[layer] }));

  const daysForView = view === 'dia' ? [refDate] : weekDays;

  return (
    <div className="flex h-full flex-col">
      <CalendarToolbar
        title={title}
        subtitle={subtitle}
        view={view}
        onViewChange={setView}
        onToday={goToday}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onSearch={app.openSearch}
        onNew={app.openQuickAdd}
      />

      <div className="flex items-center gap-2 px-6 pb-2">
        <CalendarLayerToggle visible={visible} onToggle={toggleLayer} />
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          {view === 'mes' ? (
            <MonthView
              year={refDate.getFullYear()}
              month={refDate.getMonth() + 1}
              courses={app.courses}
              exams={app.exams}
              tasks={app.tasks}
              sessions={app.sessions}
              tcc={app.tcc}
              onSelectDay={(d) => {
                setView('dia');
                setRefDate(d);
                setSelectedId(null);
              }}
            />
          ) : view === 'agenda' ? (
            <AgendaView
              days={weekDays}
              data={filtered}
              selectedId={selectedId ?? undefined}
              onSelect={select}
            />
          ) : (
            <>
              <WeekHeader
                days={daysForView}
                selectedIdx={currentIdx >= 0 ? currentIdx : undefined}
                currentIdx={currentIdx >= 0 ? currentIdx : undefined}
              />
              <AllDayRow
                days={daysForView}
                entriesByDay={allDayByDay}
                selectedId={selectedId ?? undefined}
                onSelect={select}
                onReschedule={rescheduleDay}
                onSlotCreate={(date) => slotCreate(date)}
              />
              <WeekGrid
                days={daysForView}
                timedByDay={timedByDay}
                selectedId={selectedId ?? undefined}
                onSelect={(e: TimedEntry) => select(e)}
                currentIdx={currentIdx >= 0 ? currentIdx : undefined}
                onReschedule={rescheduleTimed}
                onSlotCreate={(date, time) => slotCreate(date, time)}
              />
            </>
          )}
        </div>

        <CalendarContextPanel
          entry={selectedEntry}
          onClose={() => setSelectedId(null)}
          onToggleStage={onToggleStage}
          onStartTimer={onStartTimer}
          onReschedule={(date, start) => selectedEntry && applyReschedule(selectedEntry, date, start)}
          onToggleDone={toggleDone}
          onEdit={editEntry}
        />
      </div>
    </div>
  );
};
