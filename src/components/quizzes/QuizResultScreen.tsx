import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, X, RotateCcw, Target, BarChart2, Clock, Brain } from 'lucide-react';
import { Mascote } from '../ui/Mascote';
import { FixedBottomBar } from '../ui/FixedBottomBar';
import { cn } from '../../lib/utils';
import { IOS_EASE_OUT } from '../../lib/motion';
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
}

function StatCard({ icon, label, value, colorClass, bgClass }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className="rounded-xl p-4 bg-surface-default border border-ceci-border-default shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${bgClass}`}>
          {icon}
        </span>
        <span className="text-xs font-medium text-ceci-secondary">{label}</span>
      </div>
      <div className={`font-display font-bold text-2xl ${colorClass}`}>
        {value}
      </div>
    </div>
  );
}

function BarStat({ label, count, total, colorClass, barClass }: {
  label: string;
  count: number;
  total: number;
  colorClass: string;
  barClass: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ceci-secondary truncate pr-2">{label}</span>
        <span className={`font-semibold ${colorClass}`}>{count}/{total} ({Math.round(pct)}%)</span>
      </div>
      <div className="h-2 rounded-full bg-ceci-border-subtle overflow-hidden">
        <motion.div
          className={`h-full w-full rounded-full ${barClass}`}
          style={{ originX: 0 }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: pct / 100 }}
          transition={{ duration: 0.5, delay: 0.1, ease: IOS_EASE_OUT }}
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

  const mascoteExpression = scorePct === 100 ? 'celebrate-small' : scorePct >= 70 ? 'correct-soft' : scorePct >= 50 ? 'review-card' : 'try-again';

  return (
    <div className="min-h-[70vh] flex flex-col pb-44">
      {/* Corpo */}
      <div className="flex-1 pt-4 overflow-y-auto">
        <div className="max-w-md sm:max-w-xl mx-auto px-3.5 sm:px-5 space-y-6">
          {/* Hero card com score */}
          <div
            className="rounded-2xl p-6 bg-surface-default border border-ceci-border-default shadow-sm text-center space-y-4"
          >
            <Mascote expression={mascoteExpression} className="w-20 h-20 mx-auto" decorative />
            <div>
              <h3 className="font-display font-bold text-xl text-ceci-primary">quiz finalizado ♡</h3>
              <p className="text-xs text-ceci-secondary mt-1">
                {totalCount} questões • {totalTimeMin} {totalTimeMin === 1 ? 'minuto' : 'minutos'} no total
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 text-3xl font-display font-bold">
              <span className="text-status-success">{correctCount}</span>
              <span className="text-ceci-muted">/</span>
              <span className="text-ceci-primary">{totalCount}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-bold ${
                scorePct === 100 ? 'bg-status-success-surface text-status-success-strong' :
                scorePct >= 70 ? 'bg-surface-blue text-ceci-academic-strong' :
                scorePct >= 50 ? 'bg-status-warning-surface text-status-warning-strong' :
                'bg-status-danger-surface text-status-danger-strong'
              }`}>
                {scorePct}%
              </span>
            </div>
          </div>

          {/* Grid de stats principais */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="acertos"
              value={correctCount}
              colorClass="text-status-success-strong"
              bgClass="bg-status-success-surface text-status-success"
            />
            <StatCard
              icon={<X className="w-4 h-4" />}
              label="erros"
              value={totalCount - correctCount}
              colorClass="text-status-danger-strong"
              bgClass="bg-status-danger-surface text-status-danger-strong"
            />
            <StatCard
              icon={<Clock className="w-4 h-4" />}
              label="tempo total"
              value={`${totalTimeMin} min`}
              colorClass="text-ceci-academic-strong"
              bgClass="bg-surface-blue text-ceci-academic"
            />
            <StatCard
              icon={<Brain className="w-4 h-4" />}
              label="méd/questão"
              value={`${avgTimePerQ}s`}
              colorClass="text-ceci-brand"
              bgClass="bg-surface-rose text-ceci-brand-strong"
            />
          </div>

          {/* Detalhamento por área */}
          {statsByArea.length > 0 && (
            <div className="rounded-xl p-4 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
              <SectionTitle title="por área" icon={<BarChart2 className="w-4 h-4" />} />
              <div className="space-y-2">
                {statsByArea.map(([area, data]) => (
                  <BarStat
                    key={area}
                    label={area}
                    count={data.correct}
                    total={data.total}
                    colorClass="text-status-success-strong"
                    barClass="bg-status-success"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Detalhamento por dificuldade */}
          {statsByDificuldade.length > 0 && (
            <div className="rounded-xl p-4 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
              <SectionTitle title="por dificuldade" icon={<Target className="w-4 h-4" />} />
              <div className="space-y-2">
                {statsByDificuldade.map(([dif, data]) => (
                  <BarStat
                    key={dif}
                    label={dif.charAt(0).toUpperCase() + dif.slice(1)}
                    count={data.correct}
                    total={data.total}
                    colorClass="text-ceci-academic-strong"
                    barClass="bg-ceci-academic-strong"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Detalhamento por escola */}
          {statsByEscola.length > 0 && (
            <div className="rounded-xl p-4 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
              <SectionTitle title="por escola/abordagem" icon={<Brain className="w-4 h-4" />} />
              <div className="space-y-2">
                {statsByEscola.map(([escola, data]) => (
                  <BarStat
                    key={escola}
                    label={escola}
                    count={data.correct}
                    total={data.total}
                    colorClass="text-ceci-brand"
                    barClass="bg-ceci-brand"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Revisão detalhada (colapsável) */}
          <div className="rounded-xl p-4 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
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
                      isCorrect ? 'border-l-2 border-status-success' : 'border-l-2 border-status-danger'
                    )}
                  >
                    <span className={cn(
                      'w-6 h-6 rounded-full border flex items-center justify-center font-bold flex-shrink-0',
                      isCorrect ? 'bg-status-success-surface border-status-success-border text-status-success-strong' : 'bg-status-danger-surface border-status-danger-border text-status-danger-strong'
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
                      <CheckCircle2 className="w-4 h-4 text-status-success fill-status-success flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-status-danger-strong flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer sticky - ações */}
      <FixedBottomBar>
        <div className="max-w-md sm:max-w-xl mx-auto px-3.5 sm:px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] space-y-2">
          <button
            onClick={() => {
              const sessionId = `qs-${Date.now()}`;
              onSave(sessionId);
            }}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-semibold text-ceci-on-brand bg-ceci-brand hover:bg-ceci-brand-strong cursor-pointer active:scale-[0.98]"
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
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-semibold text-ceci-academic-strong bg-surface-blue border border-ceci-border-academic cursor-pointer active:scale-[0.98]"
            >
              <Target className="w-4 h-4" /> novo quiz
            </button>
          </div>
        </div>
      </FixedBottomBar>
    </div>
  );
};