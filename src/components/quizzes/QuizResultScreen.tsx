import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, RotateCcw, Target, Trophy, BarChart2, Clock, Brain, ArrowLeft, ChevronRight } from 'lucide-react';
import { Kitty } from '../ui/Kitty';
import { cn } from '../../lib/utils';
import type { StudyQuestion, QuizConfig, QuizAnswer } from '../../types';

interface QuizResultScreenProps {
  answers: QuizAnswer[];
  config: QuizConfig;
  startTime: number;
  correctCount: number;
  totalCount: number;
  onSave: (sessionId: string) => void;
  onRetry: () => void;
  onNewQuiz: () => void;
  onClose: () => void;
}

function StatCard({ icon, label, value, color, bgColor }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-xl p-4 bg-white border border-ceci-border-default shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${bgColor}`}>
          {icon}
        </span>
        <span className="text-xs font-medium text-ceci-secondary">{label}</span>
      </div>
      <div className="font-display font-bold text-2xl" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function BarStat({ label, count, total, color, bgColor }: {
  label: string;
  count: number;
  total: number;
  color: string;
  bgColor: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ceci-secondary truncate pr-2">{label}</span>
        <span className="font-semibold" style={{ color }}>{count}/{total} ({Math.round(pct)}%)</span>
      </div>
      <div className="h-2 rounded-full bg-ceci-border-subtle overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
}

function SectionTitle({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-7 h-7 rounded-xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center text-ceci-academic-strong">
        {icon}
      </span>
      <h3 className="font-display font-bold text-sm text-ceci-primary">{title}</h3>
    </div>
  );
}

export const QuizResultScreen: React.FC<QuizResultScreenProps> = ({
  answers,
  config,
  startTime,
  correctCount,
  totalCount,
  onSave,
  onRetry,
  onNewQuiz,
  onClose,
}) => {
  const scorePct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const totalTimeMs = Date.now() - startTime;
  const totalTimeMin = Math.round(totalTimeMs / 60000) || 1;
  const avgTimePerQ = totalCount > 0 ? Math.round(totalTimeMs / totalCount / 1000) : 0;

  // Agrupamentos para estatísticas
  const statsByArea = useMemo(() => {
    const map = new Map<string, { correct: number; total: number }>();
    answers.forEach((a) => {
      const area = a.question.area ?? 'sem área';
      const entry = map.get(area) ?? { correct: 0, total: 0 };
      entry.total++;
      if (a.correct) entry.correct++;
      map.set(area, entry);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5);
  }, [answers]);

  const statsByDificuldade = useMemo(() => {
    const map = new Map<string, { correct: number; total: number }>();
    answers.forEach((a) => {
      const dif = a.question.dificuldade ?? 'basica';
      const entry = map.get(dif) ?? { correct: 0, total: 0 };
      entry.total++;
      if (a.correct) entry.correct++;
      map.set(dif, entry);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [answers]);

  const statsByEscola = useMemo(() => {
    const map = new Map<string, { correct: number; total: number }>();
    answers.forEach((a) => {
      const escola = a.question.escolaOuAbordagem ?? 'sem escola';
      const entry = map.get(escola) ?? { correct: 0, total: 0 };
      entry.total++;
      if (a.correct) entry.correct++;
      map.set(escola, entry);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5);
  }, [answers]);

  const kittyExpression = scorePct === 100 ? 'rindo' : scorePct >= 70 ? 'feliz' : scorePct >= 50 ? 'pensativa' : 'curiosa';

  return (
    <div className="min-h-[70vh] flex flex-col animate-in fade-in duration-300 pb-44">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-3 bg-canvas/95 backdrop-blur-md border-b border-ceci-border-subtle">
        <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white border border-ceci-border-default hover:bg-surface-rose flex items-center justify-center text-ceci-primary shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="voltar"
            aria-label="voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 bg-surface-rose border-ceci-border-brand text-ceci-brand-strong">
              <Trophy className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-sm text-ceci-primary truncate leading-tight">resultado do quiz</h1>
              <p className="text-[11px] text-ceci-secondary truncate">
                {correctCount} de {totalCount} • {scorePct}% de acerto
              </p>
            </div>
          </div>

          <span className="w-9 h-9 shrink-0" aria-hidden />
        </div>
      </div>

      {/* Corpo */}
      <div className="flex-1 pt-4 overflow-y-auto">
        <div className="max-w-md sm:max-w-xl mx-auto px-3.5 sm:px-5 space-y-6">
          {/* Hero card com score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-[24px] p-6 bg-white border border-ceci-border-default shadow-sm text-center space-y-4"
          >
            <Kitty expression={kittyExpression} className="w-20 h-20 mx-auto" decorative />
            <div>
              <h3 className="font-display font-bold text-xl text-ceci-primary">quiz finalizado ♡</h3>
              <p className="text-xs text-ceci-secondary mt-1">
                {totalCount} questões • {totalTimeMin} min {totalTimeMin > 1 ? 'minutos' : 'minuto'} total
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 text-3xl font-display font-bold">
              <span className="text-green-600">{correctCount}</span>
              <span className="text-ceci-muted">/</span>
              <span className="text-ceci-primary">{totalCount}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-bold ${
                scorePct === 100 ? 'bg-green-100 text-green-700' :
                scorePct >= 70 ? 'bg-blue-100 text-blue-700' :
                scorePct >= 50 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {scorePct}%
              </span>
            </div>
          </motion.div>

          {/* Grid de stats principais */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="grid grid-cols-2 gap-3"
          >
            <StatCard
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="acertos"
              value={correctCount}
              color="#16A34A"
              bgColor="bg-green-100 text-green-600"
            />
            <StatCard
              icon={<X className="w-4 h-4" />}
              label="erros"
              value={totalCount - correctCount}
              color="#DC2626"
              bgColor="bg-red-100 text-red-600"
            />
            <StatCard
              icon={<Clock className="w-4 h-4" />}
              label="tempo total"
              value={`${totalTimeMin} min`}
              color="#7C3AED"
              bgColor="bg-purple-100 text-purple-600"
            />
            <StatCard
              icon={<Brain className="w-4 h-4" />}
              label="méd/questão"
              value={`${avgTimePerQ}s`}
              color="#E97891"
              bgColor="bg-surface-rose text-ceci-brand-strong"
            />
          </motion.div>

          {/* Detalhamento por área */}
          {statsByArea.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="rounded-[20px] p-4 bg-white border border-ceci-border-default shadow-sm space-y-3"
            >
              <SectionTitle title="por área" icon={<BarChart2 className="w-4 h-4" />} />
              <div className="space-y-2">
                {statsByArea.map(([area, data]) => (
                  <BarStat
                    key={area}
                    label={area}
                    count={data.correct}
                    total={data.total}
                    color="#16A34A"
                    bgColor="bg-green-100"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Detalhamento por dificuldade */}
          {statsByDificuldade.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="rounded-[20px] p-4 bg-white border border-ceci-border-default shadow-sm space-y-3"
            >
              <SectionTitle title="por dificuldade" icon={<Target className="w-4 h-4" />} />
              <div className="space-y-2">
                {statsByDificuldade.map(([dif, data]) => (
                  <BarStat
                    key={dif}
                    label={dif.charAt(0).toUpperCase() + dif.slice(1)}
                    count={data.correct}
                    total={data.total}
                    color="#7C3AED"
                    bgColor="bg-purple-100"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Detalhamento por escola */}
          {statsByEscola.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="rounded-[20px] p-4 bg-white border border-ceci-border-default shadow-sm space-y-3"
            >
              <SectionTitle title="por escola/abordagem" icon={<Brain className="w-4 h-4" />} />
              <div className="space-y-2">
                {statsByEscola.map(([escola, data]) => (
                  <BarStat
                    key={escola}
                    label={escola}
                    count={data.correct}
                    total={data.total}
                    color="#E97891"
                    bgColor="bg-surface-rose"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Revisão detalhada (colapsável) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="rounded-[20px] p-4 bg-white border border-ceci-border-default shadow-sm space-y-3"
          >
            <SectionTitle title="revisão das respostas" icon={<RotateCcw className="w-4 h-4" />} />
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {answers.map((a, i) => {
                const isCorrect = a.correct;
                const userLetter = a.userAnswer;
                const correctLetter = a.question.gabarito ?? 'A';
                return (
                  <div
                    key={i}
                    className={cn(
                      'p-3 rounded-xl bg-surface-muted text-[11px] flex items-start gap-2',
                      isCorrect ? 'border-l-2 border-green-400' : 'border-l-2 border-red-400'
                    )}
                  >
                    <span className={cn(
                      'w-6 h-6 rounded-full border flex items-center justify-center font-bold flex-shrink-0',
                      isCorrect ? 'bg-green-100 border-green-300 text-green-700' : 'bg-red-100 border-red-300 text-red-700'
                    )}>
                      {userLetter}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ceci-primary truncate">{a.question.question}</p>
                      <p className="text-ceci-secondary">
                        sua: {userLetter} · correta: {correctLetter}
                        {a.explanation && ` • ${a.explanation.slice(0, 80)}...`}
                      </p>
                      <p className="text-[10px] text-ceci-tertiary mt-0.5">
                        {a.question.area} · {a.question.dificuldade} · {a.timeMs / 1000}s
                      </p>
                    </div>
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 fill-green-500 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer sticky - ações */}
      <div className="fixed bottom-0 inset-x-0 z-10 bg-canvas/95 backdrop-blur-md border-t border-ceci-border-subtle shadow-[0_-8px_24px_rgba(64,56,58,0.06)]">
        <div className="max-w-md sm:max-w-xl mx-auto px-3.5 sm:px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] space-y-2">
          <button
            onClick={() => {
              const sessionId = `qs-${Date.now()}`;
              onSave(sessionId);
            }}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-semibold text-white bg-[#E97891] hover:bg-[#D85F79] cursor-pointer active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" /> guardar sessão
          </button>
          <div className="flex gap-2">
            <button
              onClick={onRetry}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-semibold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand cursor-pointer active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" /> refazer mesmo
            </button>
            <button
              onClick={onNewQuiz}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-semibold text-ceci-academic-strong bg-[#F3F9FC] border border-ceci-border-academic cursor-pointer active:scale-[0.98]"
            >
              <Target className="w-4 h-4" /> novo quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};