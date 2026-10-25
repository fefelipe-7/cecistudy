import React, { useMemo } from 'react';
import { BookOpen, HeartHandshake, ChevronRight, Plus } from 'lucide-react';
import { SubTabFaculdade, Course } from '../../types';
import { CourseDetailView } from './CourseDetailView';
import { UnderlineTabBar } from '../ui/UnderlineTabBar';
import { SwipeableTabPanel, useTabPager } from '../ui/SwipeableTabPanel';
import {
  useDataClientApp,
  useDataClientCourses,
  useDataClientStudy,
} from '@/context/DataClientProvider';
import { useNavValue } from '@/context/shellNavContexts';
import { buildCalendarEntries, getTodaySchedule } from '../../lib/schedule';
import { useTermScope } from '../../lib/termScope';
import { computePendencies, computeStats } from '../../lib/internshipCases';
import { addDaysKey, localDateKey, todayKeyLocal } from '../../lib/dateBR';
import { DICA, frase } from '../../lib/voice';
import { Mascote } from '../ui/Mascote';
import HeroSection from './faculdade/HeroSection';
import WeekGrid from './faculdade/WeekGrid';
import DisciplinasGrid from './faculdade/DisciplinasGrid';
import InternshipSection, { InternshipRecordPreview } from './faculdade/InternshipSection';
import WeekEventsList from './faculdade/WeekEventsList';

interface FaculdadeViewProps {
  /** Disciplina em foco (pilha `course`). Quando presente, renderiza o CourseDetailView. */
  course?: Course;
}

/** Ordem das sub-tabs — é ela que define para onde o arrasto avança (SPEC-015). */
const SUBTAB_ORDER: readonly SubTabFaculdade[] = ['disciplinas', 'estagio'];

/** Nome legível da sub-tab: o `aria-label` do painel mostra isto, não o id. */
const SUBTAB_LABEL: Record<SubTabFaculdade, string> = {
  disciplinas: 'disciplinas',
  estagio: 'estágio',
};

