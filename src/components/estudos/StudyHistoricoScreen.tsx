import React, { useMemo } from 'react';
import { Flame, ChevronRight, Play, Target, BookOpen, Timer, Activity } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { Mascote } from '../ui/Mascote';
import { ManageSurface } from '../ui/ManageSurface';
import { DitherGrowthChart } from '../ui/dither-growth';
import { DitherDonutChart } from '../ui/dither-donut';
import { RevenueLineChart } from '../ui/dither-revenue';
import { formatCount } from '../../lib/ditherChart';
import { isDarkTheme } from '../../lib/themes';

const toISODate = (d: Date) => d.toISOString().split('T')[0];
const formatPct = (n: number) => `${Math.round(n)}%`;
const formatShortDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).toLowerCase();
};

/** Tela dedicada de histórico — sessões de foco, quizzes e leituras concluídas. */
export const StudyHistoricoScreen: React.FC = () => {
  const { sessions, quizSessions, readings, courses, streakStats, openStudy, themePref } = useMobileApp();
  const appIsDark = isDarkTheme(themePref);

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

  const avgQuizScore =
    quizSessions.length > 0
      ? Math.round(quizSessions.reduce((acc, q) => acc + q.scorePct, 0) / quizSessions.length)
      : 0;

  // ---- média por área do quiz: as 3 com menor acerto ("pra revisar mais") ----
  const weakestAreas = useMemo(() => {
    const areaScores = new Map<string, number[]>();
    quizSessions.forEach((q) => {
      const areas = q.config.areas.length > 0 ? q.config.areas : ['todas'];
      areas.forEach((a) => {
        if (!areaScores.has(a)) areaScores.set(a, []);
        areaScores.get(a)!.push(q.scorePct);
      });
    });
    return [...areaScores.entries()]
      .map(([area, scores]) => ({
        area,
        avg: Math.round(scores.reduce((s, n) => s + n, 0) / scores.length),
      }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 3);
  }, [quizSessions]);

  // ---- "seu ritmo": minutos de foco por semana (últimas 8 semanas) ----
  const focusByWeek = Array.from({ length: 8 }, (_, i) => {
    const weeksAgo = 7 - i;
    const end = new Date();
    end.setDate(end.getDate() - weeksAgo * 7);
    const endISO = toISODate(end);
    const start = new Date();
    start.setDate(start.getDate() - (weeksAgo + 1) * 7);
    const startISO = toISODate(start);
    return sessions
      .filter((s) => s.date > startISO && s.date <= endISO)
      .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  });
  const weekLabels = Array.from({ length: 8 }, (_, i) => formatShortDate((7 - i) * 7));

  // ---- minutos de foco por dia (últimos 14 dias) ----
  const dayMinutes = Array.from({ length: 14 }, (_, i) => {
    const dayISO = toISODate(new Date(Date.now() - (13 - i) * 86400000));
    return sessions
      .filter((s) => s.date === dayISO)
      .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  });
  const dayLabels = Array.from({ length: 14 }, (_, i) => formatShortDate(13 - i));

  // ---- distribuição do tempo por disciplina ----
  const topCourseMinutes = new Map<string, number>();
  sessions.forEach((s) => {
    const key = s.courseId ?? 'geral';
    topCourseMinutes.set(key, (topCourseMinutes.get(key) ?? 0) + (s.durationMinutes || 0));
  });
  const courseMinutes = [...topCourseMinutes.entries()]
    .map(([courseId, mins]) => ({
      label: courseId === 'geral' ? 'geral' : courseName(courseId),
      value: mins,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const formatDate = (key: string) =>
    new Date(key + 'T00:00:00')
      .toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
      .toLowerCase();

  const hasAnything = sessions.length > 0 || quizSessions.length > 0 || doneReadings.length > 0;

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-2xl p-5 bg-surface-subtle border border-ceci-border-subtle shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-full bg-surface-default border border-ceci-border-default flex items-center justify-center">
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

        <div className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-full bg-surface-rose border border-ceci-border-brand flex items-center justify-center">
              <Flame className={`w-4 h-4 ${streakStats.alive ? 'fill-ceci-brand text-ceci-brand-strong' : 'text-ceci-muted'}`} />
            </span>
            <div>
              <p className="text-xs font-semibold text-ceci-primary">sua ofensiva</p>
              <p className="text-[11px] text-ceci-secondary">
                recorde: {streakStats.longest > 0 ? `${streakStats.longest} dias` : '—'}
              </p>
            </div>
          </div>
          <span className={`font-display font-bold text-lg ${streakStats.alive ? 'text-ceci-brand-strong' : 'text-ceci-muted'}`}>
            {streakStats.current} {streakStats.current === 1 ? 'dia' : 'dias'}
          </span>
        </div>
      </div>

      {!hasAnything ? (
        <div className="rounded-2xl p-6 bg-surface-default border border-ceci-border-default shadow-sm text-center space-y-3">
          <Mascote expression="pause-kind" className="w-14 h-14 mx-auto" decorative />
          <p className="text-xs text-ceci-secondary leading-relaxed">
            nenhuma sessão anotada ainda. quando você concluir seu primeiro foco, ela aparece aqui ♡
          </p>
          <button
            onClick={() => openStudy('focus')}
            className="mx-auto flex items-center gap-1.5 bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand px-5 py-2.5 rounded-full text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-ceci-on-brand" /> começar a estudar
          </button>
        </div>
      ) : (
        <>
          {/* Seu ritmo: minutos de foco por semana */}
          <DitherGrowthChart
            theme={appIsDark ? 'dark' : 'light'}
            data={focusByWeek}
            dates={weekLabels}
            title="minutos de foco"
            subtitle="por semana, nas últimas 8 semanas"
            unitLabel="min"
            icon={<Timer className="w-4 h-4" />}
          />

          {/* Minutos de foco por dia, últimos 14 dias */}
          <RevenueLineChart
            theme={appIsDark ? 'dark' : 'light'}
            data={dayMinutes}
            labels={dayLabels}
            title="foco no dia a dia"
            subtitle="minutos de foco nos últimos 14 dias"
            unitLabel="min"
            color="#4A879F"
            icon={<Activity className="w-4 h-4" />}
          />

          {/* Seu ritmo: distribuição do tempo por disciplina */}
          {courseMinutes.length > 0 && (
            <DitherDonutChart
              theme={appIsDark ? 'dark' : 'light'}
              data={courseMinutes}
              title="onde seu tempo foi"
              subtitle="minutos de foco por área"
              totalLabel="min no total"
              formatValue={(n) => `${formatCount(n)} min`}
              icon={<Timer className="w-4 h-4" />}
            />
          )}

          {/* Sessões de foco */}
          {sortedSessions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-ceci-tertiary font-semibold tracking-wide lowercase px-1 pt-1">sessões de foco</p>
              {sortedSessions.map((s) => (
                <ManageSurface
                  key={s.id}
                  kind="session"
                  id={s.id}
                  className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm flex items-center justify-between gap-3"
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
                </ManageSurface>
              ))}
            </div>
          )}

          {/* Quizzes */}
          {sortedQuizzes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 pt-1">
                <p className="text-xs text-ceci-tertiary font-semibold tracking-wide lowercase">quizzes</p>
                <span className="text-[11px] font-bold text-ceci-academic-strong bg-surface-blue px-2.5 py-1 rounded-full border border-ceci-border-academic">
                  média {avgQuizScore}%
                </span>
              </div>
              {sortedQuizzes.map((q) => (
                <ManageSurface
                  key={q.id}
                  kind="quizSession"
                  id={q.id}
                  className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm flex items-center justify-between gap-3"
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
                </ManageSurface>
              ))}
            </div>
          )}

          {/* Áreas com menor acerto no quiz */}
          {sortedQuizzes.length > 0 && weakestAreas.length > 0 && (
            <div className="rounded-2xl p-4 bg-surface-rose border border-ceci-border-brand shadow-sm space-y-2">
              <p className="text-xs font-semibold text-ceci-primary flex items-center gap-1.5">
                <Target className="w-4 h-4 text-ceci-brand-strong" /> pra revisar mais
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {weakestAreas.map(({ area, avg }) => (
                  <span
                    key={area}
                    className="text-[11px] font-semibold text-ceci-brand-strong bg-surface-default px-2.5 py-1 rounded-full border border-ceci-border-brand"
                  >
                    {area} · {avg}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Leituras concluídas */}
          {doneReadings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-ceci-tertiary font-semibold tracking-wide lowercase px-1 pt-1">leituras concluídas</p>
              {doneReadings.map((r) => (
                <ManageSurface
                  key={r.id}
                  kind="reading"
                  id={r.id}
                  className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm flex items-center justify-between gap-3"
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
                  <span className="text-xs font-semibold text-status-success-strong bg-status-success-surface px-3 py-1.5 rounded-full border border-status-success-border shrink-0">
                    concluída
                  </span>
                </ManageSurface>
              ))}
            </div>
          )}
        </>
      )}

      <button
        onClick={() => openStudy('focus')}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold text-ceci-on-brand bg-ceci-brand hover:bg-ceci-brand-strong cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" /> nova sessão de foco
      </button>
    </div>
  );
};