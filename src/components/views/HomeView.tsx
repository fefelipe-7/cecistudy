import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  BookOpen,
  ArrowRight,
  Brain,
  Coffee,
  Heart,
  Plus,
  Zap,
  Flame,
  Check,
  Lightbulb,
  ChevronRight,
  FileText
} from 'lucide-react';
import { Task } from '../../types';
import { useApp } from '../../context/AppContext';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { getCoursesOnWeekday, extractScheduleTime } from '../../lib/schedule';
import { buildSuggestions } from '../../lib/suggestions';

export const HomeView: React.FC = () => {
  const {
    profile,
    courses,
    tasks,
    exams,
    flashcards,
    readings,
    handleToggleTask,
    handleAddTask,
    handleNavigate,
    openStreak,
    streakStats,
    currentWeekProgress,
  } = useApp();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Pending tasks and items calculations
  const pendingTasks = tasks.filter((t) => !t.completed);

  // Provas nos próximos 14 dias (filtro real de data)
  const pendingExamsIn14Days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(today.getDate() + 14);
    return (exams || []).filter((e) => {
      if (e.completed) return false;
      const d = new Date(`${e.date}T00:00:00`);
      return !Number.isNaN(d.getTime()) && d >= today && d <= limit;
    });
  }, [exams]);

  // Time-based Greeting
  const hour = new Date().getHours();
  let greeting = 'bom dia';
  if (hour >= 12 && hour < 18) greeting = 'boa tarde';
  else if (hour >= 18) greeting = 'boa noite';

  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).toLowerCase();

  // Aulas de hoje (derivadas do horário das disciplinas)
  const todayClasses = useMemo(() => getCoursesOnWeekday(courses, new Date()), [courses]);

  // Sugestões do dia (derivadas de flashcards/leituras/provas reais)
  const suggestions = useMemo(
    () => buildSuggestions(flashcards, readings, exams, courses),
    [flashcards, readings, exams, courses]
  );
  const [doneSuggestions, setDoneSuggestions] = useState<Set<string>>(new Set());
  const visibleSuggestions = suggestions.filter((s) => !doneSuggestions.has(s.id));

  const toggleSuggestion = (id: string) => {
    setDoneSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Assuntos a estudar (das tarefas pendentes + sugestões derivadas)
  const studyTopics = useMemo(() => {
    const fromTasks = pendingTasks.slice(0, 3).map((t) => ({
      id: t.id,
      title: t.title,
      course: courses.find((c) => c.id === t.disciplineId)?.name ?? 'tarefa',
      time: '—',
      badge: t.category,
    }));
    if (fromTasks.length >= 3) return fromTasks;
    const extra = visibleSuggestions
      .filter((s) => !fromTasks.some((f) => f.title === s.title))
      .slice(0, 3 - fromTasks.length)
      .map((s) => ({ id: s.id, title: s.title, course: 'sugestão', time: s.time, badge: 'opcional' }));
    return [...fromTasks, ...extra];
  }, [pendingTasks, courses, visibleSuggestions]);

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

  // Days of week progress data
  const weekStudyDays = currentWeekProgress.filter((d) => d.status !== 'weekend');

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-5 pb-1">
      
      {/* Top Header Label & Greeting */}
      <div className="pt-1 px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <p className="text-xs font-medium text-ceci-secondary lowercase">
            {formattedDate}
          </p>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ceci-primary mt-0.5 tracking-tight font-display">
          {greeting}, {profile.name} <span className="font-normal text-xl">✨</span>
        </h1>
      </div>

      {/* Meta do Dia - Detailed & Large Inline Section */}
      <div className="space-y-3 px-1 pt-1">
        {/* Header Row */}
        <div className="flex items-center justify-between border-b border-ceci-border-default pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <h2 className="text-xs font-bold text-ceci-primary font-display uppercase tracking-wider">
              meta do dia
            </h2>
            <span className="text-[10px] font-semibold text-ceci-brand-strong bg-surface-rose px-2.5 py-0.5 rounded-full border border-ceci-border-brand">
              hoje
            </span>
          </div>
          <button
            onClick={() => handleNavigate('estudos', 'sessoes')}
            className="text-xs font-bold text-ceci-brand-strong hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>bora estudar?</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Detailed Descriptive Text */}
        <p className="text-sm sm:text-base text-ceci-primary font-medium leading-relaxed font-display">
          para dar conta do dia com carinho, ainda temos{' '}
          <span className="font-bold text-ceci-brand-strong underline decoration-ceci-border-brand underline-offset-2">
            {pendingTasks.length} {pendingTasks.length === 1 ? 'tarefa pendente' : 'tarefas pendentes'}
          </span>
          {pendingTasks.length > 0 && (
            <span className="text-ceci-secondary font-normal text-xs sm:text-sm">
              {' '}({pendingTasks.slice(0, 2).map((t) => t.title).join(', ')})
            </span>
          )}
          {' '}e <span className="font-bold text-ceci-academic-strong">revisão ativa de conteúdos</span>. vamos manter o ritmo com leveza e foco! ♡
        </p>

        {/* 2 Simple Metric Blocks in a Single Row */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => handleNavigate('faculdade', 'aulas')}
            className="bg-white rounded-2xl p-3 border border-ceci-border-default hover:border-ceci-border-brand tap-interactive text-center flex flex-col items-center justify-center space-y-0.5 shadow-2xs cursor-pointer group"
          >
            <span className="font-display font-bold text-2xl sm:text-3xl text-ceci-brand-strong group-hover:scale-105 transition-transform">
              <AnimatedNumber value={pendingTasks.length} />
            </span>
            <span className="text-[11px] font-semibold text-ceci-secondary leading-tight">
              tarefas pendentes
            </span>
          </button>

          <button
            onClick={() => handleNavigate('faculdade', 'avaliacoes')}
            className="bg-white rounded-2xl p-3 border border-ceci-border-default hover:border-ceci-border-academic tap-interactive text-center flex flex-col items-center justify-center space-y-0.5 shadow-2xs cursor-pointer group"
          >
            <span className="font-display font-bold text-2xl sm:text-3xl text-ceci-academic-strong group-hover:scale-105 transition-transform">
              <AnimatedNumber value={pendingExamsIn14Days.length} />
            </span>
            <span className="text-[11px] font-semibold text-ceci-secondary leading-tight">
              provas nos próx. 14 dias
            </span>
          </button>
        </div>
      </div>

      {/* 2 Cards Separados Num Grid 2x1 (Aulas Hoje & Assuntos para Estudar) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        
        {/* Card 1: Quantidade de Aulas Hoje */}
        <div
          className="card-lift press-card bg-white rounded-[24px] p-4 sm:p-5 border border-ceci-border-subtle shadow-sm space-y-3.5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-ceci-border-subtle">
              <span className="text-xs font-semibold text-ceci-primary font-display">
                aulas hoje
              </span>
              <span className="text-xs font-bold text-ceci-brand-strong bg-surface-rose px-2.5 py-0.5 rounded-full border border-ceci-border-brand">
                {todayClasses.length} {todayClasses.length === 1 ? 'aula' : 'aulas'}
              </span>
            </div>

            <p className="text-xs text-ceci-secondary mt-2">
              {todayClasses.length > 0 ? 'hoje tem aula para você:' : 'hoje não tem aula marcada ♡'}
            </p>

            {/* List of Today's Classes (derivada do horário real das disciplinas) */}
            <div className="space-y-2 mt-3">
              {todayClasses.map((course) => (
                <div
                  key={course.id}
                  className="p-3 rounded-[18px] bg-surface-muted border border-ceci-border-subtle flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-ceci-primary">{course.name}</p>
                    <p className="text-[11px] text-ceci-secondary mt-0.5">
                      {extractScheduleTime(course.schedule) || 'horário a definir'} • {course.room || course.professor}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-ceci-brand-strong bg-surface-rose px-2.5 py-1 rounded-full border border-ceci-border-brand">
                    {course.category || 'aula'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleNavigate('faculdade', 'aulas')}
            className="w-full mt-2 bg-ceci-primary hover:bg-ceci-ink text-white py-2.5 rounded-full text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>ver diário completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* Card 2: Quantidade de Assuntos que Tem que Estudar */}
        <div
          className="card-lift press-card bg-white rounded-[24px] p-4 sm:p-5 border border-ceci-border-subtle shadow-sm space-y-3.5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-ceci-border-subtle">
              <span className="text-xs font-semibold text-ceci-primary font-display">
                assuntos a estudar
              </span>
              <span className="text-xs font-bold text-ceci-academic-strong bg-surface-blue px-2.5 py-0.5 rounded-full border border-ceci-border-academic">
                {studyTopics.length} {studyTopics.length === 1 ? 'tópico' : 'tópicos'}
              </span>
            </div>

            <p className="text-xs text-ceci-secondary mt-2">
              {studyTopics.length > 0 ? 'conteúdos para priorizar hoje:' : 'por enquanto, só respira e começa devagar ♡'}
            </p>

            {/* List of Study Topics (derivada de tarefas pendentes + sugestões) */}
            <div className="space-y-2 mt-3">
              {studyTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="p-2.5 rounded-[18px] bg-surface-muted border border-ceci-border-subtle flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-ceci-primary truncate">{topic.title}</p>
                    <p className="text-[11px] text-ceci-secondary mt-0.5">
                      {topic.course}{topic.time && topic.time !== '—' ? ` • ${topic.time}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-ceci-academic-strong bg-surface-blue px-2 py-0.5 rounded-full border border-ceci-border-academic shrink-0">
                    {topic.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleNavigate('estudos', 'sessoes')}
            className="w-full mt-2 bg-rose-500 hover:bg-ceci-brand text-white py-2.5 rounded-full text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>bora focar?</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>

      </div>

      {/* Card: Seu Progresso (Dias da Semana) — clicável → tela de streak */}
      <div
        onClick={openStreak}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openStreak();
          }
        }}
        className="card-lift press-card bg-white rounded-[24px] p-5 border border-ceci-border-subtle shadow-sm space-y-3.5 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ceci-primary font-display">
            seu progresso semanal
          </h2>
          <span className="text-xs text-ceci-secondary font-medium hover:text-ceci-primary transition-colors">
            ver estatísticas &gt;
          </span>
        </div>

        {/* Streak counter */}
        <div className="flex items-center gap-2">
          <Flame className={`w-4 h-4 ${streakStats.alive ? 'fill-rose-500 text-rose-500' : 'text-ceci-muted'}`} />
          <span className="text-xs font-bold text-ceci-brand-strong bg-surface-rose px-2.5 py-0.5 rounded-full border border-ceci-border-brand">
            <AnimatedNumber value={streakStats.current} /> {streakStats.current === 1 ? 'dia' : 'dias'}
            {streakStats.alive ? ' 🔥' : ''}
          </span>
          {streakStats.longest > 0 && (
            <span className="text-[10px] font-medium text-ceci-secondary">
              recorde: {streakStats.longest} dias
            </span>
          )}
        </div>

        {/* Days of Week Row (seg–sex; fim de semana é descanso) */}
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {weekStudyDays.map((item) => (
            <motion.div
              key={item.dateKey}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`p-2 rounded-[18px] border text-center flex flex-col items-center justify-between cursor-pointer ${
                item.status === 'done'
                  ? 'bg-surface-rose border-ceci-border-brand text-ceci-primary'
                  : item.status === 'today'
                  ? 'bg-white border-rose-500 shadow-2xs'
                  : 'bg-surface-muted border-ceci-border-subtle text-ceci-secondary'
              }`}
            >
              <span className="text-[10px] font-medium lowercase text-ceci-secondary">
                {item.label}
              </span>

              <div className="my-1">
                {item.status === 'done' ? (
                  <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shadow-2xs">
                    ✓
                  </span>
                ) : item.status === 'today' ? (
                  <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center">
                    ✨
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-full bg-surface-muted text-ceci-muted font-bold text-[10px] flex items-center justify-center">
                    •
                  </span>
                )}
              </div>

              <span className="text-[9px] font-medium text-ceci-secondary truncate w-full">
                {item.status === 'today' ? 'hoje' : item.status === 'done' ? 'feito ♡' : 'vago'}
              </span>
            </motion.div>
          ))}
        </div>

        <p className="text-[10px] text-ceci-tertiary text-center">
          sáb e dom são seu descanso ♡
        </p>
      </div>

      {/* Section Header: Recent Tasks & Action Plan */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-ceci-primary font-display">
            plano de ação
          </h2>
          <span className="text-xs text-ceci-secondary font-medium">
            {tasks.filter((t) => t.completed).length} de {tasks.length} concluídas
          </span>
        </div>

        {/* Minhas Tarefas */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleToggleTask(task.id)}
                className={`p-3.5 rounded-[20px] bg-white border border-ceci-border-subtle shadow-sm hover:border-ceci-border-default tap-interactive cursor-pointer flex items-center justify-between gap-3 ${
                  task.completed ? 'opacity-60 bg-surface-muted' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button className="text-ceci-primary cursor-pointer">
                    {task.completed ? (
                      <motion.span
                        key={`done-${task.id}`}
                        initial={{ scale: 0.4 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                        className="inline-flex"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-700 fill-green-200/40" />
                      </motion.span>
                    ) : (
                      <Circle className="w-5 h-5 text-ceci-muted" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className={`text-xs sm:text-sm font-medium ${task.completed ? 'line-through text-ceci-muted' : 'text-ceci-primary'}`}>
                      {task.title}
                    </p>
                    <p className="text-[11px] text-ceci-secondary mt-0.5">
                      prazo: {task.dueDate || 'sem prazo'}
                      {task.disciplineId && courses.find((c) => c.id === task.disciplineId)?.name
                        ? ` • ${courses.find((c) => c.id === task.disciplineId)!.name}`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-xs font-bold text-ceci-brand-strong shrink-0">
                  ♡
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Quick Add Form */}
          <form onSubmit={handleAddNewTask} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="adicionar uma tarefa para hoje..."
              className="flex-1 text-xs px-4 py-2.5 rounded-full border border-ceci-border-default bg-white focus:outline-none focus:border-rose-500 text-ceci-primary placeholder-ceci-faded shadow-2xs"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="bg-rose-500 hover:bg-ceci-brand text-white px-4 py-2.5 rounded-full text-xs font-semibold tap-interactive flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>adicionar</span>
            </motion.button>
          </form>
        </div>

        {/* Sugestões do Sistema (Opcionais) */}
        <div className="pt-3 space-y-2">
          <p className="text-xs font-medium text-ceci-secondary px-1">
            sugestões para o seu dia
          </p>

          <AnimatePresence mode="popLayout">
            {visibleSuggestions.map((sug) => (
              <motion.div
                key={sug.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleSuggestion(sug.id)}
                className={`p-3 rounded-[20px] bg-white border border-ceci-border-subtle shadow-sm hover:border-ceci-border-default tap-interactive cursor-pointer flex items-center justify-between gap-3 ${
                  sug.completed ? 'opacity-60 bg-surface-muted' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button className="text-ceci-primary cursor-pointer">
                    {sug.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-ceci-academic-strong" />
                    ) : (
                      <Circle className="w-4 h-4 text-ceci-muted" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium ${sug.completed ? 'line-through text-ceci-muted' : 'text-ceci-primary'}`}>
                      {sug.title}
                    </p>
                    <p className="text-[10px] text-ceci-secondary mt-0.5">
                      tempo estimado: {sug.time}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-medium text-ceci-academic-strong bg-surface-blue border border-ceci-border-academic px-2.5 py-1 rounded-full shrink-0">
                  opcional
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Dica da Ceci */}
          <div className="p-4 rounded-[22px] bg-white border border-ceci-border-subtle shadow-sm mt-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-ceci-primary font-display">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>dica da ceci ✨</span>
            </div>
            <p className="text-xs text-ceci-secondary mt-1.5 leading-relaxed">
              suas obrigações vêm primeiro, sempre! mas se sobrar um tempinho no fim da tarde, essas sugestões ajudam a adiantar as revisões ♡
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

