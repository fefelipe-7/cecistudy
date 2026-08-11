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
  Smile
} from 'lucide-react';
import {
  UserProfile,
  Course,
  Task,
  ClassNote,
  ReadingItem,
  Sticker,
  NavTab
} from '../../types';
import { DailyMoodData } from './EstadoDeEspiritoView';

interface HomeViewProps {
  profile: UserProfile;
  courses: Course[];
  tasks: Task[];
  classes: ClassNote[];
  readings: ReadingItem[];
  stickers: Sticker[];
  currentMood: DailyMoodData;
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Task) => void;
  onNavigate: (tab: NavTab, subTab?: string, targetId?: string) => void;
  onOpenQuickAdd: () => void;
  onOpenMoodView: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  courses,
  tasks,
  classes,
  readings,
  stickers,
  currentMood,
  onToggleTask,
  onAddTask,
  onNavigate,
  onOpenQuickAdd,
  onOpenMoodView,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');

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

    onAddTask(newTask);
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-md sm:max-w-xl mx-auto space-y-5 pb-24"
    >
      
      {/* Top Header Label & Greeting + Mood Button */}
      <div className="flex items-center justify-between pt-1 px-0.5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E97891] animate-pulse" />
            <p className="text-xs font-medium text-[#6D6366] lowercase">
              {formattedDate}
            </p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#40383A] mt-0.5 tracking-tight font-display">
            {greeting}, {profile.name} <span className="font-normal text-xl">✨</span>
          </h1>
        </div>

        {/* Daily Mood Face Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={onOpenMoodView}
          title="clique para definir/alterar seu estado de espírito do dia"
          className="group relative flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-[#F2EBE8] shadow-[0_2px_8px_rgba(64,56,58,0.05)] cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-[#FFF5F7] flex items-center justify-center text-lg border border-[#FFD3DD] group-hover:scale-105 transition-transform">
            {currentMood.emoji || '🤓'}
          </div>
          <div className="hidden sm:block text-left pr-1">
            <p className="text-[10px] font-bold text-[#B94862] lowercase tracking-wider">estado de espírito</p>
            <p className="text-xs font-medium text-[#40383A] truncate max-w-[90px] lowercase">
              {currentMood.label || 'focada'}
            </p>
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#E97891] border-2 border-white" />
        </motion.button>
      </div>

      {/* Inline Daily Highlight */}
      <div className="flex items-center justify-between py-1.5 px-1 border-y border-[#E9DFDC]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#E97891]" />
          <span className="text-xs font-semibold text-[#40383A]">
            meta do dia: <span className="font-normal text-[#6D6366]">revisar psicopatologia</span>
          </span>
        </div>
        <button
          onClick={() => onNavigate('estudos', 'sessoes')}
          className="text-xs font-bold text-[#B94862] hover:underline cursor-pointer"
        >
          estudar agora →
        </button>
      </div>

      {/* 2 Cards Separados Num Grid 2x1 (Aulas Hoje & Assuntos para Estudar) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        
        {/* Card 1: Quantidade de Aulas Hoje */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white rounded-[24px] p-4 sm:p-5 border border-[#F2EBE8] shadow-[0_2px_8px_rgba(64,56,58,0.05)] space-y-3.5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#F2EBE8]">
              <span className="text-xs font-semibold text-[#40383A] font-display">
                aulas hoje
              </span>
              <span className="text-xs font-bold text-[#B94862] bg-[#FFF5F7] px-2.5 py-0.5 rounded-full border border-[#FFD3DD]">
                02 aulas
              </span>
            </div>

            <p className="text-xs text-[#6D6366] mt-2">
              seu cronograma acadêmico de hoje:
            </p>

            {/* List of Today's Classes */}
            <div className="space-y-2 mt-3">
              <div className="p-3 rounded-[18px] bg-[#FAF8F5] border border-[#F2EBE8] flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-[#40383A]">Psicopatologia</p>
                  <p className="text-[11px] text-[#6D6366] mt-0.5">09:00 • Sala 204</p>
                </div>
                <span className="text-[10px] font-medium text-[#B94862] bg-[#FFF5F7] px-2.5 py-1 rounded-full border border-[#FFD3DD]">
                  presencial
                </span>
              </div>

              <div className="p-3 rounded-[18px] bg-[#FAF8F5] border border-[#F2EBE8] flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-[#40383A]">Psicologia Social</p>
                  <p className="text-[11px] text-[#6D6366] mt-0.5">14:00 • Bloco B</p>
                </div>
                <span className="text-[10px] font-medium text-[#396D82] bg-[#F3F9FC] px-2.5 py-1 rounded-full border border-[#CEE7F0]">
                  seminário
                </span>
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('faculdade', 'aulas')}
            className="w-full mt-2 bg-[#40383A] hover:bg-[#282022] text-white py-2.5 rounded-full text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>ver diário completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>

        {/* Card 2: Quantidade de Assuntos que Tem que Estudar */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white rounded-[24px] p-4 sm:p-5 border border-[#F2EBE8] shadow-[0_2px_8px_rgba(64,56,58,0.05)] space-y-3.5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#F2EBE8]">
              <span className="text-xs font-semibold text-[#40383A] font-display">
                assuntos a estudar
              </span>
              <span className="text-xs font-bold text-[#396D82] bg-[#F3F9FC] px-2.5 py-0.5 rounded-full border border-[#CEE7F0]">
                03 tópicos
              </span>
            </div>

            <p className="text-xs text-[#6D6366] mt-2">
              conteúdos priorizados do dia:
            </p>

            {/* List of Study Topics */}
            <div className="space-y-2 mt-3">
              <div className="p-2.5 rounded-[18px] bg-[#FAF8F5] border border-[#F2EBE8] flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-[#40383A] truncate">Pensamentos Automáticos</p>
                  <p className="text-[11px] text-[#6D6366] mt-0.5">Psicopatologia • 30m</p>
                </div>
                <span className="text-[10px] font-medium text-[#396D82] bg-[#F3F9FC] px-2 py-0.5 rounded-full border border-[#CEE7F0] shrink-0">
                  tcc
                </span>
              </div>

              <div className="p-2.5 rounded-[18px] bg-[#FAF8F5] border border-[#F2EBE8] flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-[#40383A] truncate">Influência Social</p>
                  <p className="text-[11px] text-[#6D6366] mt-0.5">Psicologia Social • 45m</p>
                </div>
                <span className="text-[10px] font-medium text-[#756354] bg-[#FFF8F1] px-2 py-0.5 rounded-full border border-[#FFF1E5] shrink-0">
                  leitura
                </span>
              </div>

              <div className="p-2.5 rounded-[18px] bg-[#FAF8F5] border border-[#F2EBE8] flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-[#40383A] truncate">Fobia Específica</p>
                  <p className="text-[11px] text-[#6D6366] mt-0.5">Cap. 4 Beck • 20m</p>
                </div>
                <span className="text-[10px] font-medium text-[#43805B] bg-[#F2FAF5] px-2 py-0.5 rounded-full border border-[#C2E8D0] shrink-0">
                  ficha
                </span>
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('estudos', 'sessoes')}
            className="w-full mt-2 bg-[#E97891] hover:bg-[#D85F79] text-white py-2.5 rounded-full text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>iniciar sessão</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>

      </div>

      {/* Card: Seu Progresso (Dias da Semana) */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="bg-white rounded-[24px] p-5 border border-[#F2EBE8] shadow-[0_2px_8px_rgba(64,56,58,0.05)] space-y-3.5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#40383A] font-display">
            seu progresso semanal
          </h2>
          <span className="text-xs text-[#6D6366] font-medium cursor-pointer hover:text-[#40383A] transition-colors">
            ver estatísticas &gt;
          </span>
        </div>

        {/* Days of Week Row */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {weekDaysProgress.map((item) => (
            <motion.div
              key={item.day}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`p-2 rounded-[18px] border text-center flex flex-col items-center justify-between cursor-pointer ${
                item.completed
                  ? 'bg-[#FFF5F7] border-[#FFD3DD] text-[#40383A]'
                  : item.isToday
                  ? 'bg-white border-[#E97891] shadow-2xs'
                  : 'bg-[#FAF8F5] border-[#F2EBE8] text-[#6D6366]'
              }`}
            >
              <span className="text-[10px] font-medium lowercase text-[#6D6366]">
                {item.day}
              </span>

              <div className="my-1">
                {item.completed ? (
                  <span className="w-6 h-6 rounded-full bg-[#E97891] text-white font-bold text-[10px] flex items-center justify-center shadow-2xs">
                    ✓
                  </span>
                ) : item.isToday ? (
                  <span className="w-6 h-6 rounded-full bg-[#E97891] text-white font-bold text-[10px] flex items-center justify-center">
                    ✨
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-full bg-[#FAF8F5] text-[#ADA3A5] font-bold text-[10px] flex items-center justify-center">
                    •
                  </span>
                )}
              </div>

              <span className="text-[9px] font-medium text-[#6D6366] truncate w-full">
                {item.status}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Section Header: Recent Tasks & Action Plan */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-[#40383A] font-display">
            plano de ação
          </h2>
          <span className="text-xs text-[#6D6366] font-medium">
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
                onClick={() => onToggleTask(task.id)}
                className={`p-3.5 rounded-[20px] bg-white border border-[#F2EBE8] shadow-[0_2px_8px_rgba(64,56,58,0.05)] hover:border-[#E9DFDC] transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  task.completed ? 'opacity-60 bg-[#FAF8F5]' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button className="text-[#40383A] cursor-pointer">
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-[#43805B] fill-[#C2E8D0]/40" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#ADA3A5]" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className={`text-xs sm:text-sm font-medium ${task.completed ? 'line-through text-[#ADA3A5]' : 'text-[#40383A]'}`}>
                      {task.title}
                    </p>
                    <p className="text-[11px] text-[#6D6366] mt-0.5">
                      prazo: {task.dueDate || 'hoje'} • Psicopatologia
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-[#FFF5F7] border border-[#FFD3DD] flex items-center justify-center text-xs font-bold text-[#B94862] shrink-0">
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
              placeholder="adicionar nova tarefa obrigatória..."
              className="flex-1 text-xs px-4 py-2.5 rounded-full border border-[#E9DFDC] bg-white focus:outline-none focus:border-[#E97891] text-[#40383A] placeholder-[#BEB4B6] shadow-2xs"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="bg-[#E97891] hover:bg-[#D85F79] text-white px-4 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>criar</span>
            </motion.button>
          </form>
        </div>

        {/* Sugestões do Sistema (Opcionais) */}
        <div className="pt-3 space-y-2">
          <p className="text-xs font-medium text-[#6D6366] px-1">
            sugestões recomendadas
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
                className={`p-3 rounded-[20px] bg-white border border-[#F2EBE8] shadow-[0_2px_8px_rgba(64,56,58,0.05)] hover:border-[#E9DFDC] transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  sug.completed ? 'opacity-60 bg-[#FAF8F5]' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button className="text-[#40383A] cursor-pointer">
                    {sug.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#396D82]" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#ADA3A5]" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium ${sug.completed ? 'line-through text-[#ADA3A5]' : 'text-[#40383A]'}`}>
                      {sug.title}
                    </p>
                    <p className="text-[10px] text-[#6D6366] mt-0.5">
                      estimativa: {sug.time}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-medium text-[#396D82] bg-[#F3F9FC] border border-[#CEE7F0] px-2.5 py-1 rounded-full shrink-0">
                  opcional
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Dica da Ceci */}
          <div className="p-4 rounded-[22px] bg-white border border-[#F2EBE8] shadow-[0_2px_8px_rgba(64,56,58,0.05)] mt-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#40383A] font-display">
              <Sparkles className="w-4 h-4 text-[#E97891]" />
              <span>dica da ceci ✨</span>
            </div>
            <p className="text-xs text-[#6D6366] mt-1.5 leading-relaxed">
              suas obrigações vêm em primeiro lugar! as sugestões foram pensadas para acelerar suas revisões caso tenha tempo extra no final da tarde.
            </p>
          </div>
        </div>

      </div>

    </motion.div>
  );
};

