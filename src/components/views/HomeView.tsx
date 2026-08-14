import React, { useState } from 'react';
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
  Smile,
  FileText
} from 'lucide-react';
import { Task } from '../../types';
import { useApp } from '../../context/AppContext';
import { AnimatedNumber } from '../ui/AnimatedNumber';

export const HomeView: React.FC = () => {
  const {
    profile,
    tasks,
    exams,
    currentMood,
    handleToggleTask,
    handleAddTask,
    handleNavigate,
    openMoodView,
  } = useApp();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Pending tasks and items calculations
  const pendingTasks = tasks.filter((t) => !t.completed);
  const pendingExamsIn14Days = (exams || []).filter((e) => !e.completed);

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

  // System suggestions (optional tasks)
  const [systemSuggestions, setSystemSuggestions] = useState([
    {
      id: 'sug_1',
      title: 'revisar 10 flashcards de psicopatologia',
      category: 'sugestão • opcional',
      time: '15 min',
      completed: false
    },
    {
      id: 'sug_2',
      title: 'ler 5 páginas restantes do capítulo 4 de beck',
      category: 'sugestão • opcional',
      time: '20 min',
      completed: false
    }
  ]);

  const toggleSuggestion = (id: string) => {
    setSystemSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: 'task_' + Date.now(),
      title: newTaskTitle.trim(),
      completed: false,
      priority: 'alta',
      category: 'trabalho',
      dueDate: 'hoje'
    };

    handleAddTask(newTask);
    setNewTaskTitle('');
  };

  // Days of week progress data
  const weekDaysProgress = [
    { day: 'seg', date: '04/08', label: '2 aulas + anotações', completed: true, status: 'aula & notas' },
    { day: 'ter', date: '05/08', label: 'leitura cap. 4 beck', completed: true, status: 'leitura' },
    { day: 'qua', date: '06/08', label: '12 flashcards revisados', completed: true, status: 'revisão' },
    { day: 'qui', date: '07/08', label: 'foco 1h45 psicopatologia', completed: true, status: 'foco ativo' },
    { day: 'sex', date: '08/08', label: 'hoje em andamento ♡', completed: false, isToday: true, status: 'hoje' },
    { day: 'sáb', date: '09/08', label: 'pausa & descanso', completed: false, status: 'livre' },
    { day: 'dom', date: '10/08', label: 'planejamento da semana', completed: false, status: 'planejamento' }
  ];

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-5 pb-1">
      
      {/* Top Header Label & Greeting + Mood Button */}
      <div className="flex items-center justify-between pt-1 px-0.5">
        <div>
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

        {/* Daily Mood Face Button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={openMoodView}
          title="conta como você está se sentindo hoje?"
          className="group relative flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-ceci-border-subtle shadow-sm cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-surface-rose flex items-center justify-center text-lg border border-ceci-border-brand group-hover:scale-105 transition-transform">
            {currentMood.emoji || '🤓'}
          </div>
          <div className="hidden sm:block text-left pr-1">
            <p className="text-[10px] font-bold text-ceci-brand-strong lowercase tracking-wider">estado de espírito</p>
            <p className="text-xs font-medium text-ceci-primary truncate max-w-[90px] lowercase">
              {currentMood.label || 'focada'}
            </p>
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-500 border-2 border-white" />
        </motion.button>
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
                2 aulas
              </span>
            </div>

            <p className="text-xs text-ceci-secondary mt-2">
              hoje tem aula para você:
            </p>

            {/* List of Today's Classes */}
            <div className="space-y-2 mt-3">
              <div className="p-3 rounded-[18px] bg-surface-muted border border-ceci-border-subtle flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-ceci-primary">Psicopatologia</p>
                  <p className="text-[11px] text-ceci-secondary mt-0.5">09:00 • Sala 204</p>
                </div>
                <span className="text-[10px] font-medium text-ceci-brand-strong bg-surface-rose px-2.5 py-1 rounded-full border border-ceci-border-brand">
                  presencial
                </span>
              </div>

              <div className="p-3 rounded-[18px] bg-surface-muted border border-ceci-border-subtle flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-ceci-primary">Psicologia Social</p>
                  <p className="text-[11px] text-ceci-secondary mt-0.5">14:00 • Bloco B</p>
                </div>
                <span className="text-[10px] font-medium text-ceci-academic-strong bg-surface-blue px-2.5 py-1 rounded-full border border-ceci-border-academic">
                  seminário
                </span>
              </div>
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
                3 tópicos
              </span>
            </div>

            <p className="text-xs text-ceci-secondary mt-2">
              conteúdos para priorizar hoje:
            </p>

            {/* List of Study Topics */}
            <div className="space-y-2 mt-3">
              <div className="p-2.5 rounded-[18px] bg-surface-muted border border-ceci-border-subtle flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-ceci-primary truncate">Pensamentos Automáticos</p>
                  <p className="text-[11px] text-ceci-secondary mt-0.5">Psicopatologia • 30m</p>
                </div>
                <span className="text-[10px] font-medium text-ceci-academic-strong bg-surface-blue px-2 py-0.5 rounded-full border border-ceci-border-academic shrink-0">
                  tcc
                </span>
              </div>

              <div className="p-2.5 rounded-[18px] bg-surface-muted border border-ceci-border-subtle flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-ceci-primary truncate">Influência Social</p>
                  <p className="text-[11px] text-ceci-secondary mt-0.5">Psicologia Social • 45m</p>
                </div>
                <span className="text-[10px] font-medium text-beige-700 bg-surface-subtle px-2 py-0.5 rounded-full border border-cream-200 shrink-0">
                  leitura
                </span>
              </div>

              <div className="p-2.5 rounded-[18px] bg-surface-muted border border-ceci-border-subtle flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-ceci-primary truncate">Fobia Específica</p>
                  <p className="text-[11px] text-ceci-secondary mt-0.5">Cap. 4 Beck • 20m</p>
                </div>
                <span className="text-[10px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 shrink-0">
                  ficha
                </span>
              </div>
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

      {/* Card: Seu Progresso (Dias da Semana) */}
      <div
        className="card-lift press-card bg-white rounded-[24px] p-5 border border-ceci-border-subtle shadow-sm space-y-3.5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ceci-primary font-display">
            seu progresso semanal
          </h2>
          <span className="text-xs text-ceci-secondary font-medium cursor-pointer hover:text-ceci-primary transition-colors">
            ver estatísticas &gt;
          </span>
        </div>

        {/* Days of Week Row */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {weekDaysProgress.map((item) => (
            <motion.div
              key={item.day}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`p-2 rounded-[18px] border text-center flex flex-col items-center justify-between cursor-pointer ${
                item.completed
                  ? 'bg-surface-rose border-ceci-border-brand text-ceci-primary'
                  : item.isToday
                  ? 'bg-white border-rose-500 shadow-2xs'
                  : 'bg-surface-muted border-ceci-border-subtle text-ceci-secondary'
              }`}
            >
              <span className="text-[10px] font-medium lowercase text-ceci-secondary">
                {item.day}
              </span>

              <div className="my-1">
                {item.completed ? (
                  <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shadow-2xs">
                    ✓
                  </span>
                ) : item.isToday ? (
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
                {item.status}
              </span>
            </motion.div>
          ))}
        </div>
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
                      prazo: {task.dueDate || 'hoje'} • Psicopatologia
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
            {systemSuggestions.map((sug) => (
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

