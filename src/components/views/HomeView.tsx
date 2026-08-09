import React, { useState } from 'react';
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
  let greeting = 'Bom dia';
  if (hour >= 12 && hour < 18) greeting = 'Boa tarde';
  else if (hour >= 18) greeting = 'Boa noite';

  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  // System suggestions (optional tasks)
  const [systemSuggestions, setSystemSuggestions] = useState([
    {
      id: 'sug_1',
      title: 'Revisar 10 flashcards de Psicopatologia',
      category: 'Sugestão • Opcional',
      time: '15 min',
      completed: false
    },
    {
      id: 'sug_2',
      title: 'Ler 5 páginas restantes do Capítulo 4 de Beck',
      category: 'Sugestão • Opcional',
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
      dueDate: 'Hoje'
    };

    onAddTask(newTask);
    setNewTaskTitle('');
  };

  // Days of week progress data
  const weekDaysProgress = [
    { day: 'Seg', date: '04/08', label: '2 Aulas + Anotações', completed: true, status: 'Aula & Notas' },
    { day: 'Ter', date: '05/08', label: 'Leitura Cap. 4 Beck', completed: true, status: 'Leitura' },
    { day: 'Qua', date: '06/08', label: '12 Flashcards Revisados', completed: true, status: 'Revisão' },
    { day: 'Qui', date: '07/08', label: 'Foco 1h45 Psicopatologia', completed: true, status: 'Foco Ativo' },
    { day: 'Sex', date: '08/08', label: 'Hoje em andamento ♡', completed: false, isToday: true, status: 'Hoje' },
    { day: 'Sáb', date: '09/08', label: 'Pausa & Descanso', completed: false, status: 'Livre' },
    { day: 'Dom', date: '10/08', label: 'Planejamento da semana', completed: false, status: 'Planejamento' }
  ];

  return (
    <div className="max-w-md sm:max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Top Header Label & Greeting + Clickable Mood Face Emoji */}
      <div className="flex items-center justify-between pt-2 px-1">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-semibold tracking-wider text-[#96888C] uppercase">
              {formattedDate}
            </p>
            <span className="text-[#CE5373] text-xs">♡</span>
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl text-[#3D3336] font-bold mt-0.5 tracking-tight">
            {greeting}, {profile.name} <span className="text-[#E26D8B] font-normal text-xl sm:text-2xl">✨</span>
          </h1>
        </div>

        {/* Daily Mood Face Button (Opens Dedicated Mood View) */}
        <button
          onClick={onOpenMoodView}
          title="Clique para definir/alterar seu Estado de Espírito do Dia"
          className="group relative flex items-center gap-2 bg-white hover:bg-[#FFEAF0]/60 p-2.5 rounded-2xl border border-[#FFD4E0] shadow-2xs transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FFEAF0] flex items-center justify-center text-2xl shadow-inner border border-[#FFD4E0] group-hover:scale-110 transition-transform">
            {currentMood.emoji || '🤓'}
          </div>
          <div className="hidden sm:block text-left pr-1">
            <p className="text-[10px] font-bold text-[#CE5373] uppercase tracking-wider">Estado de Espírito</p>
            <p className="text-xs font-serif-display font-bold text-[#3D3336] truncate max-w-[110px]">
              {currentMood.label || 'Focada'}
            </p>
          </div>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#CE5373] border-2 border-white animate-pulse" />
        </button>
      </div>

      {/* 2 Cards Separados Num Grid 2x1 (Aulas Hoje & Assuntos para Estudar) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Card 1: Quantidade de Aulas Hoje */}
        <div className="journal-card p-5 bg-gradient-to-br from-[#FFEAF0]/90 via-white to-[#FFF7EC]/40 border border-[#FFD4E0] space-y-3.5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#FFD4E0]/70">
              <span className="text-[10px] font-bold text-[#CE5373] uppercase tracking-wider bg-white/90 px-3 py-1 rounded-full border border-[#FFD4E0] shadow-2xs">
                Aulas Hoje ♡
              </span>
              <span className="text-xs font-serif-display font-bold text-[#CE5373] bg-[#FFEAF0] px-3 py-0.5 rounded-full border border-[#FFD4E0]">
                02 Aulas Presenciais
              </span>
            </div>

            <div className="mt-3">
              <h3 className="font-serif-display text-xl font-bold text-[#3D3336]">
                Cronograma Acadêmico
              </h3>
              <p className="text-xs text-[#6B5E62] mt-0.5">
                Suas aulas e seminários agendados para hoje:
              </p>
            </div>

            {/* List of Today's Classes */}
            <div className="space-y-2.5 mt-3">
              <div className="p-3 rounded-2xl bg-white/95 border border-[#FFD4E0] flex items-start justify-between text-xs shadow-2xs hover:border-[#E26D8B] transition-all">
                <div className="flex items-start gap-2.5">
                  <span className="text-xs font-bold text-[#CE5373] bg-[#FFEAF0] px-2 py-1 rounded-xl border border-[#FFD4E0] shrink-0 mt-0.5">
                    09:00
                  </span>
                  <div>
                    <p className="font-bold text-[#3D3336]">Psicopatologia</p>
                    <p className="text-[11px] text-[#6B5E62] mt-0.5">Sala 204 • Profa. Helena Matos</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#CE5373] bg-[#FFEAF0] px-2.5 py-1 rounded-full border border-[#FFD4E0] shrink-0">
                  Presencial
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/95 border border-[#CEE1EF] flex items-start justify-between text-xs shadow-2xs hover:border-[#4B85A6] transition-all">
                <div className="flex items-start gap-2.5">
                  <span className="text-xs font-bold text-[#33627E] bg-[#E6F0F7] px-2 py-1 rounded-xl border border-[#CEE1EF] shrink-0 mt-0.5">
                    14:00
                  </span>
                  <div>
                    <p className="font-bold text-[#3D3336]">Psicologia Social</p>
                    <p className="text-[11px] text-[#6B5E62] mt-0.5">Bloco B • Prof. André Vidal</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#33627E] bg-[#E6F0F7] px-2.5 py-1 rounded-full border border-[#CEE1EF] shrink-0">
                  Seminário
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('faculdade', 'aulas')}
            className="w-full mt-2 bg-[#E26D8B] hover:bg-[#CE5373] text-white py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.99]"
          >
            <span>Ver diário de aulas completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Quantidade de Assuntos que Tem que Estudar */}
        <div className="journal-card p-5 bg-gradient-to-br from-[#E6F0F7]/90 via-white to-[#FFEAF0]/40 border border-[#CEE1EF] space-y-3.5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#CEE1EF]/70">
              <span className="text-[10px] font-bold text-[#33627E] uppercase tracking-wider bg-white/90 px-3 py-1 rounded-full border border-[#CEE1EF] shadow-2xs">
                Assuntos a Estudar ✨
              </span>
              <span className="text-xs font-serif-display font-bold text-[#33627E] bg-[#E6F0F7] px-3 py-0.5 rounded-full border border-[#CEE1EF]">
                03 Tópicos Hoje
              </span>
            </div>

            <div className="mt-3">
              <h3 className="font-serif-display text-xl font-bold text-[#3D3336]">
                Foco & Metas de Leitura
              </h3>
              <p className="text-xs text-[#6B5E62] mt-0.5">
                Conteúdos priorizados para sua sessão de estudo:
              </p>
            </div>

            {/* List of Study Topics */}
            <div className="space-y-2.5 mt-3">
              <div className="p-3 rounded-2xl bg-white/95 border border-[#CEE1EF] flex items-center justify-between text-xs shadow-2xs hover:border-[#33627E] transition-all">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-[#E6F0F7] text-[#33627E] font-bold flex items-center justify-center text-xs shrink-0">
                    01
                  </span>
                  <div>
                    <p className="font-bold text-[#3D3336]">Pensamentos Automáticos</p>
                    <p className="text-[11px] text-[#6B5E62]">Psicopatologia • 30 min de estudo</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#33627E] bg-[#E6F0F7] px-2.5 py-1 rounded-full border border-[#CEE1EF] shrink-0">
                  TCC
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/95 border border-[#FFF0DB] flex items-center justify-between text-xs shadow-2xs hover:border-[#9E6B38] transition-all">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-[#FFF7EC] text-[#9E6B38] font-bold flex items-center justify-center text-xs shrink-0">
                    02
                  </span>
                  <div>
                    <p className="font-bold text-[#3D3336]">Influência Social</p>
                    <p className="text-[11px] text-[#6B5E62]">Psicologia Social • 45 min de leitura</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#9E6B38] bg-[#FFF7EC] px-2.5 py-1 rounded-full border border-[#FFF0DB] shrink-0">
                  Leitura
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/95 border border-[#CEE4D5] flex items-center justify-between text-xs shadow-2xs hover:border-[#487A5B] transition-all">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-[#E8F3EB] text-[#487A5B] font-bold flex items-center justify-center text-xs shrink-0">
                    03
                  </span>
                  <div>
                    <p className="font-bold text-[#3D3336]">Fobia Específica (Beck)</p>
                    <p className="text-[11px] text-[#6B5E62]">Fichamento Cap. 4 • 20 min</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#487A5B] bg-[#E8F3EB] px-2.5 py-1 rounded-full border border-[#CEE4D5] shrink-0">
                  Ficha
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('estudos', 'sessoes')}
            className="w-full mt-2 bg-[#4B85A6] hover:bg-[#33627E] text-white py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.99]"
          >
            <span>Abrir ambiente de estudo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Card: Seu Progresso (Dias da Semana com Registro / Foco / Estudo) */}
      <div className="journal-card p-6 bg-white border border-[#F0E6E3] space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0E6E3] pb-3">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#96888C] uppercase">
              Registros Semanais
            </span>
            <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#3D3336] mt-0.5">
              Seu Progresso
            </h2>
          </div>
          <span className="text-xs text-[#CE5373] font-bold bg-[#FFEAF0] px-3 py-1 rounded-full border border-[#FFD4E0]">
            4 de 5 dias com foco ✨
          </span>
        </div>

        {/* Days of Week Row */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
          {weekDaysProgress.map((item) => (
            <div
              key={item.day}
              className={`p-2 sm:p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-between ${
                item.completed
                  ? 'bg-[#FFEAF0]/70 border-[#FFD4E0] text-[#3D3336]'
                  : item.isToday
                  ? 'bg-gradient-to-b from-[#FFF7EC] to-white border-[#FFF0DB] ring-2 ring-[#E26D8B]/40'
                  : 'bg-[#FFFDF9] border-[#F0E6E3] opacity-80'
              }`}
            >
              <span className="text-[10px] font-bold uppercase text-[#96888C]">
                {item.day}
              </span>

              <div className="my-1.5">
                {item.completed ? (
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#CE5373] text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                    ♡
                  </span>
                ) : item.isToday ? (
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E26D8B]/20 text-[#CE5373] font-bold text-xs flex items-center justify-center border border-[#FFD4E0]">
                    ✨
                  </span>
                ) : (
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FFFDF9] text-[#B3A5A9] font-bold text-xs flex items-center justify-center border border-[#F0E6E3]">
                    •
                  </span>
                )}
              </div>

              <span className="text-[9px] font-bold text-[#6B5E62] truncate w-full">
                {item.status}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#6B5E62] bg-[#FFF7EC] p-3 rounded-xl border border-[#FFF0DB] leading-relaxed flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#9E6B38] shrink-0" />
          <span>Você registrou presenciais e fichamentos em 4 dias desta semana. Ótima constância!</span>
        </p>
      </div>

      {/* Card: Plano de Ação (Checklist de Tarefas + Sugestões do Sistema) */}
      <div className="journal-card p-6 bg-white border border-[#F0E6E3] space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0E6E3] pb-3">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#96888C] uppercase">
              Checklist do Dia
            </span>
            <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#3D3336] mt-0.5">
              Plano de Ação
            </h2>
          </div>
          <span className="text-xs text-[#6B5E62] font-semibold bg-[#FFEAF0] text-[#CE5373] px-2.5 py-1 rounded-full border border-[#FFD4E0]">
            {tasks.filter((t) => t.completed).length} de {tasks.length} concluídas
          </span>
        </div>

        {/* Minhas Tarefas (Obrigatórias) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-[#3D3336] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#CE5373]" />
              Minhas Tarefas <span className="text-[10px] font-normal text-[#96888C]">(Obrigatórias)</span>
            </span>
          </div>

          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              className={`flex items-start gap-3 p-3.5 rounded-2xl transition-all cursor-pointer border ${
                task.completed
                  ? 'bg-[#FFFDF9] border-[#EFE6DC] opacity-75'
                  : 'bg-white border-[#F0E6E3] hover:border-[#FFD4E0] shadow-2xs'
              }`}
            >
              <button className="mt-0.5 text-[#E26D8B]">
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-[#487A5B] fill-[#487A5B]/20" />
                ) : (
                  <Circle className="w-5 h-5 text-[#B3A5A9]" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs sm:text-sm font-semibold ${task.completed ? 'line-through text-[#96888C]' : 'text-[#3D3336]'}`}>
                    {task.title}
                  </p>
                  <span className="text-[9px] font-bold text-[#CE5373] bg-[#FFEAF0] px-2 py-0.5 rounded-full border border-[#FFD4E0] shrink-0">
                    Obrigatória
                  </span>
                </div>
                <p className="text-[11px] text-[#6B5E62] mt-0.5">
                  Prazo: {task.dueDate || 'Hoje'} • Psicopatologia
                </p>
              </div>
            </div>
          ))}

          {/* Quick Add Form for Custom Mandatory Task */}
          <form onSubmit={handleAddNewTask} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Adicionar nova tarefa obrigatória..."
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E6E3] bg-[#FFFDF9] focus:outline-none focus:border-[#E26D8B] text-[#3D3336] placeholder-[#B3A5A9]"
            />
            <button
              type="submit"
              className="bg-[#E26D8B] hover:bg-[#CE5373] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Criar</span>
            </button>
          </form>
        </div>

        {/* Sugestões do Sistema (Opcionais) */}
        <div className="space-y-2.5 pt-3 border-t border-[#F0E6E3]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#33627E] uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-[#33627E]" />
              Sugestões do Sistema <span className="text-[10px] font-normal text-[#96888C]">(Opcionais)</span>
            </span>
          </div>

          {systemSuggestions.map((sug) => (
            <div
              key={sug.id}
              onClick={() => toggleSuggestion(sug.id)}
              className={`flex items-start gap-3 p-3 rounded-2xl transition-all cursor-pointer border ${
                sug.completed
                  ? 'bg-[#E6F0F7]/40 border-[#CEE1EF] opacity-70'
                  : 'bg-[#FFFDF9] border-[#F0E6E3] hover:border-[#CEE1EF]'
              }`}
            >
              <button className="mt-0.5 text-[#33627E]">
                {sug.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-[#33627E] fill-[#33627E]/20" />
                ) : (
                  <Circle className="w-4 h-4 text-[#B3A5A9]" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs font-medium ${sug.completed ? 'line-through text-[#96888C]' : 'text-[#3D3336]'}`}>
                    {sug.title}
                  </p>
                  <span className="text-[9px] font-bold text-[#33627E] bg-[#E6F0F7] px-2 py-0.5 rounded-full border border-[#CEE1EF] shrink-0">
                    Opcional
                  </span>
                </div>
                <p className="text-[10px] text-[#6B5E62] mt-0.5">
                  Estimativa: {sug.time}
                </p>
              </div>
            </div>
          ))}

          {/* Dica da Ceci / Gentle Note Box */}
          <div className="p-4 rounded-2xl bg-[#FFF7EC] border border-[#FFF0DB] mt-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#9E6B38]">
              <Sparkles className="w-4 h-4 text-[#9E6B38]" />
              <span>Dica da Ceci ✨</span>
            </div>
            <p className="text-xs text-[#6B5E62] mt-1.5 leading-relaxed">
              Suas obrigações vêm em primeiro lugar! As sugestões do sistema foram pensadas para acelerar suas revisões caso tenha tempo extra no final da tarde.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
