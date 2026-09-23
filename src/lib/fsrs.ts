import { Flashcard } from '../types/entity';

export type FSRSQuality = 0 | 1 | 2 | 3;

export const FSRS_PARAMS = [0.4,0.6,2.4,5.8,4.93,0.94,0.86,0.01,1.49,0.14,0.94,2.18,0.05,0.34,1.26,0.29,2.61];

export function todayISO(): string {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.max(0, Math.round((db.getTime() - da.getTime()) / 86400000));
}

export function initCard(card: Partial<Flashcard> = {}): Flashcard {
  const now = todayISO();
  return {
    id: card.id ?? `f-${Date.now()}`,
    workspaceId: card.workspaceId,
    deckId: card.deckId,
    conceptId: card.conceptId,
    courseId: card.courseId,
    question: card.question ?? '',
    answer: card.answer ?? '',
    stability: 0,
    difficulty: 5,
    due: now,
    state: 'new',
    reviews: 0,
    lapses: 0,
    retrievability: 1,
    ...card,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function schedule(card: Flashcard, quality: FSRSQuality, nowIso = todayISO()): Flashcard {
  const s = card.stability ?? 0.1;
  const d = clamp(card.difficulty ?? 5, 0.01, 10);
  const lastDue = card.due ?? nowIso;
  const delta = daysBetween(lastDue, nowIso);
  const retrievability = Math.exp(-Math.log(2) / Math.max(0.01, s) * Math.max(0, delta));

  let newStability = s;
  let newDifficulty = d;
  let lapses = card.lapses ?? 0;
  let state = card.state ?? 'new';

  // Simplificação FSRS: ajuste baseado em qualidade
  if (quality === 0) {
    // Again
    lapses = lapses + 1;
    newStability = Math.max(0.1, s * 0.2);
    newDifficulty = clamp(d + 0.4, 0.01, 10);
    state = 'relearning';
  } else if (quality === 1) {
    // Hard
    newStability = Math.max(0.1, s * 1.2);
    newDifficulty = clamp(d + 0.15, 0.01, 10);
    state = card.state === 'new' ? 'learning' : 'review';
  } else if (quality === 2) {
    // Good
    newStability = s * 2.5;
    newDifficulty = clamp(d - 0.1, 0.01, 10);
    state = 'review';
  } else if (quality === 3) {
    // Easy
    newStability = s * 3.5;
    newDifficulty = clamp(d - 0.15, 0.01, 10);
    state = 'review';
  }

  const desiredRetention = 0.9;
  const interval = Math.max(1, Math.round(newStability * Math.log(desiredRetention) / Math.log(0.5)));
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);
  const due = dueDate.toISOString().slice(0,10);

  const newRetrievability = Math.exp(-Math.log(2) / Math.max(0.01, newStability) * interval);

  return {
    ...card,
    stability: newStability,
    difficulty: newDifficulty,
    due,
    retrievability: newRetrievability,
    lapses,
    reviews: (card.reviews ?? 0) + 1,
    lastInterval: interval,
    lastReviewed: nowIso,
    state,
  };
}

export function isDue(card: Flashcard, nowIso = todayISO()): boolean {
  if (!card.due) return true;
  return card.due <= nowIso;
}

/**
 * Intervalos da repetição espaçada legada (pré-FSRS) — usados como fallback
 * apenas para cartões que ainda não têm `due` (imports de backups antigos).
 */
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30];

export const legacyIntervalFor = (timesReviewed = 0) =>
  REVIEW_INTERVALS[Math.min(timesReviewed, REVIEW_INTERVALS.length - 1)];

/**
 * Cartão aguardando revisão no dia `nowIso`. FSRS-first: usa `due` (fonte única).
 * Fallback legado para cartões sem `due`: nunca revisado ou intervalo completado.
 */
export function isCardDue(card: Flashcard, nowIso = todayISO()): boolean {
  if (card.due) return card.due <= nowIso;
  const last = (card.lastReviewed ?? '').slice(0, 10);
  if (!last) return true;
  return daysBetween(last, nowIso) >= legacyIntervalFor(card.timesReviewed);
}

/** Dias até o próximo vencimento (0 = já vencido hoje). */
export function daysUntilDue(card: Flashcard, nowIso = todayISO()): number {
  if (card.due) return Math.max(0, daysBetween(nowIso, card.due));
  const last = (card.lastReviewed ?? '').slice(0, 10);
  if (!last) return 0;
  return Math.max(0, legacyIntervalFor(card.timesReviewed) - daysBetween(last, nowIso));
}

/** Rótulo curto de quando o cartão volta (para botões/cards da UI). */
export function nextDueLabel(card: Flashcard, nowIso = todayISO()): string {
  const d = daysUntilDue(card, nowIso);
  if (d <= 0) return 'hoje';
  if (d === 1) return 'amanhã';
  return `em ${d} dias`;
}

export interface FlashcardCounts {
  news: number;
  learning: number;
  review: number;
  relearning: number;
}

/** Contagem por estado FSRS (pilha estilo Anki "novas · aprendendo · revisar"). */
export function cardCounts(cards: Flashcard[]): FlashcardCounts {
  const counts: FlashcardCounts = { news: 0, learning: 0, review: 0, relearning: 0 };
  for (const c of cards) {
    if (c.state === 'learning') counts.learning += 1;
    else if (c.state === 'relearning') counts.relearning += 1;
    else if (c.state === 'review') counts.review += 1;
    else counts.news += 1;
  }
  return counts;
}

const RATING_META: ReadonlyArray<{ quality: FSRSQuality; label: string }> = [
  { quality: 0, label: 'esqueci' },
  { quality: 1, label: 'custei' },
  { quality: 2, label: 'lembrei' },
  { quality: 3, label: 'fácil' },
];

/** Etiquetas das avaliações (ordem = quality) para exibição em botões/testes. */
export const RATING_LABELS = RATING_META.map((r) => r.label);

/** Intervalo impresso curto para a barra de avaliação (estilo Anki). */
export function shortInterval(days: number): string {
  if (days <= 0) return '<1m';
  if (days < 2) return '1d';
  if (days < 7) return `${Math.round(days)}d`;
  if (days < 14) return '1sem';
  if (days < 28) return `${Math.round(days / 7)}sem`;
  if (days < 60) return '1mês';
  return `${Math.round(days / 30)}m`;
}

export interface RatingInterval {
  quality: FSRSQuality;
  label: string;
  /** Próximo vencimento previsto (ex.: "3d", "1sem"). */
  interval: string;
}

/**
 * Preview dos 4 próximos vencimentos para o cartão atual (chama `schedule` por
 * qualidade sem persistir) — usado para imprimir o intervalo em cada botão.
 */
export function ratingIntervals(card: Flashcard, nowIso = todayISO()): RatingInterval[] {
  return RATING_META.map(({ quality, label }) => {
    const next = schedule(card, quality, nowIso);
    return { quality, label, interval: shortInterval(daysUntilDue(next, nowIso)) };
  });
}
