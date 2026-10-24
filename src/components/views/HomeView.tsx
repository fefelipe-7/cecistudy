import React, { useMemo } from 'react';
import { useDataClientApp, useDataClientCourses, useDataClientStudy } from '@/context/DataClientProvider';
import { useNavValue, useStudyActions } from '@/context/shellNavContexts';
import { ATTENTION_LIMIT } from '../../lib/homeMeta';
import { resumoDoDia, saudacao, dica } from '../../lib/voice';
import { daysUntil } from '../../lib/diasAte';
import { buildCalendarEntries, getTodaySchedule } from '../../lib/schedule';
import { addDaysKey, todayKeyLocal } from '../../lib/dateBR';
import { isCardDue } from '../../lib/fsrs';
import HeroSection from './home/HeroSection';
import TodayClasses from './home/TodayClasses';
import AttentionSection, { type AttentionItem } from './home/AttentionSection';
import WeekRhythmCard from './home/WeekRhythmCard';
import QuickActions from './home/QuickActions';
import CecinhoTip from './home/CecinhoTip';

export const HomeView: React.FC = () => {
  const {
    profile,
    internshipLogs,
    tcc,
    thesisChapters,
    thesisMeetings,
    thesisTasks,
  } = useDataClientApp();
  const { courses, tasks, exams } = useDataClientCourses();
  const { flashcards, sessions } = useDataClientStudy();
  const { streakStats, currentWeekProgress } = useStudyActions();
  const { handleNavigate, openStreak, openStudy } = useNavValue();

  const greeting = saudacao();

  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).toLowerCase();

  // Provas nos próximos 14 dias (filtro real de data)
  const pendingExamsIn14Days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(today.getDate() + 14);
    return (exams || []).filter((e) => {
      if (e.completed) return false;
      const d = e.date ? new Date(`${e.date}T00:00:00`) : null;
      return d && !Number.isNaN(d.getTime()) && d >= today && d <= limit;
    });
  }, [exams]);

  // Flashcards vencidos (revisão pendente)
  const dueCardsCount = useMemo(
    () => flashcards.filter((c) => isCardDue(c)).length,
    [flashcards]
  );

  // Aulas de hoje, ordenadas por hora (com o slot para exibir horário/sala)
  const todaySchedule = useMemo(() => getTodaySchedule(courses, new Date()), [courses]);

  // Frase do dia — conteúdo real derivado das pendências
  const dayMessage = useMemo(() => {
    const pendingTasks = tasks.filter((t) => !t.completed).length;
    return resumoDoDia({ tarefasPendentes: pendingTasks, provasPendentes: pendingExamsIn14Days.length });
  }, [tasks, pendingExamsIn14Days]);

  /**
   * "O que precisa da sua atenção hoje" — agora vem do agregador (SPEC-024
   * D13/D4): prova, tarefa, prazo do TCC e pendência de estágio, todos na mesma
   * ordem por data e com o teto de 5. Tarefa **sem prazo** não tem `DateKey` e
   * por isso fica de fora do agregador; ela continua no fim da lista, como antes.
   *
   * `from` olha 14 dias para trás para as atrasadas entrarem primeiro.
   */
  const attentionAll = useMemo<AttentionItem[]>(() => {
    const today = todayKeyLocal();
    const comData: AttentionItem[] = buildCalendarEntries({
      courses,
      exams,
      tasks,
      thesis: tcc,
      chapters: thesisChapters,
      thesisTasks,
      meetings: thesisMeetings,
      internshipLogs,
      studySessions: sessions,
      from: addDaysKey(today, -14),
      to: addDaysKey(today, 14),
    })
      .filter(
        (e) =>
          e.kind === 'tarefa' || e.kind === 'prova' || e.kind === 'tcc' || e.kind === 'estagio',
      )
      .map((entry) => ({ kind: 'calendar' as const, entry }));

    const semPrazo: AttentionItem[] = tasks
      .filter((t) => !t.completed && !t.dueDate)
      .map((t) => ({ kind: 'task' as const, id: t.id }));

    return [...comData, ...semPrazo];
  }, [
    courses,
    exams,
    tasks,
    tcc,
    thesisChapters,
    thesisTasks,
    thesisMeetings,
    internshipLogs,
    sessions,
  ]);

  const attentionItems = attentionAll.slice(0, ATTENTION_LIMIT);

  const remainingAttention = Math.max(0, attentionAll.length - attentionItems.length);

  // Dica contextual do cecinho (derivada do estado real do dia)
  // `SPEC-M-018 D7`: o componente monta o contexto; quem escreve é a voz.
  const cecinhoTip = useMemo(() => {
    const proximaProva =
      [...pendingExamsIn14Days].sort((a, b) => a.date.localeCompare(b.date))[0]?.date ?? null;
    return dica({
      cartoesVencidos: dueCardsCount,
      tarefasPendentes: tasks.filter((t) => !t.completed).length,
      provasPendentes: pendingExamsIn14Days.length,
      diasAteProva: proximaProva ? daysUntil(proximaProva) : null,
      tituloProva: proximaProva,
      diasDeSequencia: streakStats.current,
    });
  }, [dueCardsCount, tasks, pendingExamsIn14Days, streakStats.current]);

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-6 pb-1">

      {/* 1. HERO — saudação + data + frase do dia */}
      <HeroSection
        formattedDate={formattedDate}
        greeting={greeting}
        name={profile.name}
        dayMessage={dayMessage}
      />

      {/* Desktop (≥ lg): grade de 2 colunas — esquerda: facul/atenção · direita: ritmo/ações/dica */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">

        {/* coluna esquerda */}
        <div className="lg:col-span-7 space-y-6">
          {/* 2. HOJE NA FACUL */}
          <TodayClasses
            todaySchedule={todaySchedule}
            onOpenCourse={(id) => handleNavigate('faculdade', undefined, id)}
          />

          {/* 3. SUA ATENÇÃO HOJE */}
          <AttentionSection items={attentionItems} remainingCount={remainingAttention} />
        </div>

        {/* coluna direita */}
        <div className="lg:col-span-5 space-y-6">
          {/* 4. RITMO DA SEMANA */}
          <WeekRhythmCard
            streakLongest={streakStats.longest}
            streakCurrent={streakStats.current}
            streakActive={streakStats.alive}
            weekProgress={currentWeekProgress}
            onOpenStreak={openStreak}
          />

          {/* 5. AÇÕES RÁPIDAS */}
          <QuickActions
            dueCardsCount={dueCardsCount}
            onFocus={() => openStudy('focus')}
            onReview={() => openStudy('revisar')}
          />

          {/* 6. DICA DA CECINHO */}
          <CecinhoTip tip={cecinhoTip} />
        </div>

      </div>
    </div>
  );
};