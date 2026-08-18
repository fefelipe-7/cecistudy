import React, { useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { Plus, X, CheckCircle2, RefreshCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Kitty } from '../ui/Kitty';
import { useLongPress } from '../../lib/useLongPress';
import { celebrate } from '../../lib/celebrate';
import { hapticSuccess } from '../../lib/haptics';
import type { Flashcard } from '../../types';

/** Intervalo de revisão (dias) por nº de revisões — repetição espaçada simples. */
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const intervalFor = (timesReviewed = 0) =>
  REVIEW_INTERVALS[Math.min(timesReviewed, REVIEW_INTERVALS.length - 1)];
const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const isDueToday = (card: Flashcard) =>
  !card.lastReviewed || daysSince(card.lastReviewed) >= intervalFor(card.timesReviewed);

/** Tela dedicada de revisão de flashcards (fila da sessão). */
export const StudyRevisarScreen: React.FC = () => {
  const { flashcards, handleReviewFlashcard, openWizard, openManageItem } = useApp();

  const [reviewQueue, setReviewQueue] = useState<Flashcard[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const dragX = useMotionValue(0);
  const cardRotate = useTransform(dragX, [-140, 140], [-6, 6]);

  const dueCards = useMemo(() => flashcards.filter(isDueToday), [flashcards]);
  const activeCard = reviewQueue[queueIndex];

  // Monta a fila ao entrar na tela
  useEffect(() => {
    setReviewQueue(dueCards);
    setQueueIndex(0);
    setIsFlipped(false);
    setReviewedCount(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const cardHandlers = useLongPress({
    onLongPress: () => {
      if (!activeCard) return;
      openManageItem('flashcard', activeCard.id);
    },
    onClick: () => setIsFlipped((f) => !f),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md sm:max-w-xl mx-auto space-y-4"
    >
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
                className="mx-auto flex items-center gap-1.5 bg-ceci-primary hover:bg-ceci-primary-hover text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xs cursor-pointer"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> revisar todos ({flashcards.length})
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
              className="mx-auto bg-ceci-primary hover:bg-ceci-primary-hover text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xs cursor-pointer"
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
              {...cardHandlers}
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
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-700 bg-red-50 border border-red-200 cursor-pointer"
                >
                  <X className="w-4 h-4" /> errei
                </button>
                <button
                  onClick={() => handleReview(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-green-700 hover:bg-green-700 cursor-pointer"
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
    </motion.div>
  );
};
