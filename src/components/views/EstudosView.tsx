import React, { useState, useEffect, useMemo } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import {
  Brain,
  Clock,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  X,
  Plus,
  Timer,
  History,
  ChevronRight,
  Flame,
  Target,
} from 'lucide-react';
import { Flashcard, ReadingItem, SubTabEstudos, StudyQuestion, Course, StudySession, QuizConfig, QuizAnswer, QuizSession } from '../../types';
import { ReaderModeModal } from '../widgets/ReaderModeModal';
import { UnderlineTabBar } from '../ui/UnderlineTabBar';
import { Kitty } from '../ui/Kitty';
import { useApp } from '../../context/AppContext';
import { hapticSuccess } from '../../lib/haptics';
import { celebrate } from '../../lib/celebrate';

/** Intervalo de revisão (dias) por nº de revisões — repetição espaçada simples. */
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const intervalFor = (timesReviewed = 0) =>
  REVIEW_INTERVALS[Math.min(timesReviewed, REVIEW_INTERVALS.length - 1)];

const toISODate = (d: Date) => d.toISOString().split('T')[0];
const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const isDueToday = (card: Flashcard) =>
  !card.lastReviewed || daysSince(card.lastReviewed) >= intervalFor(card.timesReviewed);

const READING_STATUS_LABEL: Record<ReadingItem['status'], string> = {
  nao_iniciado: 'não iniciado',
  lendo: 'lendo',
  concluido: 'concluído',
};

