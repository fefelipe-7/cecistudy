import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  BookOpen,
  HelpCircle,
  Sparkles,
  Plus,
  ChevronRight,
  Flame,
  Clock,
  Activity,
  GraduationCap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isDueToday, intervalFor } from '../../lib/review';
import { toDateKey, type WeekDayStatus } from '../../lib/streak';
import { pickTip } from '../../lib/tips';
import { Mascote } from '../ui/Mascote';
import { SectionTitle } from '../ui/SectionTitle';

/** Bolinha de um dia na linha do ritmo semanal (mesmo padrão da HomeView). */
const WEEK_CELL_STYLE: Record<WeekDayStatus, string> = {
  done: 'bg-rose-500 text-white border-rose-500',
  today: 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand ring-2 ring-rose-300/50',
  upcoming: 'bg-white text-ceci-muted border-ceci-border-default',
  weekend: 'bg-surface-muted text-ceci-faded border-ceci-border-subtle',
};

export const EstudosView: React.FC = () => {
  const {
    flashcards,
    readings,
    sessions,
    tcc,
    courses,
    questions,
    streakStats,
    currentWeekProgress,
    openStudy,
    openQuizCategory,
    openTccScreen,
    openWizard,
  } = useApp();

  // ---- dados reais derivados do estado ----
  const dueCards = useMemo(() => flashcards.filter(isDueToday), [flashcards]);
  const nextDueCard = dueCards[0];
  const nextDueCourse = courses.find((c) => c.id === nextDueCard?.courseId);

  const todayKey = toDateKey(new Date());
  const todayFocusMinutes = sessions
    .filter((s) => s.date === todayKey)
    .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const weekAgoKey = toDateKey(new Date(Date.now() - 7 * 86400000));
  const weekFocusMinutes = sessions
    .filter((s) => s.date > weekAgoKey)
    .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  const readingInProgress = readings.find((r) => r.status === 'lendo');
  const readingPct = readingInProgress?.totalPages
    ? Math.round(((readingInProgress.readPages || 0) / readingInProgress.totalPages) * 100)
    : 0;

  // TCC: progresso de capítulos concluídos
  const tccChapters = tcc.chapters ?? [];
  const tccDone = tccChapters.filter((c) => c.completed).length;
  const tccPct = tccChapters.length > 0 ? Math.round((tccDone / tccChapters.length) * 100) : 0;

  const daySummary = [
    todayFocusMinutes > 0 ? `${todayFocusMinutes} min de foco` : null,
    dueCards.length > 0
      ? `${dueCards.length} ${dueCards.length === 1 ? 'cartão' : 'cartões'} pra revisar`
      : null,
  ].filter(Boolean);

  // Dica contextual do cecinho (derivada do estado real do dia)
  const cecinhoTip = useMemo(
    () =>
      pickTip({
        dueCards: dueCards.length,
        readingInProgress: !!readingInProgress,
        focusMinutesToday: todayFocusMinutes,
        streakDays: streakStats.current,
      }),
    [dueCards.length, readingInProgress, todayFocusMinutes, streakStats.current]
  );

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-6 pb-1">
      {/* ================================================================ */}
      {/* 1. HERO — study corner + resumo real do dia                       */}
      {/* ================================================================ */}
      <section className="rounded-[26px] bg-gradient-to-br from-white to-surface-rose border border-ceci-border-subtle shadow-sm p-5 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-ceci-secondary font-medium lowercase tracking-wide">estudos</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-ceci-primary mt-0.5 tracking-tight font-display">
              seu study corner
            </h1>
          </div>
          <span className="flex items-center gap-1 bg-white/80 px-3 py-1.5 rounded-full border border-ceci-border-brand shrink-0">
            <Flame className={`w-4 h-4 ${streakStats.alive ? 'fill-rose-500 text-rose-500' : 'text-ceci-muted'}`} />
            <span className="text-xs font-bold text-ceci-brand-strong">
              {streakStats.current} {streakStats.current === 1 ? 'dia' : 'dias'}
            </span>
          </span>
        </div>
        <p className="text-xs sm:text-[13px] text-ceci-secondary leading-relaxed mt-2.5 max-w-[92%]">
          {daySummary.length > 0 ? (
            <>hoje: {daySummary.join(' · ')}. bora continuar? ♡</>
          ) : (
            <>nada pendente por aqui hoje — dia perfeito pra uma sessão de foco leve ♡</>
          )}
        </p>
        <Mascote
          expression="focus-ready"
          className="w-16 h-16 absolute -bottom-2 -right-2 opacity-95 pointer-events-none"
          decorative
        />
      </section>

      {/* Desktop (≥ lg): grade 12 colunas — esquerda: agora/leitura · direita: ritmo/portais/dica */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">

      {/* coluna esquerda */}
      <div className="lg:col-span-7 space-y-6">

      {/* ================================================================ */}
      {/* 2. PRA AGORA — foco + revisão                                     */}
      {/* ================================================================ */}
      <section className="space-y-3 px-0.5">
        <SectionTitle icon={<Clock className="w-4 h-4 text-ceci-brand-strong" />}>
          pra agora
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 pt-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => openStudy('focus')}
            className="bg-ceci-primary hover:bg-ceci-ink text-white rounded-[24px] p-5 text-left tap-interactive cursor-pointer space-y-2 shadow-sm min-h-[110px]"
          >
            <Brain className="w-6 h-6 text-rose-200" />
            <p className="text-base font-bold font-display">bora focar?</p>
            <p className="text-[11px] text-white/70">
              {weekFocusMinutes > 0
                ? `${weekFocusMinutes} min nesta semana`
                : 'timer em tela cheia, sem distrações'}
            </p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => openStudy('revisar')}
            className="bg-white hover:border-ceci-border-brand rounded-[24px] p-5 text-left border border-ceci-border-default tap-interactive cursor-pointer space-y-2 shadow-sm min-h-[110px]"
          >
            <Sparkles className="w-6 h-6 text-ceci-brand-strong" />
            <div className="flex items-center gap-2">
              <p className="text-base font-bold font-display text-ceci-primary">revisar</p>
              {dueCards.length > 0 && (
                <span className="text-[10px] font-bold text-ceci-brand-strong bg-surface-rose px-2 py-0.5 rounded-full border border-ceci-border-brand">
                  {dueCards.length}
                </span>
              )}
            </div>
            <p className="text-[11px] text-ceci-secondary truncate">
              {nextDueCard
                ? `${nextDueCourse?.name ?? 'geral'} · volta em ${intervalFor(nextDueCard.timesReviewed)}d`
                : dueCards.length === 0 && flashcards.length > 0
                  ? 'cartões em dia ♡'
                  : 'crie seu primeiro cartão'}
            </p>
          </motion.button>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 3. LEITURA EM ANDAMENTO — card real com progresso                 */}
      {/* ================================================================ */}
      <section className="space-y-3 px-0.5">
        <SectionTitle icon={<BookOpen className="w-4 h-4 text-ceci-academic-strong" />}>
          leitura
        </SectionTitle>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => openStudy('leituras')}
          className={`w-full rounded-[24px] p-5 border shadow-sm cursor-pointer text-left space-y-3 tap-interactive ${
            readingInProgress
              ? 'bg-white border-ceci-border-default hover:border-ceci-border-academic'
              : 'bg-surface-subtle border-dashed border-ceci-border-default hover:border-ceci-border-academic'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-2xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-ceci-academic-strong" />
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-ceci-primary leading-snug line-clamp-1">
                  {readingInProgress ? readingInProgress.title : 'nenhuma leitura em andamento'}
                </h3>
                <p className="text-[11px] text-ceci-secondary mt-0.5 truncate">
                  {readingInProgress
                    ? `${readingInProgress.author} · ${readingInProgress.readPages || 0} de ${readingInProgress.totalPages} páginas`
                    : 'que tal começar um livro ou artigo?'}
                </p>
              </div>
            </div>
            {readingInProgress && (
              <span className="text-xs font-bold text-ceci-academic-strong shrink-0">{readingPct}%</span>
            )}
          </div>
          {readingInProgress?.totalPages ? (
            <div className="w-full h-2 bg-surface-muted border border-ceci-border-subtle rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-ceci-brand to-ceci-brand-strong rounded-full transition-all"
                style={{ width: `${readingPct}%` }}
              />
            </div>
          ) : null}
        </motion.button>
      </section>

      </div>

      {/* coluna direita */}
      <div className="lg:col-span-5 space-y-6">

      {/* ================================================================ */}
      {/* 4. SEU RITMO — semana visual → abre o histórico                   */}
      {/* ================================================================ */}
      <section className="px-0.5 pt-5 lg:pt-0">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => openStudy('historico')}
          aria-label="ver seu histórico e estatísticas de estudo"
          className="w-full bg-white rounded-[22px] p-5 border border-ceci-border-default hover:border-ceci-border-brand shadow-sm cursor-pointer space-y-4 tap-interactive text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500" />
              <h2 className="text-xs font-bold text-ceci-primary font-display uppercase tracking-wider">
                seu ritmo
              </h2>
            </div>
            <span className="text-[11px] text-ceci-secondary flex items-center gap-1">
              recorde: {streakStats.longest > 0 ? streakStats.longest : '—'}
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex items-center justify-between gap-1.5">
            {currentWeekProgress.map((cell) => (
              <div key={cell.dateKey} className="flex flex-col items-center gap-1 flex-1">
                <span
                  className={`w-full max-w-[34px] aspect-square rounded-xl border flex items-center justify-center text-[11px] font-bold ${WEEK_CELL_STYLE[cell.status]}`}
                >
                  {cell.active ? '✓' : cell.label.slice(0, 1).toUpperCase()}
                </span>
                <span className={`text-[10px] font-semibold ${
                  cell.status === 'today' ? 'text-ceci-brand-strong' : 'text-ceci-muted'
                }`}>
                  {cell.label.slice(0, 3)}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-ceci-secondary flex items-center gap-1.5 border-t border-ceci-border-subtle pt-3.5 -mb-0.5">
            <Flame className={`w-4 h-4 shrink-0 ${streakStats.alive ? 'fill-rose-500 text-rose-500' : 'text-ceci-muted'}`} />
            <span>
              sequência de {streakStats.current} {streakStats.current === 1 ? 'dia' : 'dias'}
              {streakStats.alive ? ' — bora manter! 🔥' : ' — hoje é um bom dia para recomeçar ♡'}
            </span>
          </p>
        </motion.button>
      </section>

      {/* ================================================================ */}
      {/* 5. PORTAIS SECUNDÁRIOS — quiz + tcc                               */}
      {/* ================================================================ */}
      <section className="space-y-3 px-0.5 lg:pt-0 pt-5">
        <SectionTitle icon={<HelpCircle className="w-4 h-4 text-ceci-academic-strong" />}>
          treinar & concluir
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 pt-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => openQuizCategory()}
            className="bg-surface-subtle hover:border-ceci-border-academic rounded-[24px] p-4 text-left border border-ceci-border-subtle tap-interactive cursor-pointer space-y-1.5 min-h-[96px]"
          >
            <HelpCircle className="w-5 h-5 text-ceci-academic-strong" />
            <p className="text-sm font-bold font-display text-ceci-primary">quiz de questões</p>
            <p className="text-[11px] text-ceci-secondary">{questions.length} questões no acervo</p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={openTccScreen}
            className="bg-surface-subtle hover:border-ceci-border-brand rounded-[24px] p-4 text-left border border-ceci-border-subtle tap-interactive cursor-pointer space-y-1.5 min-h-[96px]"
          >
            <GraduationCap className="w-5 h-5 text-ceci-brand-strong" />
            <p className="text-sm font-bold font-display text-ceci-primary">meu tcc</p>
            <p className="text-[11px] text-ceci-secondary">{tccPct}% dos capítulos</p>
          </motion.button>
        </div>

        <button
          onClick={() => openWizard('flashcard')}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold text-ceci-brand-strong bg-white border border-dashed border-ceci-border-default hover:border-ceci-border-brand cursor-pointer"
        >
          <Plus className="w-4 h-4" /> novo flashcard
        </button>
      </section>

      {/* ================================================================ */}
      {/* 6. DICA DO CECINHO                                                */}
      {/* ================================================================ */}
      <div className="p-4 rounded-[22px] bg-white border border-ceci-border-subtle shadow-sm flex items-center gap-3 px-0.5 lg:px-4">
        <Mascote expression="celebrate-small" className="w-12 h-12 shrink-0 ml-0.5 lg:ml-0" decorative />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-ceci-primary font-display">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span>dica do cecinho ✨</span>
          </div>
          <p className="text-xs text-ceci-secondary leading-relaxed mt-0.5">
            {cecinhoTip}
          </p>
        </div>
      </div>

      </div>
      </div>
    </div>
  );
};

export default EstudosView;
