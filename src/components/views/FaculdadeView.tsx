import React, { useMemo } from 'react';
import { BookOpen, Calendar as CalendarIcon, HeartHandshake, ChevronRight, Plus } from 'lucide-react';
import { SubTabFaculdade, Course } from '../../types';
import { CourseDetailView } from './CourseDetailView';
import { UnderlineTabBar } from '../ui/UnderlineTabBar';
import { useDataClientApp, useDataClientCourses } from '@/context/DataClientProvider';
import { useNavValue } from '@/context/shellNavContexts';
import { getTodaySchedule, upcomingEvents } from '../../lib/schedule';
import type { CalendarEvent } from '../../lib/schedule';
import { useTermScope } from '../../lib/termScope';
import { Mascote } from '../ui/Mascote';
import HeroSection from './faculdade/HeroSection';
import WeekGrid from './faculdade/WeekGrid';
import DisciplinasGrid from './faculdade/DisciplinasGrid';
import CalendarMonth from './faculdade/CalendarMonth';
import InternshipSection, { InternshipRecordPreview } from './faculdade/InternshipSection';
import WeekEventsList from './faculdade/WeekEventsList';

interface FaculdadeViewProps {
  /** Disciplina em foco (pilha `course`). Quando presente, renderiza o CourseDetailView. */
  course?: Course;
}