export const EstudosView: React.FC = () => {
  const {
    flashcards,
    readings,
    sessions,
    courses,
    subTabEstudos: subTab,
    setSubTabEstudos: setSubTab,
    showToast,
    handleAddSession,
    handleUpdateReadingPages,
    handleReviewFlashcard,
    openWizard,
    openQuizCategory,
    questions
  } = useApp();

  const courseName = (id?: string) => courses.find((c) => c.id === id)?.name || 'geral';

  // Stats reais derivados do estado
  const dueCards = flashcards.filter(isDueToday);
  const inProgressReadings = readings.filter((r) => r.status === 'lendo');
  const weekAgoISO = toISODate(new Date(Date.now() - 7 * 86400000));
  const weekSessions = sessions.filter((s) => s.date >= weekAgoISO);
  const weekFocusMinutes = weekSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const focusDaysCount = new Set(weekSessions.map((s) => s.date)).size;

  const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const lastSession = sortedSessions[0];
  const continueReading = inProgressReadings[0];

// Timer (sessão de foco)
  const PRESETS = [25, 45, 15];
  const [preset, setPreset] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionCourseId, setSessionCourseId] = useState('');
  const [showSaveSession, setShowSaveSession] = useState(false);

  // Revisão de flashcards (fila da sessão)
  const [reviewQueue, setReviewQueue] = useState<Flashcard[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const dragX = useMotionValue(0);
  const cardRotate = useTransform(dragX, [-140, 140], [-6, 6]);

  const [readerModalReading, setReaderModalReading] = useState<ReadingItem | null>(null);

  const activeCard = reviewQueue[queueIndex];

  // Monta a fila de revisão ao entrar na aba de flashcards
  useEffect(() => {
    if (subTab === 'flashcards') {
      const queue = flashcards.filter(isDueToday);
      setReviewQueue(queue);
      setQueueIndex(0);
      setIsFlipped(false);
      setReviewedCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(t);
    }
    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setShowSaveSession(true);
      celebrate('session-done');
      hapticSuccess();
    }
  }, [isRunning, timeLeft]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = (mins: number = 25) => {
    setIsRunning(false);
    setPreset(mins);
    setTimeLeft(mins * 60);
    setShowSaveSession(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const saveSession = () => {
    handleAddSession({
      id: 'ss-' + Date.now(),
      courseId: sessionCourseId || undefined,
      topic: sessionTopic.trim() || 'sessão de foco',
      date: toISODate(new Date()),
      durationMinutes: preset
    });
    hapticSuccess();
    showToast('sessão de estudo registrada com carinho ♡');
    setSessionTopic('');
    setShowSaveSession(false);
    resetTimer();
  };

  // Revisão de flashcards
  const handleReview = (correct: boolean) => {
    if (!activeCard) return;
    handleReviewFlashcard(activeCard.id, correct);
    setIsFlipped(false);
    dragX.set(0);
    setReviewedCount((c) => c + 1);
    const finished = queueIndex + 1 >= reviewQueue.length;
    setQueueIndex((i) => i + 1);
    if (finished) {
      celebrate('flashcards-done');
      hapticSuccess();
    }
  };

  const handleCardDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isFlipped) return;
    if (info.offset.x < -80 || info.velocity.x < -500) handleReview(true);
    else if (info.offset.x > 80 || info.velocity.x > 500) handleReview(false);
  };

  const buildReviewQueue = (cards: Flashcard[]) => {
    setReviewQueue(cards);
    setQueueIndex(0);
    setIsFlipped(false);
    dragX.set(0);
    setReviewedCount(0);
  };

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-5 pb-1">

      {/* Top Header Label & Title */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div>
          <p className="text-xs text-ceci-secondary font-medium lowercase tracking-wide">estudos</p>
          <h1 className="font-display text-2xl sm:text-3xl text-ceci-primary font-bold mt-0.5 tracking-tight">
            seu study corner
          </h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-rose border border-ceci-border-brand" />
      </div>

      {/* Hero Card: stats reais do dia */}
      <div className="rounded-[24px] p-6 bg-surface-rose border border-ceci-border-brand shadow-sm relative overflow-hidden space-y-4">
        <div>
          <span className="text-xs text-ceci-brand-strong font-semibold tracking-wide lowercase">
            hoje dá para estudar com carinho
          </span>
          <p className="text-xs text-ceci-secondary mt-1.5 leading-relaxed">
            tudo aqui nasce do que você anota: revisão, leitura e foco sempre conectados entre si ♡
          </p>
        </div>

        {/* Micro Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs bg-[#FFF8F1] text-[#756354] px-3.5 py-1 rounded-full font-medium border border-[#FFF1E5]">
            {focusDaysCount} {focusDaysCount === 1 ? 'dia' : 'dias'} com foco
          </span>
          <span className="text-xs bg-white text-ceci-brand-strong px-3.5 py-1 rounded-full font-medium border border-ceci-border-brand">
            {dueCards.length} {dueCards.length === 1 ? 'flashcard' : 'flashcards'} para revisar
          </span>
          <span className="text-xs bg-[#F3F9FC] text-ceci-academic-strong px-3.5 py-1 rounded-full font-medium border border-ceci-border-academic">
            {inProgressReadings.length} {inProgressReadings.length === 1 ? 'leitura' : 'leituras'} em andamento
          </span>
        </div>

        {/* Stat Boxes Row (3 White Boxes) */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-3 bg-white rounded-2xl border border-ceci-border-brand text-center">
            <p className="font-display font-bold text-xs sm:text-sm text-ceci-primary">{weekFocusMinutes} min</p>
            <p className="text-[10px] text-ceci-secondary mt-0.5">de foco na semana</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-ceci-border-brand text-center">
            <p className="font-display font-bold text-xs sm:text-sm text-ceci-primary">{dueCards.length}</p>
            <p className="text-[10px] text-ceci-secondary mt-0.5">cartões hoje</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-ceci-border-brand text-center">
            <p className="font-display font-bold text-xs sm:text-sm text-ceci-primary">{inProgressReadings.length}</p>
            <p className="text-[10px] text-ceci-secondary mt-0.5">leituras abertas</p>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => setSubTab('sessoes')}
          className="w-full bg-[#E97891] hover:bg-[#D85F79] text-white py-3 rounded-2xl text-xs sm:text-sm font-semibold shadow-xs transition-transform active:scale-[0.99] flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          <span>começar sessão de foco</span>
        </button>
      </div>

      {/* Continuar de onde você parou (real, derivado do estado) */}
      <div className="rounded-[24px] p-6 bg-white border border-ceci-border-default shadow-sm space-y-3">
        <span className="text-xs text-ceci-tertiary font-semibold tracking-wide lowercase">continuar de onde você parou</span>

        <div className="space-y-3 pt-1">
          {lastSession && (
            <div
              onClick={() => setSubTab('historico')}
              className="flex items-center justify-between p-4 rounded-2xl bg-surface-rose border border-ceci-border-brand hover:border-rose-300 cursor-pointer tap-interactive"
            >
              <div className="min-w-0 pr-2">
                <h3 className="font-semibold text-xs text-ceci-primary truncate">última sessão: {lastSession.topic}</h3>
                <p className="text-[11px] text-ceci-secondary mt-0.5">
                  {courseName(lastSession.courseId)} · {lastSession.durationMinutes} min de foco
                </p>
              </div>
              <span className="text-xs font-semibold text-ceci-brand-strong bg-white px-3 py-1.5 rounded-full border border-ceci-border-brand shrink-0">
                histórico →
              </span>
            </div>
          )}

          {dueCards.length > 0 && (
            <div
              onClick={() => setSubTab('flashcards')}
              className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF8F1] border border-[#FFF1E5] hover:border-[#FFE2CC] cursor-pointer tap-interactive"
            >
              <div className="min-w-0 pr-2">
                <h3 className="font-semibold text-xs text-ceci-primary truncate">
                  {dueCards.length} {dueCards.length === 1 ? 'flashcard' : 'flashcards'} para revisar
                </h3>
                <p className="text-[11px] text-ceci-secondary mt-0.5 truncate">
                  começa por: {dueCards[0]?.question}
                </p>
              </div>
              <span className="text-xs font-semibold text-[#756354] bg-white px-3 py-1.5 rounded-full border border-[#FFF1E5] shrink-0">
                revisar →
              </span>
            </div>
          )}

          {continueReading && (
            <div
              onClick={() => setSubTab('leituras')}
              className="flex items-center justify-between p-4 rounded-2xl bg-[#F3F9FC] border border-ceci-border-academic hover:border-[#A4D4E3] cursor-pointer tap-interactive"
            >
              <div className="min-w-0 pr-2">
                <h3 className="font-semibold text-xs text-ceci-primary truncate">{continueReading.title}</h3>
                <p className="text-[11px] text-ceci-secondary mt-0.5">
                  {continueReading.author} ·{' '}
                  {continueReading.totalPages
                    ? `${Math.round(((continueReading.readPages || 0) / continueReading.totalPages) * 100)}% lido`
                    : 'em andamento'}
                </p>
              </div>
              <span className="text-xs font-semibold text-ceci-academic-strong bg-white px-3 py-1.5 rounded-full border border-ceci-border-academic shrink-0">
                ler →
              </span>
            </div>
          )}

          {!lastSession && dueCards.length === 0 && !continueReading && (
            <div className="p-4 rounded-2xl bg-surface-subtle border border-ceci-border-subtle text-center space-y-2">
              <Kitty expression="sonolenta" className="w-14 h-14 mx-auto" decorative />
              <p className="text-xs text-ceci-secondary leading-relaxed">
                ainda não há nada em andamento por aqui. registre seus flashcards ou leituras para o cantinho montar seu fluxo ♡
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => openWizard('flashcard')}
                  className="text-xs font-semibold text-ceci-brand-strong bg-white px-3 py-1.5 rounded-full border border-ceci-border-brand cursor-pointer"
                >
                  + flashcard
                </button>
                <button
                  onClick={() => openWizard('reading')}
                  className="text-xs font-semibold text-ceci-academic-strong bg-white px-3 py-1.5 rounded-full border border-ceci-border-academic cursor-pointer"
                >
                  + leitura
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Tabs Pill Navigation */}
      <UnderlineTabBar
        tabs={[
          { id: 'sessoes', label: 'sessão de foco', icon: <Clock className="w-3.5 h-3.5" /> },
          { id: 'flashcards', label: 'revisar', icon: <Brain className="w-3.5 h-3.5" /> },
          { id: 'leituras', label: 'leituras', icon: <BookOpen className="w-3.5 h-3.5" /> },
          { id: 'questoes', label: 'questões', icon: <HelpCircle className="w-3.5 h-3.5" /> },
          { id: 'historico', label: 'histórico', icon: <History className="w-3.5 h-3.5" /> },
        ]}
        active={subTab}
        onChange={(id) => setSubTab(id as SubTabEstudos)}
      />

      {/* SESSÃO DE FOCO (timer) */}
      {subTab === 'sessoes' && (
        <div className="rounded-[24px] p-6 bg-white border border-ceci-border-default shadow-sm text-center space-y-4">
          <h2 className="font-display text-xl font-bold text-ceci-primary">cantinho de foco ceci</h2>

          {/* Presets */}
          <div className="flex items-center justify-center gap-2">
            {PRESETS.map((mins) => (
              <button
                key={mins}
                onClick={() => resetTimer(mins)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tap-interactive cursor-pointer border ${
                  preset === mins
                    ? 'bg-ceci-primary text-white border-ceci-primary shadow-xs'
                    : 'bg-white text-ceci-secondary border-ceci-border-default hover:bg-surface-muted'
                }`}
              >
                {mins} min
              </button>
            ))}
          </div>

          <div className="relative w-48 h-48 mx-auto rounded-full border-4 border-ceci-border-brand bg-surface-rose flex flex-col items-center justify-center shadow-inner">
            <span className="font-display font-bold text-4xl text-ceci-primary">{formatTime(timeLeft)}</span>
            <span className="text-xs text-ceci-secondary mt-1">
              {isRunning ? '✨ em andamento...' : timeLeft === 0 ? 'finalizada!' : 'pronto para começar'}
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
              onClick={() => resetTimer(preset)}
              className="p-2.5 rounded-full bg-surface-muted border border-ceci-border-default text-ceci-primary cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Registro da sessão concluída */}
          {showSaveSession && (
            <div className="p-4 rounded-2xl bg-surface-subtle border border-ceci-border-subtle text-left space-y-3">
              <p className="text-xs font-semibold text-ceci-primary flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-[#E97891]" /> guardar sessão de {preset} min?
              </p>
              <div>
                <label className="block text-xs font-medium text-ceci-secondary mb-1">o que você estudou?</label>
                <input
                  type="text"
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                  placeholder="ex: revisar semiologia dos transtornos do humor"
                  className="w-full bg-white border border-ceci-border-default rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E97891]/30 focus:border-[#E97891]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ceci-secondary mb-1">disciplina</label>
                <select
                  value={sessionCourseId}
                  onChange={(e) => setSessionCourseId(e.target.value)}
                  className="w-full bg-white border border-ceci-border-default rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#E97891]/30 focus:border-[#E97891]"
                >
                  <option value="">geral</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
</select>
               </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => resetTimer()}
                  className="px-4 py-2 rounded-xl text-xs text-ceci-secondary hover:bg-white transition-colors cursor-pointer"
                >
                  descartar
                </button>
                <button
                  onClick={saveSession}
                  className="flex items-center gap-1.5 bg-[#E97891] hover:bg-[#B94862] text-white px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>guardar sessão</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REVISÃO DE FLASHCARDS */}
      {subTab === 'flashcards' && (
        <div className="space-y-4">
          <div className="rounded-[24px] p-6 bg-white border border-ceci-border-default shadow-sm text-center space-y-4">
            {reviewQueue.length === 0 && reviewedCount === 0 ? (
              <div className="py-6 space-y-3">
                <Kitty expression="rindo" className="w-14 h-14 mx-auto" decorative />
                <div>
                  <h3 className="font-display font-bold text-base text-ceci-primary">tudo em dia por aqui!</h3>
                  <p className="text-xs text-ceci-secondary mt-1.5 leading-relaxed">
                    nenhum flashcard precisa de revisão agora. pode dar uma volta ou revisar todos de novo.
                  </p>
                </div>
                {flashcards.length > 0 && (
                  <button
                    onClick={() => buildReviewQueue(flashcards)}
                    className="mx-auto bg-ceci-primary hover:bg-[#282022] text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    revisar todos ({flashcards.length})
                  </button>
                )}
              </div>
            ) : queueIndex >= reviewQueue.length ? (
              <div className="py-6 space-y-3">
                <Kitty expression="rindo" className="w-14 h-14 mx-auto" decorative />
                <div>
                  <h3 className="font-display font-bold text-base text-ceci-primary">revisão concluída, parabéns Ceci! ♡</h3>
                  <p className="text-xs text-ceci-secondary mt-1.5">
                    você revisou {reviewedCount} {reviewedCount === 1 ? 'cartão' : 'cartões'} hoje.
                  </p>
                </div>
                <button
                  onClick={() => buildReviewQueue([])}
                  className="mx-auto bg-ceci-primary hover:bg-[#282022] text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xs cursor-pointer"
                >
                  fechar revisão
                </button>
              </div>
            ) : activeCard ? (
              <>
                <span className="text-xs text-ceci-tertiary">
                  card {queueIndex + 1} de {reviewQueue.length}
                </span>

                <motion.div
                  key={activeCard.id}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.6}
                  onDragEnd={handleCardDragEnd}
                  style={{ x: dragX, rotate: cardRotate }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="min-h-[180px] p-6 rounded-2xl bg-surface-rose border border-ceci-border-brand flex flex-col items-center justify-center cursor-pointer touch-pan-y"
                >
                  <span className="text-xs font-semibold text-ceci-brand-strong mb-2 select-none">
                    {isFlipped ? 'resposta ✨' : 'pergunta ❓'}
                  </span>
                  <p className="font-display font-bold text-base text-ceci-primary select-none">
                    {isFlipped ? activeCard.answer : activeCard.question}
                  </p>
                </motion.div>

                {isFlipped ? (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => handleReview(false)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#A8514B] bg-[#FBEDEC] border border-[#F2C6C3] cursor-pointer"
                    >
                      <X className="w-4 h-4" /> errei
                    </button>
                    <button
                      onClick={() => handleReview(true)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#43805B] hover:bg-green-700 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> acertei
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-ceci-tertiary lowercase pt-1">toque no card para ver a resposta ♡</p>
                )}
              </>
            ) : null}
          </div>

          {reviewQueue.length > 0 && queueIndex < reviewQueue.length && (
            <div className="flex items-center justify-between px-1 text-xs text-ceci-muted">
              <span>{queueIndex + 1} de {reviewQueue.length}</span>
              <span>revisados: {reviewedCount}</span>
            </div>
          )}

          <button
            onClick={() => openWizard('flashcard')}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand cursor-pointer"
          >
            <Plus className="w-4 h-4" /> novo flashcard
          </button>
        </div>
      )}

      {/* LEITURAS */}
      {subTab === 'leituras' && (
        <div className="space-y-3">
          {readings.length === 0 ? (
            <div className="rounded-[24px] p-6 bg-white border border-ceci-border-default shadow-sm text-center space-y-3">
              <Kitty expression="curiosa" className="w-14 h-14 mx-auto" decorative />
              <p className="text-xs text-ceci-secondary leading-relaxed">
                nenhuma leitura anotada ainda. que tal adicionar seu primeiro livro ou artigo ♡
              </p>
            </div>
          ) : (
            [...readings]
              .sort((a, b) => {
                const order = { nao_iniciado: 0, lendo: 1, concluido: 2 } as const;
                return order[a.status] - order[b.status];
              })
              .map((r) => {
                const pct = r.totalPages
                  ? Math.round(((r.readPages || 0) / r.totalPages) * 100)
                  : r.status === 'concluido'
                    ? 100
                    : 0;
                const isDone = r.status === 'concluido';
                return (
                  <div
                    key={r.id}
                    className={`rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm space-y-3 ${
                      isDone ? 'opacity-70' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-xs text-ceci-primary leading-snug line-clamp-2">{r.title}</h3>
                        <p className="text-[11px] text-ceci-secondary mt-0.5">
                          {r.author} · {courseName(r.courseId)}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
                          isDone
                            ? 'bg-[#F2FAF5] text-[#43805B] border-[#C2E8D0]'
                            : r.status === 'lendo'
                              ? 'bg-[#F3F9FC] text-ceci-academic-strong border-ceci-border-academic'
                              : 'bg-surface-muted text-ceci-tertiary border-ceci-border-default'
                        }`}
                      >
                        {READING_STATUS_LABEL[r.status]}
                      </span>
                    </div>

                    {r.totalPages ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-ceci-secondary">
                          <span>{r.readPages || 0} de {r.totalPages} páginas</span>
                          <span className="font-semibold text-ceci-brand-strong">{pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-surface-muted border border-ceci-border-subtle rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#E97891] to-ceci-brand-strong rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ) : null}

                    <button
                      onClick={() => setReaderModalReading(r)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold text-white bg-ceci-primary hover:bg-[#282022] cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      {isDone ? 'reler leitura' : r.status === 'lendo' ? 'continuar leitura' : 'iniciar leitura'}
                    </button>
                  </div>
                );
              })
          )}

          <button
            onClick={() => openWizard('reading')}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold text-ceci-academic-strong bg-[#F3F9FC] border border-ceci-border-academic cursor-pointer"
          >
            <Plus className="w-4 h-4" /> nova leitura
          </button>
        </div>
      )}

{/* QUESTÕES — Modo Quiz (abre QuizCategorySelector via nav stack) */}
       {subTab === 'questoes' && (
         <div className="space-y-3">
           {questions.length === 0 ? (
             <div className="rounded-[24px] p-6 bg-white border border-ceci-border-default shadow-sm text-center space-y-4">
               <Kitty expression="pensativa" className="w-14 h-14 mx-auto" decorative />
               <div>
                 <h3 className="font-display font-bold text-base text-ceci-primary">acervo vazio</h3>
                 <p className="text-xs text-ceci-secondary mt-1.5 leading-relaxed">
                   o banco de questões ainda não carregou. tente novamente em instantes ♡
                 </p>
               </div>
             </div>
           ) : (
             <div className="space-y-3">
               <div className="rounded-[24px] p-6 bg-white border border-ceci-border-default shadow-sm text-center space-y-4">
                 <Kitty expression="pensativa" className="w-14 h-14 mx-auto" decorative />
                 <div>
                   <h3 className="font-display font-bold text-base text-ceci-primary">quiz de questões do acervo</h3>
                   <p className="text-xs text-ceci-secondary mt-1.5 leading-relaxed">
                     {questions.length} questões de múltipla escolha organizadas por área, tema e escola ♡
                   </p>
                 </div>
                 <button
                   onClick={() => openQuizCategory()}
                   className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold text-white bg-[#E97891] hover:bg-[#D85F79] cursor-pointer"
                 >
                   <Target className="w-4 h-4" /> começar quiz
                 </button>
               </div>
             </div>
           )}
         </div>
       )}

      {/* HISTÓRICO DE SESSÕES */}
      {subTab === 'historico' && (
        <div className="space-y-3">
          <div className="rounded-[24px] p-5 bg-[#FFF8F1] border border-[#FFF1E5] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-full bg-white border border-[#FFE2CC] flex items-center justify-center">
                <Flame className="w-4 h-4 text-[#B94862] fill-[#E97891]" />
              </span>
              <div>
                <p className="text-xs font-semibold text-ceci-primary">foco nesta semana</p>
                <p className="text-[11px] text-ceci-secondary">{focusDaysCount} {focusDaysCount === 1 ? 'dia' : 'dias'} · {weekSessions.length} {weekSessions.length === 1 ? 'sessão' : 'sessões'}</p>
              </div>
            </div>
            <span className="font-display font-bold text-lg text-ceci-primary">{weekFocusMinutes} min</span>
          </div>

          {sortedSessions.length === 0 ? (
            <div className="rounded-[24px] p-6 bg-white border border-ceci-border-default shadow-sm text-center space-y-3">
              <Kitty expression="sonolenta" className="w-14 h-14 mx-auto" decorative />
              <p className="text-xs text-ceci-secondary leading-relaxed">
                nenhuma sessão anotada ainda. quando você concluir seu primeiro foco, ela aparece aqui ♡
              </p>
              <button
                onClick={() => setSubTab('sessoes')}
                className="mx-auto bg-[#E97891] hover:bg-[#D85F79] text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xs cursor-pointer"
              >
                <span className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5 fill-white" /> começar a estudar</span>
              </button>
            </div>
          ) : (
            sortedSessions.map((s) => (
              <div
                key={s.id}
                className="rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-xs text-ceci-primary truncate">{s.topic}</h3>
                  </div>
                  <p className="text-[11px] text-ceci-secondary mt-1">
                    {courseName(s.courseId)} · {new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).toLowerCase()}
                  </p>
                </div>
                <span className="text-xs font-bold text-ceci-brand-strong bg-surface-rose px-3 py-1.5 rounded-full border border-ceci-border-brand shrink-0">
                  {s.durationMinutes} min
                </span>
              </div>
            ))
          )}

          <button
            onClick={() => setSubTab('sessoes')}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold text-white bg-[#E97891] hover:bg-[#D85F79] cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" /> nova sessão de foco
          </button>
        </div>
      )}

      {/* Reader Mode Modal */}
      <ReaderModeModal
        isOpen={!!readerModalReading}
        onClose={() => setReaderModalReading(null)}
        reading={readerModalReading}
        onUpdateProgress={handleUpdateReadingPages}
      />

    </div>
  );
};
