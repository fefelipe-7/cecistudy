import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Plus,
  Flame,
  Brain,
  GraduationCap,
  Clock,
  CalendarDays,
  Activity,
  DoorOpen,
} from 'lucide-react';
import { Task } from '../../types';
import { useApp } from '../../context/AppContext';
import { useLongPress } from '../../lib/useLongPress';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { Mascote } from '../ui/Mascote';
import { SectionTitle } from '../ui/SectionTitle';
import { CompletionToggle } from '../ui/CompletionToggle';
import { getTodaySchedule } from '../../lib/schedule';
import { isDueToday } from '../../lib/review';
import { getDailyGoalMessage, getGreeting, formatDueLabel, type DueUrgency } from '../../lib/homeMeta';
import { pickTip } from '../../lib/tips';
import type { WeekDayStatus } from '../../lib/streak';

/** Cor do prazo relativo por urgência. */
const DUE_STYLES: Record<DueUrgency, string> = {
  overdue: 'text-red-700 font-bold',
  today: 'text-red-700 font-bold',
  tomorrow: 'text-amber-text font-semibold',
  soon: 'text-ceci-secondary',
  later: 'text-ceci-secondary',
  none: 'text-ceci-muted',
};

const ATTENTION_LIMIT = 5;

/** Tarefa do plano de ação: toque alterna, long-press/clique direito abre o menu contextual. */
const TaskRow: React.FC<{ task: Task }> = ({ task }) => {
  const { courses, handleToggleTask, openManageItem } = useApp();
  const handlers = useLongPress({
    onLongPress: () => openManageItem('task', task.id),
    onClick: () => handleToggleTask(task.id),
  });
  const courseName = courses.find((c) => c.id === task.disciplineId)?.name;
  const due = formatDueLabel(task.dueDate);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.98 }}
      {...handlers}
      className={`p-4 rounded-[22px] bg-white border shadow-sm tap-interactive cursor-pointer flex items-center justify-between gap-3 ${
        task.completed
          ? 'opacity-60 bg-surface-muted border-ceci-border-subtle'
          : 'border-ceci-border-default hover:border-ceci-border-brand'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <CompletionToggle
          checked={task.completed}
          onChange={() => handleToggleTask(task.id)}
          label={task.completed ? `marcar "${task.title}" como pendente` : `marcar "${task.title}" como concluída`}
        />
        <div className="min-w-0">
          <p className={`text-sm font-medium ${task.completed ? 'line-through text-ceci-muted' : 'text-ceci-primary'}`}>
            {task.title}
          </p>
          <p className={`text-[11px] mt-1 flex items-center gap-1.5 flex-wrap`}>
            {task.priority === 'alta' && !task.completed && (
              <span className="font-bold text-red-700">🔥 alta</span>
            )}
            <span className={DUE_STYLES[due.urgency]}>{due.label}</span>
            {courseName && <span className="text-ceci-muted">• {courseName}</span>}
          </p>
        </div>
      </div>

      <div className="w-9 h-9 rounded-xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-sm font-bold text-ceci-brand-strong shrink-0">
        ♡
      </div>
    </motion.div>
  );
};

/** Prova no bloco de atenção: leva à disciplina. Mesmo peso visual da tarefa. */
const ExamRow: React.FC<{ examId: string }> = ({ examId }) => {
  const { exams, courses, handleNavigate } = useApp();
  const exam = exams.find((e) => e.id === examId);
  if (!exam) return null;
  const course = courses.find((c) => c.id === exam.courseId);
  const due = formatDueLabel(exam.date);

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.98 }}
      onClick={() => handleNavigate('faculdade', undefined, exam.courseId)}
      className="w-full p-4 rounded-[22px] bg-white border border-ceci-border-default shadow-sm hover:border-ceci-border-academic tap-interactive cursor-pointer flex items-center justify-between gap-3 text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-11 h-11 rounded-2xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5 text-ceci-academic-strong" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ceci-primary truncate">{exam.title}</p>
          <p className="text-[11px] mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-ceci-academic-strong">prova</span>
            <span className={DUE_STYLES[due.urgency]}>· {due.label}</span>
            {course && <span className="text-ceci-muted">• {course.name}</span>}
          </p>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-ceci-muted shrink-0" />
    </motion.button>
  );
};

/** Bolinha de um dia na linha do ritmo semanal. */
const WEEK_CELL_STYLE: Record<WeekDayStatus, string> = {
  done: 'bg-rose-500 text-white border-rose-500',
  today: 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand ring-2 ring-rose-300/50',
  upcoming: 'bg-white text-ceci-muted border-ceci-border-default',
  weekend: 'bg-surface-muted text-ceci-faded border-ceci-border-subtle',
};

export const HomeView: React.FC = () => {
  const {
    profile,
    courses,
    tasks,
    exams,
    flashcards,
    handleAddTask,
    handleNavigate,
    openStreak,
    openStudy,
    streakStats,
    currentWeekProgress,
  } = useApp();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const greeting = getGreeting();

  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
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
    () => flashcards.filter(isDueToday).length,
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

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: 'task_' + Date.now(),
      title: newTaskTitle.trim(),
      completed: false,
      priority: 'media',
      category: 'outro'
    };

    handleAddTask(newTask);
    setNewTaskTitle('');
  };

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-6 pb-1">

      {/* ================================================================ */}
      {/* 1. HERO — saudação + data + frase do dia                          */}
      {/* ================================================================ */}
      <section className="rounded-[26px] bg-gradient-to-br from-white to-surface-rose border border-ceci-border-subtle shadow-sm p-5 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <p className="text-xs font-medium text-ceci-secondary lowercase">{formattedDate}</p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ceci-primary mt-1 tracking-tight font-display">
              {greeting}, {profile.name} ✨
            </h1>
          </div>
          <Mascote expression="welcome-wave" className="w-14 h-14 shrink-0" decorative />
        </div>
        <p className="text-xs sm:text-[13px] text-ceci-secondary leading-relaxed mt-2.5 max-w-[92%]">
          {dayMessage}
        </p>
      </section>

      {/* Desktop (≥ lg): grade de 2 colunas — esquerda: facul/atenção · direita: ritmo/ações/dica */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">

      {/* coluna esquerda */}
      <div className="lg:col-span-7 space-y-6">

      {/* ================================================================ */}
      {/* 2. HOJE NA FACUL — aulas como cards reais                         */}
      {/* ================================================================ */}
      <section className="space-y-3 px-0.5">
        <SectionTitle icon={<CalendarDays className="w-4 h-4 text-ceci-academic-strong" />}>
          hoje na facul
        </SectionTitle>

        {todaySchedule.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {todaySchedule.map(({ course, slot }) => (
              <button
                key={`${course.id}-${slot.start}`}
                onClick={() => handleNavigate('faculdade', undefined, course.id)}
                className="flex items-center gap-3 p-3.5 rounded-[20px] bg-white border border-ceci-border-default hover:border-ceci-border-brand shadow-sm tap-interactive active:scale-[0.99] transition-all cursor-pointer text-left"
              >
                <div className="text-center shrink-0 w-12">
                  <p className="font-display font-bold text-base text-ceci-primary leading-none tabular-nums">
                    {slot.start}
                  </p>
                  {slot.end && (
                    <p className="text-[10px] text-ceci-tertiary mt-0.5 tabular-nums">→ {slot.end}</p>
                  )}
                </div>
                <div className="w-px self-stretch bg-ceci-border-subtle" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ceci-primary truncate">{course.name}</p>
                  <p className="text-[11px] text-ceci-secondary mt-0.5 flex items-center gap-1 truncate">
                    <DoorOpen className="w-3 h-3 shrink-0" />
                    {course.room || 'sala a confirmar'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-ceci-muted shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ceci-tertiary px-1">
            hoje não tem aula — dia livre para o cantinho ♡
          </p>
        )}
      </section>

      {/* ================================================================ */}
      {/* 3. SUA ATENÇÃO HOJE — até 5 cards com prazo relativo              */}
      {/* ================================================================ */}
      <section className="space-y-3 px-0.5">
        <SectionTitle
          icon={<Sparkles className="w-4 h-4 text-rose-500" />}
          action={
            remainingAttention > 0 ? (
              <button
                onClick={() => handleNavigate('faculdade')}
                className="text-xs font-bold text-ceci-brand-strong hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>ver todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : undefined
          }
        >
          sua atenção hoje
        </SectionTitle>

        {attentionItems.length > 0 ? (
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {attentionItems.map((item) =>
                item.kind === 'task' ? (
                  <TaskRow key={item.id} task={tasks.find((t) => t.id === item.id)!} />
                ) : (
                  <ExamRow key={item.id} examId={item.id} />
                )
              )}
            </AnimatePresence>
            {remainingAttention > 0 && (
              <p className="text-[11px] text-ceci-secondary px-1">
                + {remainingAttention} {remainingAttention === 1 ? 'item pendente' : 'itens pendentes'} aguardando por você ♡
              </p>
            )}
          </div>
        ) : (
          <div className="p-5 rounded-[22px] bg-white border border-ceci-border-subtle shadow-sm text-center space-y-1">
            <p className="text-sm font-display font-semibold text-ceci-primary">
              nada urgente por aqui ✨
            </p>
            <p className="text-xs text-ceci-secondary">
              dia livre! que tal adiantar uma revisão ou uma leitura?
            </p>
          </div>
        )}

        {/* Captura rápida de tarefa */}
        <form onSubmit={handleAddNewTask} className="flex gap-2 pt-1">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="adicionar uma tarefa para hoje..."
            className="flex-1 text-sm px-4 py-3 rounded-full border border-ceci-border-default bg-white focus:outline-none focus:border-rose-500 text-ceci-primary placeholder-ceci-faded shadow-2xs"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            aria-label="adicionar tarefa"
            className="bg-rose-500 hover:bg-ceci-brand text-white px-4 py-3 rounded-full text-sm font-semibold tap-interactive flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>adicionar</span>
          </motion.button>
        </form>
      </section>

      </div>

      {/* coluna direita */}
      <div className="lg:col-span-5 space-y-6">

      {/* ================================================================ */}
      {/* 4. RITMO DA SEMANA — linha visual dos 7 dias                      */}
      {/* ================================================================ */}
      <section className="px-0.5 pt-5 sm:pt-7">
        <button
          onClick={openStreak}
          aria-label="ver sua ofensiva de estudos"
          className="w-full card-lift bg-white rounded-[22px] p-5 border border-ceci-border-default hover:border-ceci-border-brand shadow-sm cursor-pointer space-y-4 tap-interactive text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500" />
              <h2 className="text-xs font-bold text-ceci-primary font-display uppercase tracking-wider">
                seu ritmo
              </h2>
            </div>
            <span className="text-[11px] text-ceci-secondary flex items-center gap-1">
              recorde: {streakStats.longest > 0 ? streakStats.longest : '—'}
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* dias da semana (seg → dom) */}
          <div className="flex items-center justify-between gap-1.5">
            {currentWeekProgress.map((cell) => (
              <div key={cell.dateKey} className="flex flex-col items-center gap-1 flex-1">
                <span
                  className={`w-full max-w-[34px] aspect-square rounded-xl border flex items-center justify-center text-[11px] font-bold ${WEEK_CELL_STYLE[cell.status]}`}
                >
                  {cell.active ? '✓' : cell.label.slice(0, 1).toUpperCase()}
                </span>
                <span className={`text-[10px] font-semibold ${
                  cell.status === 'today' ? 'text-ceci-brand-strong' : 'text-ceci-muted'
                }`}>
                  {cell.label.slice(0, 3)}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-ceci-secondary flex items-center gap-1.5 border-t border-ceci-border-subtle pt-3.5 -mb-0.5">
            <Flame className={`w-4 h-4 shrink-0 ${streakStats.alive ? 'fill-rose-500 text-rose-500' : 'text-ceci-muted'}`} />
            <span>
              sequência de{' '}
              <AnimatedNumber value={streakStats.current} />{' '}
              {streakStats.current === 1 ? 'dia' : 'dias'}
              {streakStats.alive ? ' — bora manter! 🔥' : ' — hoje é um bom dia para recomeçar ♡'}
            </span>
          </p>
        </button>
      </section>

      {/* ================================================================ */}
      {/* 5. AÇÖES RÁPIDAS                                                  */}
      {/* ================================================================ */}
      <section className="px-0.5">
        <SectionTitle icon={<Clock className="w-4 h-4 text-ceci-brand-strong" />}>
          bora cuidar disso?
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 pt-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => openStudy('focus')}
            className="bg-ceci-primary hover:bg-ceci-ink text-white rounded-[24px] p-5 text-left tap-interactive cursor-pointer space-y-2 shadow-sm min-h-[110px]"
          >
            <Brain className="w-6 h-6 text-rose-200" />
            <p className="text-base font-bold font-display">bora focar?</p>
            <p className="text-[11px] text-white/70">sessão de estudo com timer</p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => openStudy('revisar')}
            className="bg-white hover:border-ceci-border-brand rounded-[24px] p-5 text-left border border-ceci-border-default tap-interactive cursor-pointer space-y-2 shadow-sm min-h-[110px]"
          >
            <Clock className="w-6 h-6 text-ceci-brand-strong" />
            <div className="flex items-center gap-2">
              <p className="text-base font-bold font-display text-ceci-primary">revisar</p>
              {dueCardsCount > 0 && (
                <span className="text-[10px] font-bold text-ceci-brand-strong bg-surface-rose px-2 py-0.5 rounded-full border border-ceci-border-brand">
                  {dueCardsCount}
                </span>
              )}
            </div>
            <p className="text-[11px] text-ceci-secondary">
              {dueCardsCount > 0 ? `${dueCardsCount} ${dueCardsCount === 1 ? 'cartão vencido' : 'cartões vencidos'}` : 'cartões em dia ♡'}
            </p>
          </motion.button>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 6. DICA DA CECI — com companhia                                   */}
      {/* ================================================================ */}
      <div className="p-4 rounded-[22px] bg-white border border-ceci-border-subtle shadow-sm flex items-center gap-3">
        <Mascote expression="celebrate-small" className="w-12 h-12 shrink-0" decorative />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-ceci-primary font-display">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span>dica do cecinho ✨</span>
          </div>
          <p className="text-xs text-ceci-secondary mt-1 leading-relaxed">
            {cecinhoTip}
          </p>
        </div>
      </div>
      </div>

      </div>

    </div>
  );
};
