import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  BookOpen,
  HelpCircle,
  History,
  Sparkles,
  Plus,
  ChevronRight,
  Flame,
  Target,
  Timer,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

/** Intervalo de revisão (dias) por nº de revisões — repetição espaçada simples. */
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const intervalFor = (timesReviewed = 0) =>
  REVIEW_INTERVALS[Math.min(timesReviewed, REVIEW_INTERVALS.length - 1)];
const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const toISODate = (d: Date) => d.toISOString().split('T')[0];

const isDueToday = (card: { lastReviewed?: string; timesReviewed?: number }) =>
  !card.lastReviewed || daysSince(card.lastReviewed) >= intervalFor(card.timesReviewed);

/** Card de portal que empurra uma tela dedicada na pilha nativa. */
function PortalCard({
  icon,
  title,
  subtitle,
  bg,
  border,
  text,
  onClick,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  bg: string;
  border: string;
  text: string;
  onClick: () => void;
  badge?: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 p-4 rounded-[20px] ${bg} border ${border} cursor-pointer text-left`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-10 h-10 rounded-2xl bg-white border ${border} flex items-center justify-center shrink-0 ${text}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-xs text-ceci-primary truncate">{title}</h3>
          <p className="text-[11px] text-ceci-secondary mt-0.5 line-clamp-1">{subtitle}</p>
        </div>
      </div>
      <span className="flex items-center gap-1.5 shrink-0">
        {badge}
        <ChevronRight className={`w-4 h-4 ${text}`} />
      </span>
    </motion.button>
  );
}

/** Mini estatística (quadradinho branco) do feed. */
function StatPill({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div className="p-3 bg-white rounded-2xl border border-ceci-border-default text-center">
      <p className={`font-display font-bold text-sm sm:text-base text-ceci-primary ${accent ?? ''}`}>{value}</p>
      <p className="text-[10px] text-ceci-secondary mt-0.5">{label}</p>
    </div>
  );
}

/** Barra de semanas recentes (sparkline do feed). */
function WeekSparkline({ counts, max }: { counts: number[]; max: number }) {
  return (
    <div className="flex items-end justify-between gap-1.5 h-12">
      {counts.map((c, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[9px] text-ceci-muted leading-none">{c > 0 ? c : ''}</span>
          <div
            className="w-full rounded-full bg-gradient-to-t from-ceci-brand to-ceci-brand-strong"
            style={{ height: `${max > 0 ? Math.max(8, (c / max) * 100) : 8}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export const EstudosView: React.FC = () => {
  const {
    flashcards,
    readings,
    sessions,
    quizSessions,
    courses,
    questions,
    streakStats,
    currentWeekProgress,
    openStudy,
    openQuizCategory,
    openWizard,
  } = useApp();

  const courseName = (id?: string) => courses.find((c) => c.id === id)?.name || 'geral';

  // ---- Dados reais derivados do estado ----
  const dueCards = flashcards.filter(isDueToday);
  const inProgressReadings = readings.filter((r) => r.status === 'lendo');
  const doneReadings = readings.filter((r) => r.status === 'concluido');

  const weekAgoISO = toISODate(new Date(Date.now() - 7 * 86400000));
  const weekSessions = sessions.filter((s) => s.date >= weekAgoISO);
  const weekFocusMinutes = weekSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const focusDaysCount = new Set(weekSessions.map((s) => s.date)).size;

  const totalFocusMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalQuizCount = quizSessions.length;
  const avgQuizScore =
    quizSessions.length > 0
      ? Math.round(quizSessions.reduce((acc, q) => acc + q.scorePct, 0) / quizSessions.length)
      : 0;

  // Sparkline: minutos de foco por dia na semana corrente (seg–sex)
  const weekCells = currentWeekProgress.filter((d) => d.status !== 'weekend');
  const minutesByDate = new Map<string, number>();
  weekSessions.forEach((s) => minutesByDate.set(s.date, (minutesByDate.get(s.date) ?? 0) + (s.durationMinutes || 0)));
  const focusSpark = weekCells.map((c) => minutesByDate.get(c.dateKey) ?? 0);
  const focusSparkMax = Math.max(...focusSpark, 1);

  const weekStudyDays = currentWeekProgress.filter((d) => d.status !== 'weekend');
  const doneThisWeek = currentWeekProgress.filter((c) => c.status === 'done').length;
  const weekDaysTotal = weekStudyDays.length;

  // Sessão mais recente para o "onde seu tempo foi"
  const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const topCourseMinutes = new Map<string, number>();
  sessions.forEach((s) => {
    const key = s.courseId ?? 'geral';
    topCourseMinutes.set(key, (topCourseMinutes.get(key) ?? 0) + (s.durationMinutes || 0));
  });
  const topFocus = [...topCourseMinutes.entries()].sort((a, b) => b[1] - a[1])[0];

  const totalMinutesAll = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md sm:max-w-xl mx-auto space-y-4 pb-1"
    >
      {/* Top Header Label & Title */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div>
          <p className="text-xs text-ceci-secondary font-medium lowercase tracking-wide">estudos</p>
          <h1 className="font-display text-2xl sm:text-3xl text-ceci-primary font-bold mt-0.5 tracking-tight">
            seu study corner
          </h1>
        </div>
        <span className="w-8 h-8 rounded-full bg-surface-rose border border-ceci-border-brand flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-ceci-brand-strong" />
        </span>
      </div>

      {/* HERO: ofensiva + pulso semanal */}
      <div className="rounded-[24px] p-6 bg-surface-rose border border-ceci-border-brand shadow-sm relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-ceci-brand-strong font-semibold tracking-wide lowercase">
              sua ofensiva de estudos
            </span>
            <p className="text-xs text-ceci-secondary mt-1.5 leading-relaxed">
              tudo aqui nasce do que você anota: revisão, leitura e foco sempre conectados entre si ♡
            </p>
          </div>
          <span className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-ceci-border-brand shrink-0">
            <Flame className={`w-4 h-4 ${streakStats.alive ? 'fill-rose-500 text-rose-500' : 'text-ceci-muted'}`} />
            <span className="text-xs font-bold text-ceci-brand-strong">
              {streakStats.current} {streakStats.current === 1 ? 'dia' : 'dias'}
              {streakStats.alive ? ' 🔥' : ''}
            </span>
          </span>
        </div>

        {/* Pulso semanal (seg–sex) */}
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {weekStudyDays.map((item) => (
            <div
              key={item.dateKey}
              className={`p-2 rounded-[18px] border text-center flex flex-col items-center justify-between ${
                item.status === 'done'
                  ? 'bg-white border-ceci-border-brand'
                  : item.status === 'today'
                    ? 'bg-white border-rose-500 shadow-2xs'
                    : 'bg-surface-subtle border-ceci-border-subtle'
              }`}
            >
              <span className="text-[10px] font-medium lowercase text-ceci-secondary">{item.label}</span>
              <span
                className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  item.status === 'done'
                    ? 'bg-rose-500 text-white'
                    : item.status === 'today'
                      ? 'border border-rose-500 text-rose-500'
                      : 'bg-white border border-ceci-border-default text-ceci-tertiary'
                }`}
              >
                {item.status === 'done' ? '✓' : item.status === 'today' ? 'hoje' : '·'}
              </span>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-ceci-secondary">
          {doneThisWeek} de {weekDaysTotal} dias úteis com estudo nesta semana
          {streakStats.longest > 0 ? ` · recorde: ${streakStats.longest} dias` : ''}
        </div>
      </div>

      {/* Stat Pills */}
      <div className="grid grid-cols-3 gap-2">
        <StatPill value={`${weekFocusMinutes} min`} label="de foco na semana" />
        <StatPill value={`${dueCards.length}`} label="cartões hoje" />
        <StatPill value={`${inProgressReadings.length}`} label="leituras abertas" />
      </div>

      {/* PORTAL: sessão de foco */}
      <PortalCard
        icon={<Timer className="w-5 h-5" />}
        title="sessão de foco"
        subtitle="timer em tela cheia, sem distrações"
        bg="bg-surface-rose"
        border="border-ceci-border-brand"
        text="text-ceci-brand-strong"
        onClick={() => openStudy('focus')}
        badge={
          <span className="text-[10px] font-semibold text-white bg-ceci-brand px-2.5 py-1 rounded-full">
            bora focar
          </span>
        }
      />

      {/* STAT: onde seu tempo foi */}
      <div className="rounded-[20px] p-4 bg-white border border-ceci-border-default shadow-sm space-y-2">
        <p className="text-xs text-ceci-tertiary font-semibold tracking-wide lowercase">onde seu tempo foi</p>
        {topFocus ? (
          <div className="flex items-center justify-between">
            <p className="text-xs text-ceci-primary">
              <span className="font-semibold">{topFocus[0] === 'geral' ? 'geral' : courseName(topFocus[0])}</span>
              <span className="text-ceci-secondary"> · {topFocus[1]} min no total</span>
            </p>
            <span className="text-xs font-bold text-ceci-brand-strong bg-surface-rose px-2.5 py-1 rounded-full border border-ceci-border-brand">
              {totalMinutesAll} min
            </span>
          </div>
        ) : (
          <p className="text-xs text-ceci-secondary">
            seus primeiros focos ainda vão pintar aqui. que tal começar com 25 minutinhos? ♡
          </p>
        )}
      </div>

      {/* Criar flashcard (botão avulso) */}
      <button
        onClick={() => openWizard('flashcard')}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand cursor-pointer"
      >
        <Plus className="w-4 h-4" /> novo flashcard
      </button>

      {/* PORTAL: revisar */}
      <PortalCard
        icon={<Brain className="w-5 h-5" />}
        title="para revisar"
        subtitle={
          dueCards.length > 0
            ? `${dueCards.length} ${dueCards.length === 1 ? 'cartão' : 'cartões'} esperando por você`
            : 'tudo em dia por aqui, eita!'
        }
        bg="bg-surface-subtle"
        border="border-ceci-border-subtle"
        text="text-ceci-primary"
        onClick={() => openStudy('revisar')}
        badge={
          dueCards.length > 0 ? (
            <span className="text-[10px] font-bold text-ceci-primary bg-surface-rose px-2.5 py-1 rounded-full border border-ceci-border-brand">
              {dueCards.length}
            </span>
          ) : undefined
        }
      />

      {/* STAT: leituras */}
      <div className="rounded-[20px] p-4 bg-white border border-ceci-border-default shadow-sm space-y-2">
        <p className="text-xs text-ceci-tertiary font-semibold tracking-wide lowercase">leituras</p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-ceci-primary">
            <span className="font-semibold">{inProgressReadings.length} em andamento</span>
            {doneReadings.length > 0 && (
              <span className="text-ceci-secondary"> · {doneReadings.length} concluídas</span>
            )}
          </p>
          {inProgressReadings.length > 0 && (
            <span className="text-[10px] font-medium text-ceci-academic-strong bg-surface-blue px-2.5 py-1 rounded-full border border-ceci-border-academic">
              {inProgressReadings[0].title}
            </span>
          )}
        </div>
      </div>

      {/* PORTAL: leituras */}
      <PortalCard
        icon={<BookOpen className="w-5 h-5" />}
        title="leituras"
        subtitle={
          inProgressReadings[0]
            ? `continue "${inProgressReadings[0].title}"`
            : 'adicione um livro ou artigo pra começar'
        }
        bg="bg-surface-blue"
        border="border-ceci-border-academic"
        text="text-ceci-academic-strong"
        onClick={() => openStudy('leituras')}
      />

      {/* PORTAL: quizzes */}
      <PortalCard
        icon={<HelpCircle className="w-5 h-5" />}
        title="quiz de questões"
        subtitle={`${questions.length} questões no acervo, por área, tema e escola`}
        bg="bg-surface-rose"
        border="border-ceci-border-brand"
        text="text-ceci-brand-strong"
        onClick={() => openQuizCategory()}
        badge={
          <span className="text-[10px] font-semibold text-white bg-ceci-brand px-2.5 py-1 rounded-full">
            treinar
          </span>
        }
      />

      {/* STAT: sparkline de quizzes */}
      {quizSessions.length > 0 && (
        <div className="rounded-[20px] p-4 bg-white border border-ceci-border-default shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ceci-tertiary font-semibold tracking-wide lowercase">seus quizzes</p>
            <span className="text-xs font-bold text-ceci-academic-strong bg-surface-blue px-2.5 py-1 rounded-full border border-ceci-border-academic">
              média {avgQuizScore}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <WeekSparkline
                counts={quizSessions
                  .slice(-7)
                  .map((q) => q.scorePct)}
                max={100}
              />
            </div>
            <div className="text-right shrink-0">
              <p className="font-display font-bold text-lg text-ceci-primary">{totalQuizCount}</p>
              <p className="text-[10px] text-ceci-secondary">{totalQuizCount === 1 ? 'quiz feito' : 'quizzes feitos'}</p>
            </div>
          </div>
        </div>
      )}

      {/* PORTAL: histórico */}
      <PortalCard
        icon={<History className="w-5 h-5" />}
        title="histórico"
        subtitle="tudo que você já estudou por aqui"
        bg="bg-surface-subtle"
        border="border-ceci-border-subtle"
        text="text-ceci-primary"
        onClick={() => openStudy('historico')}
      />

      <div className="rounded-[20px] p-4 bg-surface-subtle border border-ceci-border-subtle flex items-center gap-3">
        <Target className="w-5 h-5 text-ceci-brand-strong shrink-0" />
        <p className="text-xs text-ceci-secondary leading-relaxed">
          dica da ceci: começa pelos cartões rápidos, depois uma leitura leve e termina com um quiz pra fixar ♡
        </p>
      </div>
    </motion.div>
  );
};