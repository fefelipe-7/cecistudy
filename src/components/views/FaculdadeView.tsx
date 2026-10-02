import React, { useMemo } from 'react';
import { BookOpen, Calendar as CalendarIcon, HeartHandshake } from 'lucide-react';
import { SubTabFaculdade, Course } from '../../types';
import { CourseDetailView } from './CourseDetailView';
import { UnderlineTabBar } from '../ui/UnderlineTabBar';
import { useDataClientApp, useDataClientCourses } from '@/context/DataClientProvider';
import { useNavValue } from '@/context/shellNavContexts';
import { getTodaySchedule, upcomingEvents } from '../../lib/schedule';
import type { CalendarEvent } from '../../lib/schedule';
import { useTermScope, semestersLeft } from '../../lib/termScope';
import { canRollover, shouldNudgeRollover } from '../../core/domain';
import TermRolloverCta from './faculdade/TermRolloverCta';
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
  const { profile, internshipLogs, academicTerms } = useDataClientApp();
  const { courses, classes, exams, tasks } = useDataClientCourses();
  // Recorte do período (SPEC-005): a tela do "agora" só enxerga o semestre ativo.
  // `all` preserva a lista completa para o calendário e a busca.
  const { term, active, grade, archived, activeIds } = useTermScope(courses, academicTerms);
  const {
    subTabFaculdade: subTab,
    setSubTabFaculdade: setSubTab,
    openCourseDetail,
    openInternshipDiary,
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
    if (!examIds.has(ev.id) && !taskIds.has(ev.id)) return openInternshipDiary;
    if (ev.courseId) return () => openCourseDetail(ev.courseId as string);
    return null;
  };

  // Existência e ênfase são perguntas separadas (SPEC-008 D1): com um período
  // aberto sempre dá para virar; o `nudge` só destaca quando o semestre acaba.
  const rolloverAvailable = canRollover(term);
  const rolloverNudge = shouldNudgeRollover(
    term,
    new Date().toISOString().slice(0, 10),
    profile.totalSemesters,
  );

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

      {/* Virada de semestre (SPEC-005/008) — sempre à mão, destaca quando é hora. */}
      <TermRolloverCta
        term={term}
        totalSemesters={profile.totalSemesters}
        archivedCount={archived.length}
        available={rolloverAvailable}
        nudge={rolloverNudge}
        onOpenWizard={() => openWizard('semester')}
      />

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
              now={now}
              onOpenCourse={openCourseDetail}
              onEventDestination={eventDestination}
            />
          )}

          {/* SUBTAB: ESTÁGIO */}
          {subTab === 'estagio' && (
            <InternshipSection
              records={allInternshipRecords}
              totalHours={internshipTotalHours}
              now={now}
              onOpenDiary={openInternshipDiary}
              onOpenWizard={() => openWizard('internship')}
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