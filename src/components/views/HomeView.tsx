import React, { useMemo } from 'react';
import { useDataClientApp, useDataClientCourses, useDataClientStudy } from '@/context/DataClientProvider';
import { useNavValue, useStudyActions } from '@/context/shellNavContexts';
import { getGreeting, getDailyGoalMessage, ATTENTION_LIMIT } from '../../lib/homeMeta';
import { pickTip } from '../../lib/tips';
import { getTodaySchedule } from '../../lib/schedule';
import { isCardDue } from '../../lib/fsrs';
import HeroSection from './home/HeroSection';
import TodayClasses from './home/TodayClasses';
import AttentionSection from './home/AttentionSection';
import WeekRhythmCard from './home/WeekRhythmCard';
import QuickActions from './home/QuickActions';
import CecinhoTip from './home/CecinhoTip';

export const HomeView: React.FC = () => {
  const { profile } = useDataClientApp();
  const { courses, tasks, exams } = useDataClientCourses();
  const { flashcards } = useDataClientStudy();
  const { streakStats, currentWeekProgress } = useStudyActions();
  const { handleNavigate, openStreak, openStudy } = useNavValue();

  const greeting = getGreeting();

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
    return getDailyGoalMessage({ pendingTasks, pendingExams: pendingExamsIn14Days.length });
  }, [tasks, pendingExamsIn14Days]);

  /**
   * Bloco "o que precisa da sua atenção hoje":
   * tarefas pendentes + provas próximas fundidas num único plano (máx. 5 itens),
   * ordenados por prazo (sem prazo vai para o fim).
   */
  const attentionItems = useMemo(() => {
    const byDue = (a?: string, b?: string) => {
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;
      return a.localeCompare(b);
    };
    const taskItems = tasks
      .filter((t) => !t.completed)
      .sort((x, y) => byDue(x.dueDate, y.dueDate))
      .map((t) => ({ kind: 'task' as const, id: t.id }));
    const examItems = [...pendingExamsIn14Days]
      .sort((x, y) => byDue(x.date, y.date))
      .map((e) => ({ kind: 'exam' as const, id: e.id }))
      .filter((e) => !tasks.some((t) => !t.completed && t.title === exams.find((x) => x.id === e.id)?.title));
    return [...taskItems, ...examItems].slice(0, ATTENTION_LIMIT);
  }, [tasks, pendingExamsIn14Days, exams]);

  const remainingAttention = Math.max(
    0,
    tasks.filter((t) => !t.completed).length + pendingExamsIn14Days.length - attentionItems.length
  );

  // Dica contextual do cecinho (derivada do estado real do dia)
  const cecinhoTip = useMemo(
    () =>
      pickTip({
        dueCards: dueCardsCount,
        pendingTasks: tasks.filter((t) => !t.completed).length,
        nextExamDate:
          [...pendingExamsIn14Days].sort((a, b) => a.date.localeCompare(b.date))[0]?.date ?? null,
        streakDays: streakStats.current,
      }),
    [dueCardsCount, tasks, pendingExamsIn14Days, streakStats.current]
  );

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