export const FaculdadeView: React.FC<FaculdadeViewProps> = ({ course }) => {
  const {
    profile,
    internshipLogs,
    academicTerms,
    tcc,
    thesisChapters,
    thesisMeetings,
    thesisTasks,
  } = useDataClientApp();
  const { courses, classes, exams, tasks } = useDataClientCourses();
  // Recorte do período (SPEC-005): a tela do "agora" só enxerga o semestre ativo.
  // `all` preserva a lista completa para o calendário e a busca.
  const { term, active, grade, archived, activeIds } = useTermScope(courses, academicTerms);
  const {
    subTabFaculdade: subTab,
    setSubTabFaculdade: setSubTab,
    openCourseDetail,
    openInternshipDiary,
    openTccScreen,
    openWizard,
  } = useNavValue();

  const now = useMemo(() => new Date(), []);

  const examIds = useMemo(() => new Set(exams.map((e) => e.id)), [exams]);
  const taskIds = useMemo(() => new Set(tasks.map((t) => t.id)), [tasks]);

  // Unified internship records for calendar and totals (derived from logs)
  const allInternshipRecords = useMemo<InternshipRecordPreview[]>(() => {
    const list: InternshipRecordPreview[] = [];
    internshipLogs.forEach((l) => {
      list.push({ id: l.id, date: l.date, activity: l.activity, hours: l.hours ?? 0 });
    });
    return list;
  }, [internshipLogs]);

  // If a course detail is active, render CourseDetailView
  if (course) {
    return <CourseDetailView course={course} />;
  }

  // ---- dados reais derivados do estado ----
  // Provas/tarefas herdam o período pelo `courseId` da disciplina (§D3).
  const pendingExams = exams.filter((e) => !e.completed && (!e.courseId || activeIds.has(e.courseId)));
  const pendingTasks = tasks.filter((t) => !t.completed && (!t.disciplineId || activeIds.has(t.disciplineId)));

  const internshipTotalHours = allInternshipRecords.reduce((acc, r) => acc + r.hours, 0);

  const todaySchedule = getTodaySchedule(grade, now);

  // Próximos eventos da semana acadêmica (derivados de provas/tarefas/estágio)
  const weekEvents = upcomingEvents(
    exams,
    tasks,
    allInternshipRecords.map((r) => ({ id: r.id, date: r.date, activity: r.activity }))
  );

  /** Linha da semana acadêmica: prova/tarefa navegam pra disciplina; estágio abre o diário. */
  const eventDestination = (ev: CalendarEvent): (() => void) | null => {
    // SPEC-012 F4.5: prazo do TCC abre a tela do TCC na aba certa (mesmo
    // caminho da notificação — `openTccScreen(tab, focusId)`).
    if (ev.kind === 'tcc') return () => openTccScreen(ev.tccTab, ev.tccFocusId);
    if (!examIds.has(ev.id) && !taskIds.has(ev.id)) return openInternshipDiary;
    if (ev.courseId) return () => openCourseDetail(ev.courseId as string);
    return null;
  };

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-6 pb-1">

      {/* 1. HERO — semestre + resumo real */}
      <HeroSection
        semester={term?.ordinal ?? profile.semester}
        coursesCount={active.length}
        pendingExamsCount={pendingExams.length}
        pendingTasksCount={pendingTasks.length}
        hasClassesToday={todaySchedule.length > 0}
        onOpenCalendar={() => setSubTab('calendario')}
      />

      {/* Card de estágio em destaque */}
      <button
        onClick={() => openInternshipDiary()}
        aria-label="abrir diário de estágio"
        className="w-full rounded-[26px] p-5 bg-gradient-to-br from-surface-rose via-surface-default to-surface-blue border border-ceci-border-brand shadow-sm card-lift press-card cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 rounded-xl bg-surface-default border border-ceci-border-brand flex items-center justify-center shadow-2xs shrink-0">
            <HeartHandshake className="w-7 h-7 text-ceci-brand-strong" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-ceci-primary leading-tight">diário de estágio</h2>
            <p className="text-xs text-ceci-secondary mt-1 leading-relaxed">
              {allInternshipRecords.length > 0
                ? `${allInternshipRecords.length} ${allInternshipRecords.length === 1 ? 'registro' : 'registros'} · ${internshipTotalHours}h de campo — toca para entrar no diário ♡`
                : 'campo, supervisão e entregas — tudo num lugar só ♡'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-ceci-brand-strong group-hover:translate-x-0.5 transition-transform shrink-0" />
        </div>
        <Mascote expression="field-prepare" className="w-14 h-14 absolute -bottom-2 -right-1 opacity-95 pointer-events-none" decorative />
      </button>

      <button
        onClick={() => openWizard('internship')}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-full text-xs font-semibold bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand hover:bg-surface-rose transition-colors cursor-pointer tap-interactive"
      >
        <Plus className="w-4 h-4" /> anotar ou agendar um estágio
      </button>

      {/* 2. MINHA SEMANA — grade real da semana (seg → dom) */}
      <WeekGrid courses={grade} now={now} onOpenCourse={openCourseDetail} />

      {/* Desktop (≥ lg): grade 12 colunas — esquerda: sub-tabs · direita: semana */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">

        {/* coluna esquerda */}
        <div className="lg:col-span-7 space-y-6">

          {/* Sub-Tabs Navigation */}
          <UnderlineTabBar
            tabs={[
              { id: 'disciplinas', label: 'disciplinas', icon: <BookOpen className="w-3.5 h-3.5" /> },
              { id: 'calendario', label: 'calendário', icon: <CalendarIcon className="w-3.5 h-3.5" /> },
              { id: 'estagio', label: 'estágio', icon: <HeartHandshake className="w-3.5 h-3.5" /> },
            ]}
            active={subTab}
            onChange={(id) => setSubTab(id as SubTabFaculdade)}
          />

          {/* SUBTAB: DISCIPLINAS */}
          {subTab === 'disciplinas' && (
            <DisciplinasGrid
              courses={grade}
              classes={classes}
              exams={exams}
              onNewCourse={() => openWizard('course')}
              onOpenCourse={openCourseDetail}
            />
          )}

          {/* SUBTAB: CALENDÁRIO */}
          {subTab === 'calendario' && (
            <CalendarMonth
              courses={courses}
              exams={exams}
              tasks={tasks}
              tcc={tcc}
              thesisChapters={thesisChapters}
              thesisMeetings={thesisMeetings}
              thesisTasks={thesisTasks}
              now={now}
              onOpenCourse={openCourseDetail}
              onEventDestination={eventDestination}
            />
          )}

          {/* SUBTAB: ESTÁGIO */}
          {subTab === 'estagio' && (
            <InternshipSection
              records={allInternshipRecords}
              now={now}
              onOpenDiary={openInternshipDiary}
            />
          )}

        </div>

        {/* coluna direita */}
        <div className="lg:col-span-5 space-y-6">
          <WeekEventsList
            weekEvents={weekEvents}
            courses={grade}
            eventDestination={eventDestination}
          />
        </div>

      </div>
    </div>
  );
};