const SUBTABS: Array<{ id: SubTabFaculdade; label: string; icon: React.ReactNode }> = [
  { id: 'disciplinas', label: 'disciplinas', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: 'estagio', label: 'estágio', icon: <HeartHandshake className="w-3.5 h-3.5" /> },
];

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
  const { sessions } = useDataClientStudy();
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
    openCalendar,
    openStudy,
    openManageItem,
  } = useNavValue();

  const now = useMemo(() => new Date(), []);

  // Arraste horizontal troca de sub-tab, como no detalhe da disciplina. A regra
  // mora em `ui/SwipeableTabPanel` (SPEC-015); aqui só são as três sub-tabs.
  const pager = useTabPager<SubTabFaculdade>({
    tabIds: SUBTAB_ORDER,
    active: subTab,
    onChange: setSubTab,
  });

  // Números do bloco de estágio: a regra é do domínio da SPEC-009
  // (`computeStats`/`computePendencies`), chamada direto — o mesmo caminho que
  // `InternshipSection.tsx` já usa. "Hoje" é data civil em fuso local.
  const estagio = useMemo(() => {
    const stats = computeStats(internshipLogs, localDateKey(now));
    const pendencias = computePendencies(internshipLogs, localDateKey(now));
    return {
      registros: internshipLogs.length,
      horas: stats.doneHours,
      pendencias: pendencias.noReflection.length + pendencias.noSupervision.length,
    };
  }, [internshipLogs, now]);
  const allInternshipRecords = useMemo<InternshipRecordPreview[]>(() => {
    const list: InternshipRecordPreview[] = [];
    internshipLogs.forEach((l) => {
      list.push({ id: l.id, date: l.date, activity: l.activity, hours: l.hours ?? 0 });
    });
    return list;
  }, [internshipLogs]);

  // Rules of Hooks: nenhum hook pode ficar depois do early return de
  // `course` abaixo. O `weekEntries` morava no corpo da grade e subiu para
  // cá — quando o `LayoutGroup` re-renderiza a tela em saída com `course`
  // já definido, o hook a menos derrubava a árvore inteira.
  const weekEntries = useMemo(
    () =>
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
        from: todayKeyLocal(),
        to: addDaysKey(todayKeyLocal(), 14),
      })
        .filter(
          (e) =>
            e.kind === 'tarefa' || e.kind === 'prova' || e.kind === 'tcc' || e.kind === 'estagio',
        )
        .slice(0, 5),
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
    ],
  );

  // If a course detail is active, render CourseDetailView
  if (course) {
    return <CourseDetailView course={course} />;
  }

  // ---- dados reais derivados do estado ----
  // Provas/tarefas herdam o período pelo `courseId` da disciplina (§D3).
  const pendingExams = exams.filter(
    (e) => !e.completed && (!e.courseId || activeIds.has(e.courseId)),
  );
  const pendingTasks = tasks.filter(
    (t) => !t.completed && (!t.disciplineId || activeIds.has(t.disciplineId)),
  );

  const todaySchedule = getTodaySchedule(grade, now);

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-6 pb-1">
      {/* 1. HERO — semestre + resumo real */}
      <HeroSection
        semester={term?.ordinal ?? profile.semester}
        coursesCount={active.length}
        pendingExamsCount={pendingExams.length}
        pendingTasksCount={pendingTasks.length}
        hasClassesToday={todaySchedule.length > 0}
        onOpenCalendar={() => openCalendar()}
      />

      {/* 2. DIÁRIO DE ESTÁGIO — o segundo bloco, forte em conteúdo e sem competir
          com o hero. O gradiente é do hero: repeti-lo aqui embaixo fazia os dois
          cards se lerem como irmãos, e nenhum dos dois sabia dizer qual era o
          principal. Aqui é superfície rose plana, com o mesmo peso dos outros
          blocos e o número grande em `text-xl`. */}
      <section className="w-full rounded-3xl p-5 bg-surface-rose border border-ceci-border-brand shadow-sm relative overflow-hidden">
        <button
          onClick={() => openInternshipDiary()}
          aria-label="abrir diário de estágio"
          className="w-full text-left cursor-pointer group pr-16"
        >
          <div className="flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-surface-default border border-ceci-border-brand flex items-center justify-center shadow-2xs shrink-0">
              <HeartHandshake className="w-6 h-6 text-ceci-brand-strong" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-bold text-ceci-primary leading-tight">
                diário de estágio
              </h2>
              {estagio.registros > 0 ? (
                <>
                  <p className="font-display text-xl font-bold text-ceci-brand-strong leading-tight mt-1 tabular-nums">
                    {estagio.horas}h
                    <span className="text-xs font-semibold text-ceci-secondary ml-1.5">
                      em campo
                    </span>
                  </p>
                  <p className="text-xs text-ceci-secondary mt-1 leading-relaxed">
                    {estagio.registros} {estagio.registros === 1 ? 'registro' : 'registros'}
                    {estagio.pendencias > 0
                      ? ` · ${estagio.pendencias} pedindo carinho`
                      : ' — tudo em dia por aqui'}
                  </p>
                  <p className="font-serif-academic text-xs text-ceci-secondary leading-relaxed mt-2 max-w-[80%]">
                    {frase(DICA, 'faculdadePraticaAcompanha')}
                  </p>
                </>
              ) : (
                <p className="text-xs text-ceci-secondary mt-1 leading-relaxed">
                  campo, supervisão e entregas — tudo num lugar só ♡
                </p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-ceci-brand-strong group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </button>

        {/* O card já abre o diário (área de cima + chevron); o botão fica com a
            única ação que o toque no card não faz — começar um registro. */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pr-16">
          <button
            onClick={() => openWizard('internship')}
            className="touch-target inline-flex items-center gap-1.5 rounded-full bg-ceci-brand-strong px-4 py-2 text-xs font-semibold text-ceci-on-brand hover:bg-ceci-brand transition-colors cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> anotar ou agendar um estágio
          </button>
        </div>

        <Mascote
          expression="field-prepare"
          className="w-12 h-12 absolute -bottom-1 -right-1 opacity-90 pointer-events-none"
          decorative
        />
      </section>

      {/* 2. MINHA SEMANA — grade real da semana (seg → dom) */}
      <WeekGrid courses={grade} now={now} onOpenCourse={openCourseDetail} />

      {/* Desktop (≥ lg): grade 12 colunas — esquerda: sub-tabs · direita: semana */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">
        {/* coluna esquerda */}
        <div className="lg:col-span-7 space-y-6">
          {/* Sub-Tabs Navigation */}
          <UnderlineTabBar
            tabs={SUBTABS}
            active={subTab}
            onChange={(id) => pager.goTo(id as SubTabFaculdade)}
          />

          {/* Conteúdo das sub-tabs: o painel arrasta junto com o dedo (SPEC-015) */}
          <SwipeableTabPanel active={subTab} pager={pager} label={SUBTAB_LABEL[subTab]}>
            {subTab === 'disciplinas' && (
              <DisciplinasGrid
                courses={grade}
                classes={classes}
                exams={exams}
                onNewCourse={() => openWizard('course')}
                onOpenCourse={openCourseDetail}
              />
            )}

            {subTab === 'estagio' && (
              <InternshipSection
                records={allInternshipRecords}
                now={now}
                onOpenDiary={openInternshipDiary}
              />
            )}
          </SwipeableTabPanel>
        </div>

        {/* coluna direita */}
        <div className="lg:col-span-5 space-y-6">
          <WeekEventsList
            entries={weekEntries}
            nav={{
              openCourseDetail,
              openTccScreen,
              openInternshipDiary,
              openStudy,
              openManageItem,
            }}
            exams={exams}
          />
        </div>
      </div>
    </div>
  );
};
