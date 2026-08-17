import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, ChevronRight, Play, Target, BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Kitty } from '../ui/Kitty';

const toISODate = (d: Date) => d.toISOString().split('T')[0];
const formatPct = (n: number) => `${Math.round(n)}%`;

/** Tela dedicada de histórico — sessões de foco, quizzes e leituras concluídas. */
export const StudyHistoricoScreen: React.FC = () => {
  const { sessions, quizSessions, readings, courses, openStudy } = useApp();

  const courseName = (id?: string) => courses.find((c) => c.id === id)?.name || 'geral';

  const weekAgoISO = toISODate(new Date(Date.now() - 7 * 86400000));
  const weekSessions = sessions.filter((s) => s.date >= weekAgoISO);
  const weekFocusMinutes = weekSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const focusDaysCount = new Set(weekSessions.map((s) => s.date)).size;

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date)),
    [sessions]
  );
  const sortedQuizzes = useMemo(
    () => [...quizSessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [quizSessions]
  );
  const doneReadings = readings.filter((r) => r.status === 'concluido');

  const formatDate = (key: string) =>
    new Date(key + 'T00:00:00')
      .toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
      .toLowerCase();

  const hasAnything = sessions.length > 0 || quizSessions.length > 0 || doneReadings.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md sm:max-w-xl mx-auto space-y-3"
    >
      <div className="rounded-[24px] p-5 bg-surface-subtle border border-ceci-border-subtle shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-full bg-white border border-ceci-border-default flex items-center justify-center">
            <Flame className="w-4 h-4 text-ceci-brand-strong fill-ceci-brand" />
          </span>
          <div>
            <p className="text-xs font-semibold text-ceci-primary">foco nesta semana</p>
            <p className="text-[11px] text-ceci-secondary">
              {focusDaysCount} {focusDaysCount === 1 ? 'dia' : 'dias'} · {weekSessions.length} {weekSessions.length === 1 ? 'sessão' : 'sessões'}
            </p>
          </div>
        </div>
        <span className="font-display font-bold text-lg text-ceci-primary">{weekFocusMinutes} min</span>
      </div>

      {!hasAnything ? (
        <div className="rounded-[24px] p-6 bg-white border border-ceci-border-default shadow-sm text-center space-y-3">
          <Kitty expression="sonolenta" className="w-14 h-14 mx-auto" decorative />
          <p className="text-xs text-ceci-secondary leading-relaxed">
            nenhuma sessão anotada ainda. quando você concluir seu primeiro foco, ela aparece aqui ♡
          </p>
          <button
            onClick={() => openStudy('focus')}
            className="mx-auto flex items-center gap-1.5 bg-ceci-brand hover:bg-ceci-brand-strong text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" /> começar a estudar
          </button>
        </div>
      ) : (
        <>
          {/* Sessões de foco */}
          {sortedSessions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-ceci-tertiary font-semibold tracking-wide lowercase px-1 pt-1">sessões de foco</p>
              {sortedSessions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold text-xs text-ceci-primary truncate">{s.topic}</h3>
                    <p className="text-[11px] text-ceci-secondary mt-1">
                      {courseName(s.courseId)} · {formatDate(s.date)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-ceci-brand-strong bg-surface-rose px-3 py-1.5 rounded-full border border-ceci-border-brand shrink-0">
                    {s.durationMinutes} min
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Quizzes */}
          {sortedQuizzes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-ceci-tertiary font-semibold tracking-wide lowercase px-1 pt-1">quizzes</p>
              {sortedQuizzes.map((q) => (
                <div
                  key={q.id}
                  className="rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4 text-ceci-brand-strong" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-xs text-ceci-primary truncate">
                        {q.correctCount} de {q.totalCount} acertos
                      </h3>
                      <p className="text-[11px] text-ceci-secondary mt-0.5">
                        {q.config.areas.join(', ') || 'todas as áreas'} · {formatDate(q.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-ceci-academic-strong bg-surface-blue px-3 py-1.5 rounded-full border border-ceci-border-academic shrink-0">
                    {formatPct(q.scorePct)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Leituras concluídas */}
          {doneReadings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-ceci-tertiary font-semibold tracking-wide lowercase px-1 pt-1">leituras concluídas</p>
              {doneReadings.map((r) => (
                <div
                  key={r.id}
                  className="rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-ceci-academic-strong" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-xs text-ceci-primary truncate">{r.title}</h3>
                      <p className="text-[11px] text-ceci-secondary mt-0.5">
                        {r.author} · {courseName(r.courseId)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 shrink-0">
                    concluída
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <button
        onClick={() => openStudy('focus')}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold text-white bg-ceci-brand hover:bg-ceci-brand-strong cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" /> nova sessão de foco
      </button>
    </motion.div>
  );
};