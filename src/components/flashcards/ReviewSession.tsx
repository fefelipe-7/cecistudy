import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { RefreshCcw, Undo2 } from 'lucide-react';
import { celebrate } from '../../lib/celebrate';
import { hapticSuccess } from '../../lib/haptics';
import { cardCounts, daysUntilDue, isCardDue, ratingIntervals, type FSRSQuality } from '../../lib/fsrs';
import type { Flashcard } from '../../types';
import { Card3D } from '../flashcards/Card3D';
import { RatingBar, type RatingOption } from '../flashcards/RatingBar';

export interface ReviewSessionProps {
  /** Todos os flashcards (para contagens e "revisar todos"). */
  allCards: Flashcard[];
  /** Fila inicial (vencidos hoje). Se vazio, mostra estado "em dia". */
  dueCards: Flashcard[];
  profileName: string;
  /** Aplica o veredito no cartão (persiste FSRS). */
  onGrade: (id: string, quality: FSRSQuality) => void;
  /** Restaura o snapshot anterior do cartão (undo). */
  onRestore: (card: Flashcard) => void;
  /** Ações de gestão (long press → menu do item). */
  onManage: (id: string) => void;
}

const GRADE_LABELS: Record<FSRSQuality, string> = {
  0: 'esqueci',
  1: 'custei',
  2: 'lembrei',
  3: 'fácil',
};

/**
 * Sessão de revisão estilo Anki (spec FLASH): pilha de cartões vencidos com
 * scheduler FSRS único, flip 3D, swipe apenas após revelar, undo de veredito,
 * contagens por estado e próximo vencimento previsto em cada botão.
 */
