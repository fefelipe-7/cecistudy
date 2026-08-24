/**
 * Lógica de revisão espaçada de flashcards — pura e testável.
 *
 * Fonte única usada por EstudosView, HomeView e StudyRevisarScreen
 * (antes duplicada em cada um deles).
 */

/** Intervalo de revisão (dias) por nº de revisões. */
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30];

export const intervalFor = (timesReviewed = 0) =>
  REVIEW_INTERVALS[Math.min(timesReviewed, REVIEW_INTERVALS.length - 1)];

export const daysSince = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

export interface DueCard {
  lastReviewed?: string;
  timesReviewed?: number;
}

/** Cartão vencido: nunca revisado ou intervalo atual já completado. */
export const isDueToday = (card: DueCard) =>
  !card.lastReviewed || daysSince(card.lastReviewed) >= intervalFor(card.timesReviewed);
