import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Plus,
  HeartHandshake,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SubTabFaculdade, Course } from '../../types';
import { WEEKDAY_LABELS, WEEKDAY_FULL_LABELS } from '../../data/constants';
import { CourseDetailView } from './CourseDetailView';
import { UnderlineTabBar } from '../ui/UnderlineTabBar';
import { ManageSurface } from '../ui/ManageSurface';
import { useApp } from '../../context/AppContext';
import { SectionTitle } from '../ui/SectionTitle';
import { CourseIcon } from '../ui/CourseIcon';
import { Mascote } from '../ui/Mascote';
import type { CalendarEvent } from '../../lib/schedule';
import {
  eventsForMonth,
  upcomingEvents,
  formatShortDate,
  monthName,
  daysInMonth,
  formatCourseSchedule,
  getTodaySchedule,
  classesForMonth,
  weekDates,
} from '../../lib/schedule';

interface FaculdadeViewProps {
  /** Disciplina em foco (pilha `course`). Quando presente, renderiza o CourseDetailView. */
  course?: Course;
}

const WEEKDAY_HEADERS = ['d', 's', 't', 'q', 'q', 's', 's'];

export const FaculdadeView: React.FC<FaculdadeViewProps> = ({ course }) => {
  const {
    profile,
    courses,
    classes,
    exams,
    tasks,
    internshipLogs,
    subTabFaculdade: subTab,
    setSubTabFaculdade: setSubTab,
    openCourseDetail,
    openInternshipDiary,
    openWizard,
  } = useApp();

  // ---- estado do calendário (mês navegável + dia selecionado) ----
  const now = useMemo(() => new Date(), []);
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // ---- estado da grade semanal (dia selecionado, seg → dom) ----
  const [selectedWeekday, setSelectedWeekday] = useState(() => now.getDay());

  const examIds = useMemo(() => new Set(exams.map((e) => e.id)), [exams]);
  const taskIds = useMemo(() => new Set(tasks.map((t) => t.id)), [tasks]);

  // Grade semanal (domingo→sábado da semana corrente, exibida seg → dom)
  const weekDays = useMemo(() => {
    const d = weekDates(now);
    return [d[1], d[2], d[3], d[4], d[5], d[6], d[0]];
  }, [now]);
  const selectedWeekDate =
    weekDays.find((d) => d.getDay() === selectedWeekday) ?? now;
  const selectedWeekSchedule = getTodaySchedule(courses, selectedWeekDate);

  // Aulas recorrentes projetadas no mês exibido do calendário
  const calClasses = useMemo(
    () => classesForMonth(courses, calYear, calMonth),
    [courses, calYear, calMonth]
  );

  // If a course detail is active, render CourseDetailView
  if (course) {
    return <CourseDetailView course={course} />;
  }

  // ---- dados reais derivados do estado ----
  const pendingExams = exams.filter((e) => !e.completed);
  const pendingTasks = tasks.filter((t) => !t.completed);

  const todaySchedule = getTodaySchedule(courses, now);

  // Calendário real (eventos de provas/tarefas do mês exibido)
  const calEvents = eventsForMonth(exams, tasks, calMonth, calYear);
  const todayDay = now.getDate();
  const totalDays = daysInMonth(calYear, calMonth);
  const firstWeekday = new Date(calYear, calMonth - 1, 1).getDay();
  const isCurrentMonth = calMonth === now.getMonth() + 1 && calYear === now.getFullYear();

  const shiftMonth = (delta: number) => {
    let m = calMonth + delta;
    let y = calYear;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setCalMonth(m);
    setCalYear(y);
    setSelectedDay(null);
  };

  const selectedEvents = selectedDay != null ? calEvents.get(selectedDay) ?? [] : [];

  // Próximos eventos da semana acadêmica (derivados de provas/tarefas/estágio)
  const weekEvents = upcomingEvents(exams, tasks, internshipLogs);

  // Estágio: resumo para o card de entrada
  const internshipTotalHours = internshipLogs.reduce((acc, l) => acc + (l.hours || 0), 0);

  /** Linha da semana acadêmica: prova/tarefa navegam pra disciplina; estágio abre o diário. */
  const eventDestination = (ev: CalendarEvent): (() => void) | null => {
    if (!examIds.has(ev.id) && !taskIds.has(ev.id)) return openInternshipDiary;
    if (ev.courseId) return () => openCourseDetail(ev.courseId as string);
    return null;
  };

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-6 pb-1">

      {/* ================================================================ */}
      {/* 1. HERO — semestre + resumo real                                  */}
      {/* ================================================================ */}
      <section className="rounded-[26px] bg-gradient-to-br from-white to-surface-rose border border-ceci-border-subtle shadow-sm p-5 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-ceci-secondary font-medium lowercase tracking-wide">faculdade</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-ceci-primary mt-0.5 tracking-tight font-display">
              {profile.semester}º semestre
            </h1>
          </div>
          <button
            onClick={() => setSubTab('calendario')}
            aria-label="ver calendário"
            className="w-10 h-10 rounded-2xl bg-white/80 border border-ceci-border-default flex items-center justify-center text-ceci-secondary hover:bg-white transition-colors shadow-2xs cursor-pointer shrink-0"
          >
            <CalendarIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs sm:text-[13px] text-ceci-secondary leading-relaxed mt-2.5 max-w-[92%]">
          {courses.length} disciplinas · {pendingExams.length}{' '}
          {pendingExams.length === 1 ? 'prova' : 'provas'} por vir · {pendingTasks.length}{' '}
          {pendingTasks.length === 1 ? 'tarefa' : 'tarefas'} pendentes.
          {todaySchedule.length > 0 ? ' e hoje ainda tem aula ♡' : ' respira, vai dar tudo certo ♡'}
        </p>
        <Mascote
          expression="class-ready"
          className="w-16 h-16 absolute -bottom-2 -right-2 opacity-95 pointer-events-none"
          decorative
        />
      </section>

      {/* ================================================================ */}
      {/* 2. MINHA SEMANA — grade real da semana (seg → dom)                */}
      {/* ================================================================ */}
      <section className="px-0.5">
        <SectionTitle icon={<Clock className="w-4 h-4 text-ceci-academic-strong" />}>
          minha semana
        </SectionTitle>
        <div className="pt-3 space-y-3">
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((d) => {
              const dow = d.getDay();
              const dayClasses = getTodaySchedule(courses, d);
              const isSel = dow === selectedWeekday;
              const isTodayDow = dow === now.getDay();
              return (
                <button
                  key={dow}
                  onClick={() => setSelectedWeekday(dow)}
                  aria-label={`ver aulas de ${WEEKDAY_FULL_LABELS[dow]}`}
                  aria-pressed={isSel}
                  className={`p-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 min-h-[56px] border transition-colors cursor-pointer ${
                    isSel
                      ? 'bg-ceci-primary text-white border-transparent shadow-sm'
                      : isTodayDow
                        ? 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand'
                        : 'bg-white text-ceci-secondary border-ceci-border-default hover:bg-surface-subtle'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide">
                    {WEEKDAY_LABELS[dow]}
                  </span>
                  <span className={`text-xs font-bold tabular-nums ${isSel ? 'text-white' : ''}`}>
                    {d.getDate()}
                  </span>
                  <span className="flex items-center gap-0.5 h-1" aria-hidden="true">
                    {dayClasses.slice(0, 3).map(({ course }) => (
                      <span
                        key={course.id}
                        className="w-1 h-1 rounded-full shrink-0"
                        style={{ backgroundColor: course.color }}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedWeekSchedule.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-ceci-tertiary px-1 flex items-center gap-1.5">
                aulas de {WEEKDAY_FULL_LABELS[selectedWeekday]} ·{' '}
                {formatShortDate(
                  `${selectedWeekDate.getFullYear()}-${String(selectedWeekDate.getMonth() + 1).padStart(2, '0')}-${String(selectedWeekDate.getDate()).padStart(2, '0')}`
                )}
                {selectedWeekday === now.getDay() && (
                  <span className="text-[10px] font-bold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand px-2 py-0.5 rounded-full">
                    hoje
                  </span>
                )}
              </p>
              {selectedWeekSchedule.map(({ course: c, slot }) => (
                <button
                  key={`${c.id}-${slot.day}-${slot.start}`}
                  onClick={() => openCourseDetail(c.id)}
                  className="w-full p-4 rounded-[22px] bg-white border border-ceci-border-default hover:border-ceci-border-brand shadow-sm tap-interactive cursor-pointer flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-ceci-academic-strong bg-surface-blue border border-ceci-border-academic px-2.5 py-1.5 rounded-xl shrink-0 tabular-nums">
                      {slot.start}{slot.end ? `–${slot.end}` : ''}
                    </span>
                    <span
                      className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${c.color}1f`, borderColor: `${c.color}40` }}
                    >
                      <CourseIcon icon={c.icon} className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-xs text-ceci-primary truncate">{c.name}</h3>
                      {c.room && (
                        <p className="text-[11px] text-ceci-secondary mt-0.5 truncate">{c.room}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ceci-muted shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-[22px] bg-surface-subtle border border-dashed border-ceci-border-default text-center">
              <p className="text-xs text-ceci-secondary">
                sem aulas{' '}
                {selectedWeekday === now.getDay()
                  ? 'hoje'
                  : `de ${WEEKDAY_FULL_LABELS[selectedWeekday]}`}
                {' ♡ '}
                {(() => {
                  const next = weekDays.find(
                    (d) => d.getTime() > selectedWeekDate.getTime() && getTodaySchedule(courses, d).length > 0
                  );
                  return next
                    ? `a próxima é ${WEEKDAY_FULL_LABELS[next.getDay()]} (${formatShortDate(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`)}).`
                    : 'essa semana está leve.';
                })()}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Desktop (≥ lg): grade 12 colunas — esquerda: disciplinas · direita: calendário/semana */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">

      {/* coluna esquerda */}
      <div className="lg:col-span-7 space-y-6">

      {/* Sub-Tabs Navigation */}
      <UnderlineTabBar
        tabs={[
          { id: 'disciplinas', label: 'disciplinas', icon: <BookOpen className="w-3.5 h-3.5" /> },
          { id: 'calendario', label: 'calendário', icon: <CalendarIcon className="w-3.5 h-3.5" /> },
        ]}
        active={subTab}
        onChange={(id) => setSubTab(id as SubTabFaculdade)}
      />

      {/* SUBTAB: DISCIPLINAS */}
      {subTab === 'disciplinas' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 pt-1 lg:pt-0">
            <h2 className="font-display text-base font-bold text-ceci-primary">grade de disciplinas</h2>
            <button
              onClick={() => openWizard('course')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> nova matéria
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {courses.map((c) => {
              const courseClassCount = classes.filter((cl) => cl.courseId === c.id).length;
              const nextExam = exams.find((e) => e.courseId === c.id && !e.completed);

              return (
                <ManageSurface
                  key={c.id}
                  kind="course"
                  id={c.id}
                  onTap={() => openCourseDetail(c.id)}
                  className="rounded-[24px] p-5 bg-white border border-ceci-border-default cursor-pointer hover:border-ceci-border-brand card-lift press-card space-y-3 shadow-sm group"
                  style={{ borderLeftWidth: '4px', borderLeftColor: c.color || '#B94862' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${c.color}1f`, borderColor: `${c.color}40` }}
                      >
                        <CourseIcon icon={c.icon} className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-bold text-ceci-primary leading-snug group-hover:text-ceci-brand-strong transition-colors line-clamp-2">
                          {c.name}
                        </h3>
                        <p className="text-[11px] text-ceci-secondary mt-0.5 truncate">
                          {c.code || c.professor}
                        </p>
                      </div>
                    </div>
                    {c.category && (
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border shrink-0 ${
                          c.category === 'obrigatoria'
                            ? 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand'
                            : 'bg-surface-muted text-ceci-tertiary border-ceci-border-default'
                        }`}
                      >
                        {c.category === 'obrigatoria' ? 'obrig.' : 'compl.'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] text-ceci-secondary line-clamp-1">
                        {formatCourseSchedule(c.schedule) || 'horário a definir'}
                      </p>
                      <p className="text-[11px] mt-0.5 line-clamp-1 flex items-center gap-1 flex-wrap">
                        {nextExam ? (
                          <span className="font-bold text-ceci-brand-strong">
                            prova {formatShortDate(nextExam.date)}
                          </span>
                        ) : (
                          <span className="text-ceci-muted">sem provas pendentes</span>
                        )}
                        <span className="text-ceci-muted">· {courseClassCount} aulas</span>
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-ceci-brand-strong flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0">
                      abrir <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </ManageSurface>
              );
            })}
          </div>

          {/* Entrada do diário de estágio (domínio acadêmico) */}
          <button
            onClick={openInternshipDiary}
            aria-label="abrir diário de estágio"
            className="w-full rounded-[24px] p-4 bg-white border border-ceci-border-default hover:border-ceci-border-brand shadow-sm tap-interactive cursor-pointer flex items-center justify-between gap-3 text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center shrink-0">
                <HeartHandshake className="w-5 h-5 text-ceci-brand-strong" />
              </span>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-sm text-ceci-primary">diário de estágio</h3>
                <p className="text-[11px] text-ceci-secondary mt-0.5 truncate">
                  {internshipLogs.length > 0
                    ? `${internshipLogs.length} ${internshipLogs.length === 1 ? 'registro' : 'registros'} · ${internshipTotalHours}h de campo`
                    : 'registre suas horas de campo e supervisões'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-ceci-brand-strong group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>
        </div>
      )}

      {/* SUBTAB: CALENDÁRIO — mês navegável + dia clicável */}
      {subTab === 'calendario' && (
        <div className="space-y-3 px-1 pt-1 lg:pt-0">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="font-display text-base font-bold text-ceci-primary">
              {monthName(calYear, calMonth)} <span className="text-ceci-tertiary font-medium">{calYear}</span>
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => shiftMonth(-1)}
                aria-label="mês anterior"
                className="w-8 h-8 rounded-xl bg-white border border-ceci-border-default flex items-center justify-center text-ceci-secondary hover:bg-surface-muted transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {!isCurrentMonth && (
                <button
                  onClick={() => { setCalMonth(now.getMonth() + 1); setCalYear(now.getFullYear()); setSelectedDay(null); }}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  hoje
                </button>
              )}
              <button
                onClick={() => shiftMonth(1)}
                aria-label="próximo mês"
                className="w-8 h-8 rounded-xl bg-white border border-ceci-border-default flex items-center justify-center text-ceci-secondary hover:bg-surface-muted transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-ceci-tertiary py-1 border-b border-ceci-border-default">
            {WEEKDAY_HEADERS.map((d, i) => <div key={i}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {/* células vazias até o primeiro dia do mês */}
            {Array.from({ length: firstWeekday }, (_, i) => <div key={`blank-${i}`} />)}
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
              const isToday = isCurrentMonth && day === todayDay;
              const hasEvent = (calEvents.get(day)?.length ?? 0) > 0;
              const dayClassCount = calClasses.get(day)?.length ?? 0;
              const isSelected = selectedDay === day;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  aria-label={`dia ${day}${hasEvent ? ', tem eventos' : ''}${dayClassCount > 0 ? ', tem aula' : ''}`}
                  className={`p-2 rounded-xl flex flex-col items-center justify-center min-h-[40px] font-medium transition-colors cursor-pointer ${
                    isToday
                      ? 'bg-rose-500 text-white shadow-2xs font-bold'
                      : isSelected
                        ? 'bg-surface-blue text-ceci-academic-strong font-bold border border-ceci-border-academic'
                        : hasEvent
                          ? 'bg-surface-rose text-ceci-brand-strong font-bold border border-ceci-border-brand hover:bg-rose-100'
                          : dayClassCount > 0
                            ? 'bg-surface-blue text-ceci-academic-strong border border-ceci-border-academic hover:bg-surface-subtle'
                            : 'bg-surface-muted text-ceci-primary hover:bg-surface-subtle'
                  }`}
                >
                  <span>{day}</span>
                  {(hasEvent || dayClassCount > 0) && (
                    <span className="flex items-center gap-0.5 mt-0.5">
                      {hasEvent && <span className="w-1 h-1 rounded-full bg-current" />}
                      {dayClassCount > 0 && (
                        <span className="w-1 h-1 rounded-full bg-ceci-academic-strong" />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Painel do dia selecionado (provas/tarefas + aulas recorrentes) */}
          {selectedDay != null && (() => {
            const dayClassList = calClasses.get(selectedDay) ?? [];
            const hasAnything = selectedEvents.length > 0 || dayClassList.length > 0;
            return (
              <div className="rounded-[20px] p-4 bg-surface-subtle border border-ceci-border-subtle space-y-2">
                <p className="text-xs font-semibold text-ceci-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-ceci-brand-strong" />
                  {selectedDay} de {monthName(calYear, calMonth)}
                </p>
                {!hasAnything ? (
                  <p className="text-xs text-ceci-secondary">nada anotado neste dia ♡</p>
                ) : (
                  <div className="divide-y divide-ceci-border-subtle">
                    {/* aulas recorrentes do dia da semana */}
                    {dayClassList.map(({ course, slot }) => (
                      <button
                        key={`class-${course.id}-${slot.start}`}
                        onClick={() => openCourseDetail(course.id)}
                        className="w-full py-2 flex items-center justify-between gap-3 text-left cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <div className="min-w-0">
                          <h3 className="font-semibold text-xs text-ceci-primary line-clamp-1">
                            {course.name}
                          </h3>
                          <p className="text-[11px] text-ceci-secondary mt-0.5">
                            aula{slot.start ? ` · ${slot.start}${slot.end ? `–${slot.end}` : ''}` : ''}
                            {course.room ? ` · ${course.room}` : ''}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 text-ceci-academic-strong bg-white border-ceci-border-academic">
                          aula
                        </span>
                      </button>
                    ))}
                    {selectedEvents.map((ev) => {
                      const dest = eventDestination(ev);
                      const evCourse = ev.courseId ? courses.find((c) => c.id === ev.courseId)?.name : undefined;
                      const inner = (
                        <>
                          <div className="min-w-0">
                            <h3 className={`font-semibold text-xs line-clamp-1 ${ev.completed ? 'line-through text-ceci-muted' : 'text-ceci-primary'}`}>
                              {ev.title}
                            </h3>
                            {evCourse && <p className="text-[11px] text-ceci-secondary mt-0.5">{evCourse}</p>}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                              ev.kind === 'prova'
                                ? 'text-ceci-brand-strong bg-white border-ceci-border-brand'
                                : 'text-ceci-academic-strong bg-white border-ceci-border-academic'
                            }`}
                          >
                            {ev.kind}
                          </span>
                        </>
                      );
                      return dest ? (
                        <button
                          key={ev.id}
                          onClick={dest}
                          className="w-full py-2 flex items-center justify-between gap-3 text-left cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          {inner}
                        </button>
                      ) : (
                        <div key={ev.id} className="py-2 flex items-center justify-between gap-3">
                          {inner}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      </div>

      {/* coluna direita */}
      <div className="lg:col-span-5 space-y-6">

      {/* Sua semana acadêmica (clicável) */}
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

      </div>
      </div>
    </div>
  );
};
