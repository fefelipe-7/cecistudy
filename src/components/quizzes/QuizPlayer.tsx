import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Trophy, CheckCircle2, X, Target, RotateCcw, Clock, Brain, BarChart2 } from 'lucide-react';
import { Kitty } from '../ui/Kitty';
import { QuizExplanationOverlay } from './QuizExplanationOverlay';
import { cn } from '../../lib/utils';
import type { StudyQuestion, QuizConfig, QuizAnswer, QuizPlayState } from '../../types';

interface QuizPlayerProps {
  state: QuizPlayState;
  onAnswer: (answer: QuizAnswer) => void;
  onAdvance: () => void;
  onFinish: (answers: QuizAnswer[], config: QuizConfig, startTime: number, correctCount: number, totalCount: number) => void;
  onClose: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  state,
  onAnswer,
  onAdvance,
  onFinish,
  onClose,
}) => {
  const { pool, config, currentIdx, questionStartTime } = state;
  const current = pool[currentIdx];
  const progress = pool.length > 0 ? ((currentIdx + 1) / pool.length) * 100 : 0;
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [questionTimeMs, setQuestionTimeMs] = useState(0);

  // Timer da questão atual
  useEffect(() => {
    const interval = setInterval(() => {
      setQuestionTimeMs(Date.now() - questionStartTime);
    }, 100);
    return () => clearInterval(interval);
  }, [questionStartTime]);

  // Reset quando muda de questão
  useEffect(() => {
    setShowExplanation(false);
    setSelectedOption(null);
    setQuestionTimeMs(0);
  }, [currentIdx]);

  const opts = current?.options ?? [];
  const correctLetter = current?.gabarito ?? 'A';
  const correctText = opts[correctLetter.charCodeAt(0) - 65] ?? current?.answer ?? '';

  const handleOptionClick = useCallback((letter: string) => {
    if (selectedOption) return;
    const isCorrect = letter === correctLetter;
    const timeMs = Date.now() - questionStartTime;

    setSelectedOption(letter);
    onAnswer({
      questionId: current.id,
      userAnswer: letter,
      correct: isCorrect,
      timeMs,
      question: current,
    });

    // Mostra explicação após seleção
    setTimeout(() => setShowExplanation(true), 300);
  }, [current, correctLetter, onAnswer, questionStartTime]);

const handleNext = useCallback(() => {
  if (currentIdx + 1 < pool.length) {
    // Avança para próxima questão
    onAdvance();
  } else {
    // Finaliza quiz
    const answers = state.answers;
    const correctCount = answers.filter((a) => a.correct).length;
    onFinish(answers, config, state.startTime, correctCount, pool.length);
  }
}, [currentIdx, pool.length, onAdvance, onFinish]);

  // Para controle do parent - expõe callbacks
  // O parent passa o state completo, então usamos callbacks
  // A navegação é controlada pelo parent via openQuizPlay/openQuizResult

  if (!current) return null;

  return (
    <div className="min-h-[70vh] flex flex-col animate-in fade-in duration-300 pb-44">
      {/* Header com progresso */}
      <div className="sticky top-0 z-10 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-3 bg-canvas/95 backdrop-blur-md border-b border-ceci-border-subtle">
        <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white border border-ceci-border-default hover:bg-surface-rose flex items-center justify-center text-ceci-primary shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="sair do quiz"
            aria-label="sair do quiz"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 bg-surface-blue border-ceci-border-academic text-ceci-academic-strong">
              <Target className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-sm text-ceci-primary truncate leading-tight">quiz</h1>
              <p className="text-[11px] text-ceci-secondary truncate">
                questão {currentIdx + 1} de {pool.length}
              </p>
            </div>
          </div>

          <span className="w-9 h-9 shrink-0 flex items-center justify-end">
            <span className="text-xs font-semibold text-ceci-primary px-2 py-0.5 rounded-full bg-surface-blue">
              {Math.round(progress)}%
            </span>
          </span>
        </div>

        {/* Barra de progresso linear */}
        <div className="max-w-md sm:max-w-xl mx-auto mt-3 h-1.5 rounded-full bg-ceci-border-subtle overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-ceci-brand-strong"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>

      {/* Corpo - área da questão/explicação */}
      <div className="flex-1 pt-4 overflow-y-auto">
        <div className="max-w-md sm:max-w-xl mx-auto px-3.5 sm:px-5">
          <AnimatePresence mode="wait" custom={showExplanation ? 1 : -1}>
            {/* Tela da Pergunta */}
            <motion.div
              key="question"
              custom={showExplanation ? 1 : -1}
              variants={{
                initial: (dir: number) => ({ x: dir * 40, opacity: 0 }),
                animate: { x: 0, opacity: 1, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
                exit: (dir: number) => ({ x: -dir * 40, opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }),
              }}
            >
              <div className="rounded-[20px] p-5 bg-white border border-ceci-border-default shadow-sm space-y-4">
                {/* Timer da questão */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-ceci-secondary flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {(questionTimeMs / 1000).toFixed(1)}s
                  </span>
                  <span className="font-semibold text-ceci-primary">
                    {currentIdx + 1} / {pool.length}
                  </span>
                </div>

                {/* Pergunta */}
                <h2 className="font-display font-bold text-base text-ceci-primary leading-relaxed">
                  {current.question}
                </h2>

                {/* Alternativas */}
                <div className="space-y-2 pt-2">
                  {opts.map((opt, i) => {
                    const letter = OPTION_LETTERS[i];
                    const isCorrect = letter === correctLetter;
                    const isSelected = selectedOption === letter;
                    return (
                      <button
                        key={letter}
                        onClick={() => handleOptionClick(letter)}
                        disabled={!!selectedOption}
                        className={cn(
                          'w-full text-left p-4 rounded-xl border-2 transition-all text-sm',
                          isSelected
                            ? isCorrect
                              ? 'bg-green-50 border-green-300 text-green-800'
                              : 'bg-red-50 border-red-300 text-red-800'
                            : 'bg-white border-ceci-border-default hover:bg-surface-rose hover:border-ceci-border-brand active:scale-[0.99]'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'w-8 h-8 rounded-full border flex items-center justify-center font-bold flex-shrink-0',
                            isSelected
                              ? isCorrect
                                ? 'bg-green-400 border-green-400 text-white'
                                : 'bg-red-400 border-red-400 text-white'
                              : 'border-ceci-border-default text-ceci-secondary bg-white'
                          )}>
                            {letter}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isSelected && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500" />
                          )}
                          {isSelected && !isCorrect && (
                            <X className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Barra de progresso visual */}
              <div className="mt-4 h-1.5 rounded-full bg-ceci-border-subtle overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-ceci-brand-strong"
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            </motion.div>

            {/* Tela da Explicação (overlay que substitui a pergunta) */}
            <motion.div
              key="explanation"
              variants={{
                initial: { opacity: 0, scale: 0.95, y: 20 },
                animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
                exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
              }}
            >
              <QuizExplanationOverlay
                explanation={current.explanation ?? 'sem explicação disponível'}
                isCorrect={selectedOption === correctLetter}
                onClose={handleNext}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer sticky - botão próxima (quando não há explicação) */}
      {!showExplanation && selectedOption && (
        <div className="fixed bottom-0 inset-x-0 z-10 bg-canvas/95 backdrop-blur-md border-t border-ceci-border-subtle shadow-[0_-8px_24px_rgba(64,56,58,0.06)]">
          <div className="max-w-md sm:max-w-xl mx-auto px-3.5 sm:px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-semibold text-white bg-[#E97891] hover:bg-[#D85F79] cursor-pointer active:scale-[0.98]"
            >
              {currentIdx + 1 < pool.length ? (
                <>
                  <ChevronRight className="w-4 h-4" /> próxima
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4" /> ver resultado
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};