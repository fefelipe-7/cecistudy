import React, { useState, useEffect } from 'react';
import {
  Brain,
  Clock,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Coffee,
  Plus,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  ReadingItem,
  Flashcard,
  StudySession,
  Course,
  SubTabEstudos
} from '../../types';

import { ContinueReadingWidget } from '../widgets/ContinueReadingWidget';
import { ReaderModeModal } from '../widgets/ReaderModeModal';

interface EstudosViewProps {
  readings: ReadingItem[];
  flashcards: Flashcard[];
  sessions: StudySession[];
  courses: Course[];
  initialSubTab?: SubTabEstudos;
  onAddSession: (session: StudySession) => void;
  onUpdateReadingPages: (readingId: string, newPages: number) => void;
  onOpenQuickAdd: () => void;
}

export const EstudosView: React.FC<EstudosViewProps> = ({
  readings,
  flashcards,
  sessions,
  courses,
  initialSubTab = 'sessoes',
  onAddSession,
  onUpdateReadingPages,
  onOpenQuickAdd,
}) => {
  const [subTab, setSubTab] = useState<SubTabEstudos>(initialSubTab);
  const [readerModalReading, setReaderModalReading] = useState<ReadingItem | null>(null);

  // Timer state
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Flashcard state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      alert('✨ Parabéns Ceci! Sessão de estudos concluída com sucesso! ♡');
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = (mins: number = 25) => {
    setIsRunning(false);
    setTimerMinutes(mins);
    setTimeLeft(mins * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeCard = flashcards[currentCardIndex] || flashcards[0];

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-5 pb-16 animate-in fade-in duration-300">
      
      {/* Top Header Label & Title */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div>
          <p className="text-xs text-[#6D6366] font-medium lowercase tracking-wide">estudos</p>
          <h1 className="font-display text-2xl sm:text-3xl text-[#40383A] font-bold mt-0.5 tracking-tight">
            seu study corner
          </h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#FFF5F7] border border-[#FFD3DD]" />
      </div>

      {/* Hero Card: Hoje dá para estudar com carinho */}
      <div className="rounded-[24px] p-6 bg-[#FFF5F7] border border-[#FFD3DD] shadow-[0_2px_8px_rgba(64,56,58,0.05)] relative overflow-hidden space-y-4">
        <div>
          <span className="text-xs text-[#B94862] font-semibold tracking-wide lowercase">
            hoje dá para estudar com carinho
          </span>
          <p className="text-xs text-[#6D6366] mt-1.5 leading-relaxed">
            tudo aqui nasce das suas aulas: revisão, leitura e questões já chegam conectadas.
          </p>
        </div>

        {/* Micro Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs bg-[#FFF8F1] text-[#756354] px-3.5 py-1 rounded-full font-medium border border-[#FFF1E5]">
            1 revisão pronta
          </span>
          <span className="text-xs bg-white text-[#B94862] px-3.5 py-1 rounded-full font-medium border border-[#FFD3DD]">
            12 flashcards
          </span>
          <span className="text-xs bg-[#F3F9FC] text-[#396D82] px-3.5 py-1 rounded-full font-medium border border-[#CEE7F0]">
            leitura curta
          </span>
        </div>

        {/* Stat Boxes Row (3 White Boxes) */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-3 bg-white rounded-2xl border border-[#FFD3DD] text-center">
            <p className="font-display font-bold text-xs sm:text-sm text-[#40383A]">25 min</p>
            <p className="text-[10px] text-[#6D6366] mt-0.5">de foco</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-[#FFD3DD] text-center">
            <p className="font-display font-bold text-xs sm:text-sm text-[#40383A]">08 cartões</p>
            <p className="text-[10px] text-[#6D6366] mt-0.5">hoje</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-[#FFD3DD] text-center">
            <p className="font-display font-bold text-xs sm:text-sm text-[#40383A]">02 leituras</p>
            <p className="text-[10px] text-[#6D6366] mt-0.5">abertas</p>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => setSubTab('sessoes')}
          className="w-full bg-[#E97891] hover:bg-[#D85F79] text-white py-3 rounded-2xl text-xs sm:text-sm font-semibold shadow-xs transition-transform active:scale-[0.99] flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          <span>começar estudo leve</span>
        </button>
      </div>

      {/* Sub-Tabs Pill Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'sessoes', label: 'sessões de foco', icon: Clock },
          { id: 'leituras', label: 'minhas leituras', icon: BookOpen },
          { id: 'flashcards', label: 'flashcards', icon: Brain },
          { id: 'questoes', label: 'questões práticas', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = subTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as SubTabEstudos)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSel
                  ? 'bg-[#40383A] text-white shadow-xs'
                  : 'bg-white text-[#6D6366] border border-[#E9DFDC] hover:bg-[#FAF8F5]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Card 2: Seu fluxo de estudo */}
      <div className="rounded-[24px] p-6 bg-white border border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)] space-y-3">
        <span className="text-xs text-[#918689] font-semibold tracking-wide lowercase">continuar de onde você parou</span>
        
        <h2 className="font-display text-lg sm:text-xl font-bold text-[#40383A]">
          seu fluxo de estudo
        </h2>
        
        <p className="text-xs text-[#6D6366]">
          mais bonitinho, mais pessoal, sem perder a clareza.
        </p>

        <div className="space-y-3 pt-2">
          {/* Flow Item 1: Rose Tint */}
          <div
            onClick={() => setSubTab('flashcards')}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF5F7] border border-[#FFD3DD] hover:border-[#FFB8C7] cursor-pointer transition-all"
          >
            <div>
              <h3 className="font-semibold text-xs text-[#40383A]">Flashcards de pensamentos automáticos</h3>
              <p className="text-[11px] text-[#6D6366] mt-0.5">Psicopatologia · gerados da Aula 08</p>
            </div>
            <span className="text-xs font-semibold text-[#B94862] bg-white px-3 py-1.5 rounded-full border border-[#FFD3DD] shrink-0">
              8 cartões →
            </span>
          </div>

          {/* Flow Item 2: Blue Tint */}
          <div
            onClick={() => setSubTab('leituras')}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#F3F9FC] border border-[#CEE7F0] hover:border-[#A4D4E3] cursor-pointer transition-all"
          >
            <div>
              <h3 className="font-semibold text-xs text-[#40383A]">Leitura do capítulo 4 com marcações</h3>
              <p className="text-[11px] text-[#6D6366] mt-0.5">Teorias da personalidade · 2 notas salvas</p>
            </div>
            <span className="text-xs font-semibold text-[#396D82] bg-white px-3 py-1.5 rounded-full border border-[#CEE7F0] shrink-0">
              ler 15 min →
            </span>
          </div>

          {/* Flow Item 3: Beige Tint */}
          <div
            onClick={() => setSubTab('questoes')}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF8F1] border border-[#FFF1E5] hover:border-[#FFE2CC] cursor-pointer transition-all"
          >
            <div>
              <h3 className="font-semibold text-xs text-[#40383A]">Questões para revisão da semana</h3>
              <p className="text-[11px] text-[#6D6366] mt-0.5">Social + Psicopatologia</p>
            </div>
            <span className="text-xs font-semibold text-[#756354] bg-white px-3 py-1.5 rounded-full border border-[#FFF1E5] shrink-0">
              5 questões →
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Um plano fofinho e realista */}
      <div className="rounded-[24px] p-6 bg-[#FFF5F7] border border-[#FFD3DD] shadow-[0_2px_8px_rgba(64,56,58,0.05)] space-y-3">
        <span className="text-xs text-[#B94862] font-semibold tracking-wide lowercase">sessão sugerida</span>
        
        <h2 className="font-display text-lg sm:text-xl font-bold text-[#40383A]">
          um plano fofinho e realista
        </h2>
        
        <p className="text-xs text-[#6D6366]">
          nada rígido: só uma ordem boa para o seu cérebro entrar no ritmo.
        </p>

        {/* 3 Step White Boxes */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-3 bg-white rounded-2xl border border-[#FFD3DD] text-center">
            <span className="w-5 h-5 rounded-full bg-[#FFF5F7] text-[#B94862] font-bold text-[10px] inline-flex items-center justify-center mb-1">
              1
            </span>
            <p className="text-xs font-semibold text-[#40383A]">revisão</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-[#FFD3DD] text-center">
            <span className="w-5 h-5 rounded-full bg-[#F3F9FC] text-[#396D82] font-bold text-[10px] inline-flex items-center justify-center mb-1">
              2
            </span>
            <p className="text-xs font-semibold text-[#40383A]">leitura</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-[#FFD3DD] text-center">
            <span className="w-5 h-5 rounded-full bg-[#FFF8F1] text-[#756354] font-bold text-[10px] inline-flex items-center justify-center mb-1">
              3
            </span>
            <p className="text-xs font-semibold text-[#40383A]">questões</p>
          </div>
        </div>

        {/* Dica Box */}
        <div className="p-3.5 bg-white rounded-2xl border border-[#FFD3DD]">
          <p className="text-xs text-[#6D6366] leading-relaxed">
            <strong className="text-[#B94862]">dica da ceci:</strong> começa pelos cartões rápidos. quando você sentir que entrou no clima, abre a leitura principal.
          </p>
        </div>

        {/* Footer Pills */}
        <div className="flex items-center justify-between text-xs text-[#B94862] pt-1">
          <span className="bg-white/80 px-2.5 py-0.5 rounded-full border border-[#FFD3DD]">sticker em progresso</span>
          <span className="font-semibold">3 dias seguidos ✨</span>
        </div>
      </div>

      {/* Card 4: Seu ritmo - Constante e bonito */}
      <div className="rounded-[24px] p-6 bg-[#FAF8F5] border border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)] flex items-center justify-between">
        <div>
          <span className="text-xs text-[#918689] font-semibold tracking-wide lowercase">seu ritmo</span>
          <h2 className="font-display text-lg font-bold text-[#40383A] mt-0.5">
            constante e bonito
          </h2>
        </div>

        {/* 3 Pastel Dots */}
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-white border border-[#E9DFDC] shadow-2xs" />
          <span className="w-8 h-8 rounded-full bg-[#FFF5F7] border border-[#FFD3DD] shadow-2xs" />
          <span className="w-8 h-8 rounded-full bg-[#F3F9FC] border border-[#CEE7F0] shadow-2xs" />
        </div>
      </div>

      {/* TIMER MODAL / INTERACTIVE DRAWER */}
      {subTab === 'sessoes' && (
        <div className="rounded-[24px] p-6 bg-white border border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)] text-center space-y-4">
          <h2 className="font-display text-xl font-bold text-[#40383A]">
            cantinho de foco ceci
          </h2>

          <div className="relative w-48 h-48 mx-auto rounded-full border-4 border-[#FFD3DD] bg-[#FFF5F7] flex flex-col items-center justify-center shadow-inner">
            <span className="font-display font-bold text-4xl text-[#40383A]">
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs text-[#6D6366] mt-1">
              {isRunning ? '✨ em andamento...' : 'pausado'}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={toggleTimer}
              className="flex items-center gap-2 bg-[#E97891] hover:bg-[#D85F79] text-white px-6 py-2.5 rounded-full text-xs font-semibold shadow-xs cursor-pointer"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isRunning ? 'pausar' : 'iniciar'}</span>
            </button>

            <button
              onClick={() => resetTimer(25)}
              className="p-2.5 rounded-full bg-[#FAF8F5] border border-[#E9DFDC] text-[#40383A] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FLASHCARD MODAL / VIEW */}
      {subTab === 'flashcards' && activeCard && (
        <div className="rounded-[24px] p-6 bg-white border border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)] text-center space-y-4">
          <span className="text-xs text-[#918689]">
            card {currentCardIndex + 1} de {flashcards.length}
          </span>

          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[180px] p-6 rounded-2xl bg-[#FFF5F7] border border-[#FFD3DD] flex flex-col items-center justify-center cursor-pointer"
          >
            <span className="text-xs font-semibold text-[#B94862] mb-2">
              {isFlipped ? 'resposta ✨' : 'pergunta ❓'}
            </span>
            <p className="font-display font-bold text-base text-[#40383A]">
              {isFlipped ? activeCard.answer : activeCard.question}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
              }}
              className="px-4 py-2 bg-[#FAF8F5] border border-[#E9DFDC] rounded-xl text-xs font-medium text-[#40383A] cursor-pointer"
            >
              ← anterior
            </button>

            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentCardIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
              }}
              className="px-4 py-2 bg-[#E97891] hover:bg-[#D85F79] text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              próximo →
            </button>
          </div>
        </div>
      )}

      {/* Reader Mode Modal */}
      <ReaderModeModal
        isOpen={!!readerModalReading}
        onClose={() => setReaderModalReading(null)}
        reading={readerModalReading}
      />

    </div>
  );
};
