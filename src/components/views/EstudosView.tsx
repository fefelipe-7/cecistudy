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
      
      {/* Top Header Label & Title (Exact Image 2) */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div>
          <p className="text-xs text-[#82787A] font-medium uppercase tracking-wide">Estudos</p>
          <h1 className="font-serif-display text-2xl sm:text-3xl text-[#40383A] font-bold mt-0.5 tracking-tight">
            Seu study corner
          </h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#FFE7ED] border border-[#FFD1DC]" />
      </div>

      {/* Hero Card: Hoje dá para estudar com carinho (Exact Image 2) */}
      <div className="rounded-[28px] p-6 bg-[#FFE7ED] border border-[#FFD1DC] shadow-sm relative overflow-hidden space-y-4">
        <div>
          <span className="text-xs text-[#A64B62] font-semibold tracking-wide uppercase">
            Hoje dá para estudar com carinho
          </span>
          <p className="text-xs text-[#6F6568] mt-1.5 leading-relaxed">
            Tudo aqui nasce das suas aulas: revisão, leitura e questões já chegam conectadas.
          </p>
        </div>

        {/* Micro Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs bg-[#FFF2E5] text-[#8C522B] px-3.5 py-1 rounded-full font-medium border border-[#F2D7C2]">
            1 revisão pronta
          </span>
          <span className="text-xs bg-white text-[#B94763] px-3.5 py-1 rounded-full font-medium border border-[#FFD1DC]">
            12 flashcards
          </span>
          <span className="text-xs bg-[#E4F1F8] text-[#32677F] px-3.5 py-1 rounded-full font-medium border border-[#CDE6F2]">
            Leitura curta
          </span>
        </div>

        {/* Stat Boxes Row (3 White Boxes) */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-3 bg-white rounded-2xl border border-[#FFD1DC] text-center">
            <p className="font-serif-display font-bold text-xs sm:text-sm text-[#40383A]">25 min</p>
            <p className="text-[10px] text-[#6F6568] mt-0.5">de foco</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-[#FFD1DC] text-center">
            <p className="font-serif-display font-bold text-xs sm:text-sm text-[#40383A]">08 cartões</p>
            <p className="text-[10px] text-[#6F6568] mt-0.5">hoje</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-[#FFD1DC] text-center">
            <p className="font-serif-display font-bold text-xs sm:text-sm text-[#40383A]">02 leituras</p>
            <p className="text-[10px] text-[#6F6568] mt-0.5">abertas</p>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => setSubTab('sessoes')}
          className="w-full bg-[#EA718F] hover:bg-[#D85B78] text-white py-3 rounded-2xl text-xs sm:text-sm font-semibold shadow-xs transition-transform active:scale-[0.99] flex items-center justify-center gap-2 min-h-[44px]"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          <span>Começar estudo leve</span>
        </button>
      </div>

      {/* Sub-Tabs Pill Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'sessoes', label: 'Sessões de Foco', icon: Clock },
          { id: 'leituras', label: 'Minhas Leituras', icon: BookOpen },
          { id: 'flashcards', label: 'Flashcards', icon: Brain },
          { id: 'questoes', label: 'Questões Práticas', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = subTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as SubTabEstudos)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isSel
                  ? 'bg-[#40383A] text-white shadow-xs'
                  : 'bg-white text-[#6F6568] border border-[#E8DEDB] hover:bg-[#FAF7F2]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Card 2: Seu fluxo de estudo (Exact Image 2) */}
      <div className="rounded-[28px] p-6 bg-white border border-[#E8DEDB] shadow-sm space-y-3">
        <span className="text-xs text-[#82787A] font-semibold tracking-wide uppercase">Continuar de onde você parou</span>
        
        <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#40383A]">
          Seu fluxo de estudo
        </h2>
        
        <p className="text-xs text-[#6F6568]">
          Mais bonitinho, mais pessoal, sem perder a clareza.
        </p>

        <div className="space-y-3 pt-2">
          {/* Flow Item 1: Pink Tint */}
          <div
            onClick={() => setSubTab('flashcards')}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#FFE7ED] border border-[#FFD1DC] hover:border-[#EA718F] cursor-pointer transition-all"
          >
            <div>
              <h3 className="font-semibold text-xs text-[#40383A]">Flashcards de pensamentos automáticos</h3>
              <p className="text-[11px] text-[#6F6568] mt-0.5">Psicopatologia · gerados da Aula 08</p>
            </div>
            <span className="text-xs font-semibold text-[#B94763] bg-white px-3 py-1.5 rounded-full border border-[#FFD1DC] shrink-0">
              8 cartões →
            </span>
          </div>

          {/* Flow Item 2: Blue Tint */}
          <div
            onClick={() => setSubTab('leituras')}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#E4F1F8] border border-[#CDE6F2] hover:border-[#32677F] cursor-pointer transition-all"
          >
            <div>
              <h3 className="font-semibold text-xs text-[#40383A]">Leitura do capítulo 4 com marcações</h3>
              <p className="text-[11px] text-[#6F6568] mt-0.5">Teorias da personalidade · 2 notas salvas</p>
            </div>
            <span className="text-xs font-semibold text-[#32677F] bg-white px-3 py-1.5 rounded-full border border-[#CDE6F2] shrink-0">
              Ler 15 min →
            </span>
          </div>

          {/* Flow Item 3: Beige Tint */}
          <div
            onClick={() => setSubTab('questoes')}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF2E5] border border-[#F2D7C2] hover:border-[#8C522B] cursor-pointer transition-all"
          >
            <div>
              <h3 className="font-semibold text-xs text-[#40383A]">Questões para revisão da semana</h3>
              <p className="text-[11px] text-[#6F6568] mt-0.5">Social + Psicopatologia</p>
            </div>
            <span className="text-xs font-semibold text-[#8C522B] bg-white px-3 py-1.5 rounded-full border border-[#F2D7C2] shrink-0">
              5 questões →
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Um plano fofinho e realista (Exact Image 2) */}
      <div className="rounded-[28px] p-6 bg-[#FFE7ED] border border-[#FFD1DC] shadow-sm space-y-3">
        <span className="text-xs text-[#A64B62] font-semibold tracking-wide uppercase">Sessão sugerida</span>
        
        <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#40383A]">
          Um plano fofinho e realista
        </h2>
        
        <p className="text-xs text-[#6F6568]">
          Nada rígido: só uma ordem boa para o seu cérebro entrar no ritmo.
        </p>

        {/* 3 Step White Boxes */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-3 bg-white rounded-2xl border border-[#FFD1DC] text-center">
            <span className="w-5 h-5 rounded-full bg-[#FFE7ED] text-[#B94763] font-bold text-[10px] inline-flex items-center justify-center mb-1">
              1
            </span>
            <p className="text-xs font-semibold text-[#40383A]">revisão</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-[#FFD1DC] text-center">
            <span className="w-5 h-5 rounded-full bg-[#E4F1F8] text-[#32677F] font-bold text-[10px] inline-flex items-center justify-center mb-1">
              2
            </span>
            <p className="text-xs font-semibold text-[#40383A]">leitura</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-[#FFD1DC] text-center">
            <span className="w-5 h-5 rounded-full bg-[#FFF2E5] text-[#8C522B] font-bold text-[10px] inline-flex items-center justify-center mb-1">
              3
            </span>
            <p className="text-xs font-semibold text-[#40383A]">questões</p>
          </div>
        </div>

        {/* Dica Box */}
        <div className="p-3.5 bg-white rounded-2xl border border-[#FFD1DC]">
          <p className="text-xs text-[#6F6568] leading-relaxed">
            <strong className="text-[#B94763]">Dica da Ceci:</strong> Começa pelos cartões rápidos. Quando você sentir que entrou no clima, abre a leitura principal.
          </p>
        </div>

        {/* Footer Pills */}
        <div className="flex items-center justify-between text-xs text-[#A64B62] pt-1">
          <span className="bg-white/80 px-2.5 py-0.5 rounded-full border border-[#FFD1DC]">sticker em progresso</span>
          <span className="font-semibold">3 dias seguidos ✨</span>
        </div>
      </div>

      {/* Card 4: Seu ritmo - Constante e bonito (Exact Image 2) */}
      <div className="rounded-[28px] p-6 bg-[#FAF5EF] border border-[#E8DEDB] shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs text-[#82787A] font-semibold tracking-wide uppercase">Seu ritmo</span>
          <h2 className="font-serif-display text-lg font-bold text-[#40383A] mt-0.5">
            Constante e bonito
          </h2>
        </div>

        {/* 3 Pastel Dots */}
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-white border border-[#E8DEDB] shadow-2xs" />
          <span className="w-8 h-8 rounded-full bg-[#FFE7ED] border border-[#FFD1DC] shadow-2xs" />
          <span className="w-8 h-8 rounded-full bg-[#E4F1F8] border border-[#CDE6F2] shadow-2xs" />
        </div>
      </div>

      {/* TIMER MODAL / INTERACTIVE DRAWER */}
      {subTab === 'sessoes' && (
        <div className="rounded-[28px] p-6 bg-white border border-[#E8DEDB] shadow-sm text-center space-y-4">
          <h2 className="font-serif-display text-xl font-bold text-[#40383A]">
            Cantinho de Foco Ceci
          </h2>

          <div className="relative w-48 h-48 mx-auto rounded-full border-4 border-[#FFD1DC] bg-[#FFE7ED]/30 flex flex-col items-center justify-center shadow-inner">
            <span className="font-serif-display font-bold text-4xl text-[#40383A]">
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs text-[#6F6568] mt-1">
              {isRunning ? '✨ Em andamento...' : 'Pausado'}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={toggleTimer}
              className="flex items-center gap-2 bg-[#EA718F] hover:bg-[#D85B78] text-white px-6 py-2.5 rounded-full text-xs font-semibold shadow-xs"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isRunning ? 'Pausar' : 'Iniciar'}</span>
            </button>

            <button
              onClick={() => resetTimer(25)}
              className="p-2.5 rounded-full bg-[#FAF5EF] border border-[#E8DEDB] text-[#40383A]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FLASHCARD MODAL / VIEW */}
      {subTab === 'flashcards' && activeCard && (
        <div className="rounded-[28px] p-6 bg-white border border-[#E8DEDB] shadow-sm text-center space-y-4">
          <span className="text-xs text-[#82787A]">
            Card {currentCardIndex + 1} de {flashcards.length}
          </span>

          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[180px] p-6 rounded-2xl bg-[#FFE7ED] border border-[#FFD1DC] flex flex-col items-center justify-center cursor-pointer"
          >
            <span className="text-xs font-semibold text-[#B94763] mb-2">
              {isFlipped ? 'RESPOSTA ✨' : 'PERGUNTA ❓'}
            </span>
            <p className="font-serif-display font-bold text-base text-[#40383A]">
              {isFlipped ? activeCard.answer : activeCard.question}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
              }}
              className="px-4 py-2 bg-[#FAF5EF] border border-[#E8DEDB] rounded-xl text-xs font-medium text-[#40383A]"
            >
              ← Anterior
            </button>

            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentCardIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
              }}
              className="px-4 py-2 bg-[#EA718F] text-white rounded-xl text-xs font-medium"
            >
              Próximo →
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