export const ReviewSession: React.FC<ReviewSessionProps> = ({
  allCards,
  dueCards,
  profileName,
  onGrade,
  onRestore,
  onManage,
}) => {
  const [reviewQueue, setReviewQueue] = useState<Flashcard[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [undoStack, setUndoStack] = useState<Flashcard[]>([]);
  const [announced, setAnnounced] = useState('');
  const busyRef = useRef(false);

  const dragX = useMotionValue(0);
  const cardRotate = useTransform(dragX, [-140, 140], [-6, 6]);

  // Monta a fila na primeira entrada / quando o deck muda de origem.
  useEffect(() => {
    setReviewQueue(dueCards);
    setQueueIndex(0);
    setIsFlipped(false);
    setReviewedCount(0);
    setUndoStack([]);
    setAnnounced('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mantém a fila coerente: remove cartões excluídos durante a sessão.
  useEffect(() => {
    setReviewQueue((q) => {
      const ids = new Set(allCards.map((c) => c.id));
      const kept = q.filter((c) => ids.has(c.id));
      return kept.length === q.length ? q : kept;
    });
  }, [allCards]);

  // Libera o próximo veredito quando o cartão muda (anti double-tap).
  useEffect(() => {
    busyRef.current = false;
  }, [queueIndex, reviewQueue]);

  const activeCard = reviewQueue[queueIndex];
  const isFinished = reviewQueue.length > 0 && queueIndex >= reviewQueue.length;

  const counts = useMemo(() => cardCounts(allCards.filter((c) => isCardDue(c))), [allCards]);
  const countChips = [
    counts.news > 0 && { label: 'novas', value: counts.news },
    (counts.learning + counts.relearning) > 0 && {
      label: 'aprendendo',
      value: counts.learning + counts.relearning,
    },
    counts.review > 0 && { label: 'revisar', value: counts.review },
  ].filter(Boolean) as { label: string; value: number }[];

  const ratingOptions = useMemo<RatingOption[]>(
    () => activeCard && isFlipped ? ratingIntervals(activeCard).map((r) => ({ ...r })) : [],
    [activeCard, isFlipped]
  );

  // Próxima rodada: menor intervalo entre os cartões recém-revisados.
  const nextRoundInDays = useMemo(() => {
    const reviewedIds = new Set(reviewQueue.map((c) => c.id));
    const reviewed = allCards.filter(
      (c) => reviewedIds.has(c.id) && c.lastReviewed && c.due
    );
    if (reviewed.length === 0) return null;
    return Math.min(...reviewed.map((c) => Math.max(1, daysUntilDue(c))));
  }, [allCards, reviewQueue]);

  const buildQueue = (cards: Flashcard[]) => {
    setReviewQueue(cards);
    setQueueIndex(0);
    setIsFlipped(false);
    setReviewedCount(0);
    setUndoStack([]);
    setAnnounced('');
  };

  const grade = (quality: FSRSQuality) => {
    if (!activeCard || busyRef.current) return;
    busyRef.current = true;
    setUndoStack((stack) => [...stack, activeCard]);
    onGrade(activeCard.id, quality);
    setAnnounced(GRADE_LABELS[quality]);
    setReviewedCount((c) => c + 1);
    const finished = queueIndex + 1 >= reviewQueue.length;
    setQueueIndex((i) => i + 1);
    setIsFlipped(false);
    dragX.set(0);
    if (finished) {
      celebrate('flashcards-done');
      hapticSuccess();
    }
  };

  const undo = () => {
    const snapshot = undoStack[undoStack.length - 1];
    if (!snapshot) return;
    onRestore(snapshot);
    setUndoStack((stack) => stack.slice(0, -1));
    setAnnounced('veredito desfeito');
    setQueueIndex((i) => Math.max(0, i - 1));
    setReviewedCount((c) => (isFinished ? c : Math.max(0, c - 1)));
    setIsFlipped(false);
    dragX.set(0);
  };

  const handleCardDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isFlipped) return;
    if (info.offset.x < -80 || info.velocity.x < -500) grade(0);
    else if (info.offset.x > 80 || info.velocity.x > 500) grade(2);
  };

  // ---- Estados vazios/fim ----
  if (reviewQueue.length === 0 && reviewedCount === 0) {
    return (
      <div className="rounded-2xl p-6 bg-surface-default border border-ceci-border-default shadow-sm text-center space-y-4">
        <div className="py-6 space-y-3">
          <div role="presentation" aria-hidden="true" className="mx-auto text-3xl">✨</div>
          <div>
            <h3 className="font-display font-bold text-base text-ceci-primary">tudo em dia por aqui!</h3>
            <p className="text-xs text-ceci-secondary mt-1.5 leading-relaxed">
              nenhum flashcard precisa de revisão agora. pode dar uma volta ou revisar todos de novo.
            </p>
          </div>
          {allCards.length > 0 && (
            <button
              onClick={() => buildQueue(allCards)}
              className="mx-auto flex items-center gap-1.5 bg-ceci-primary hover:bg-ceci-primary-hover text-ceci-on-primary px-5 py-2.5 rounded-full text-xs font-semibold shadow-xs cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> revisar todos ({allCards.length})
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isFinished) {
    const name = profileName.trim();
    return (
      <div className="rounded-2xl p-6 bg-surface-default border border-ceci-border-default shadow-sm text-center space-y-4">
        <div className="py-6 space-y-3">
          <div role="presentation" aria-hidden="true" className="mx-auto text-3xl">🎉</div>
          <div>
            <h3 className="font-display font-bold text-base text-ceci-primary">
              revisão concluída{name ? `, parabéns ${name}` : ', parabéns'}! ♡
            </h3>
            <p className="text-xs text-ceci-secondary mt-1.5">
              você revisou {reviewedCount} {reviewedCount === 1 ? 'cartão' : 'cartões'} hoje.
              {nextRoundInDays !== null &&
                ` a próxima rodada volta em ${nextRoundInDays} ${nextRoundInDays === 1 ? 'dia' : 'dias'} ♡`}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            {undoStack.length > 0 && (
              <button
                onClick={undo}
                className="flex items-center gap-1.5 bg-surface-muted text-ceci-secondary border border-ceci-border-default px-4 py-2.5 rounded-full text-xs font-semibold cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" /> desfazer
              </button>
            )}
            <button
              onClick={() => buildQueue([])}
              className="bg-ceci-primary hover:bg-ceci-primary-hover text-ceci-on-primary px-5 py-2.5 rounded-full text-xs font-semibold shadow-xs cursor-pointer"
            >
              fechar revisão
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!activeCard) return null;

  return (
    <div className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-4">
      {/* barra de status */}
      <div className="flex items-center justify-between gap-2 text-xs text-ceci-tertiary">
        <span>
          card {queueIndex + 1} de {reviewQueue.length}
        </span>
        {countChips.length > 0 && (
          <span className="flex items-center gap-1.5">
            {countChips.map((chip) => (
              <span key={chip.label} className="rounded-full bg-surface-rose border border-ceci-border-brand px-2 py-0.5 text-[10px] font-semibold text-ceci-brand-strong">
                {chip.label}: {chip.value}
              </span>
            ))}
          </span>
        )}
      </div>

      {/* palco 3D (swipe só liberado após revelar) */}
      <div className="relative w-full max-w-[20rem] mx-auto">
        {/* pilha 2D atrás */}
        {[1, 2].map((offset) => {
          const behind = reviewQueue[queueIndex + offset];
          if (!behind) return null;
          return (
            <div
              key={`${offset}-${behind.id}`}
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl bg-surface-muted border border-ceci-border-default pointer-events-none"
              style={{
                transform: `translateY(${offset * 8}px) scale(${1 - offset * 0.045})`,
                zIndex: -offset,
              }}
            />
          );
        })}

        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={handleCardDragEnd}
          style={{ x: dragX, rotate: cardRotate }}
          whileTap={{ scale: 0.99 }}
          className="touch-pan-y"
        >
          <Card3D
            key={activeCard.id}
            flipped={isFlipped}
            onFlipChange={setIsFlipped}
            onLongPress={() => onManage(activeCard.id)}
            ariaLabel={`cartão de estudo ${queueIndex + 1} de ${reviewQueue.length}`}
            frontClassName="flex flex-col items-center justify-center gap-2 p-6 text-center"
            backClassName="flex flex-col items-center justify-center gap-2 p-6 text-center"
            front={
              <>
                <span className="text-[10px] font-semibold text-ceci-muted uppercase tracking-wider select-none">pergunta ❓</span>
                <p className="font-display font-bold text-base text-ceci-primary select-none break-words">{activeCard.question}</p>
              </>
            }
            back={
              <>
                <span className="text-[10px] font-semibold text-ceci-brand-strong uppercase tracking-wider select-none">resposta ✨</span>
                <p className="text-sm text-ceci-primary select-none break-words leading-relaxed">{activeCard.answer}</p>
              </>
            }
          />
        </motion.div>
      </div>

      {/* feedback de veredito (aria-live) */}
      <p role="status" aria-live="polite" className="sr-only">
        {announced}
      </p>

      {isFlipped ? (
        <RatingBar options={ratingOptions} onGrade={grade} />
      ) : (
        <button
          onClick={() => setIsFlipped(true)}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-ceci-primary hover:bg-ceci-primary-hover text-ceci-on-primary text-xs font-semibold shadow-xs cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" /> mostrar resposta
        </button>
      )}

      {/* rodapé da sessão */}
      <div className="flex items-center justify-between px-1 text-[11px] text-ceci-muted">
        <span className="flex items-center gap-1">
          {undoStack.length > 0 && (
            <button
              onClick={undo}
              className="flex items-center gap-1 text-ceci-secondary hover:text-ceci-primary cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" /> desfazer
            </button>
          )}
        </span>
        <span>revisados: {reviewedCount}</span>
      </div>
    </div>
  );
};

export default ReviewSession;